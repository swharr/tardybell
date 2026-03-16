import type {
  CoreSelectionKey,
  CourseRecord,
  GeneratedScheduleOption,
  GradeProfile,
  Period,
  ScheduleGrid,
  SemesterKey,
} from '@/types/schedule';
import {
  createEmptyScheduleGrid,
  getCourseNamesFromCompleted,
  groupCoursesByNormalizedName,
  scheduleSignature,
} from '@/utils/courseUtils';

type GeneratorInput = {
  gradeProfile: GradeProfile;
  completedCourses: CourseRecord[];
  coreSelections: Record<CoreSelectionKey, string | null>;
  electiveSelections: Array<string | null>;
  courses: CourseRecord[];
};

type Slot = {
  semester: SemesterKey;
  day: 'A' | 'B';
  period: Period;
};

type SearchState = {
  schedule: ScheduleGrid;
  usedNames: Set<string>;
  selectedCourseIds: Set<string>;
  matchedElectives: Set<string>;
  filledByFallbackCourses: Set<string>;
};

const SLOT_ORDER: Slot[] = [
  { semester: 'sem1', day: 'A', period: 1 },
  { semester: 'sem1', day: 'A', period: 2 },
  { semester: 'sem1', day: 'A', period: 3 },
  { semester: 'sem1', day: 'A', period: 4 },
  { semester: 'sem1', day: 'B', period: 5 },
  { semester: 'sem1', day: 'B', period: 6 },
  { semester: 'sem1', day: 'B', period: 7 },
  { semester: 'sem1', day: 'B', period: 8 },
  { semester: 'sem2', day: 'A', period: 1 },
  { semester: 'sem2', day: 'A', period: 2 },
  { semester: 'sem2', day: 'A', period: 3 },
  { semester: 'sem2', day: 'A', period: 4 },
  { semester: 'sem2', day: 'B', period: 5 },
  { semester: 'sem2', day: 'B', period: 6 },
  { semester: 'sem2', day: 'B', period: 7 },
  { semester: 'sem2', day: 'B', period: 8 },
];

function cloneSchedule(schedule: ScheduleGrid): ScheduleGrid {
  return {
    sem1: { A: { ...schedule.sem1.A }, B: { ...schedule.sem1.B } },
    sem2: { A: { ...schedule.sem2.A }, B: { ...schedule.sem2.B } },
  };
}

function courseFitsSlot(course: CourseRecord, slot: Slot) {
  if (course.day !== slot.day || course.period !== slot.period) {
    return false;
  }
  if (course.semester === 'Both') {
    return slot.semester === 'sem1';
  }
  return course.semester === (slot.semester === 'sem1' ? 'S1' : 'S2');
}

function canUseCourse(
  course: CourseRecord,
  gradeProfile: GradeProfile,
  completedNames: Set<string>,
  selectedNames: Set<string>,
  explicitlyRequestedSpecials: Set<string>,
) {
  if (!course.allowedGrades.includes(gradeProfile)) {
    return false;
  }

  if (selectedNames.has(course.normalizedName)) {
    return false;
  }

  if (course.isSpecialPlacement && !explicitlyRequestedSpecials.has(course.normalizedName)) {
    return false;
  }

  return course.prerequisiteCourseNames.every(
    (prerequisite) => completedNames.has(prerequisite) || selectedNames.has(prerequisite),
  );
}

function markCourseOnSchedule(schedule: ScheduleGrid, course: CourseRecord) {
  const next = cloneSchedule(schedule);
  if (course.semester === 'Both') {
    next.sem1[course.day][course.period] = course.id;
    next.sem2[course.day][course.period] = course.id;
  } else if (course.semester === 'S1') {
    next.sem1[course.day][course.period] = course.id;
  } else {
    next.sem2[course.day][course.period] = course.id;
  }
  return next;
}

function slotIsFilled(schedule: ScheduleGrid, slot: Slot) {
  return Boolean(schedule[slot.semester][slot.day][slot.period]);
}

function scoreElectives(matchedElectives: Set<string>, electivePriority: string[]) {
  return electivePriority.reduce((total, electiveName, index) => {
    if (matchedElectives.has(electiveName)) {
      return total + (electivePriority.length - index);
    }
    return total;
  }, 0);
}

function distinctBySignature(options: GeneratedScheduleOption[]) {
  const seen = new Set<string>();
  return options.filter((option) => {
    const signature = scheduleSignature({ sem1: option.sem1, sem2: option.sem2 });
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
}

function generateCoreBases(
  requiredCoreNames: string[],
  coursesByName: Record<string, CourseRecord[]>,
  gradeProfile: GradeProfile,
  completedNames: Set<string>,
  explicitlyRequestedSpecials: Set<string>,
) {
  const bases: SearchState[] = [];

  function backtrack(index: number, state: SearchState) {
    if (bases.length >= 60) {
      return;
    }
    if (index >= requiredCoreNames.length) {
      bases.push(state);
      return;
    }

    const requiredName = requiredCoreNames[index];
    const sections = coursesByName[requiredName] ?? [];

    for (const section of sections) {
      if (
        !canUseCourse(section, gradeProfile, completedNames, state.usedNames, explicitlyRequestedSpecials) ||
        (section.semester === 'Both' &&
          (state.schedule.sem1[section.day][section.period] || state.schedule.sem2[section.day][section.period])) ||
        (section.semester === 'S1' && state.schedule.sem1[section.day][section.period]) ||
        (section.semester === 'S2' && state.schedule.sem2[section.day][section.period])
      ) {
        continue;
      }

      backtrack(index + 1, {
        ...state,
        schedule: markCourseOnSchedule(state.schedule, section),
        usedNames: new Set(state.usedNames).add(section.normalizedName),
        selectedCourseIds: new Set(state.selectedCourseIds).add(section.id),
        matchedElectives: new Set(state.matchedElectives),
        filledByFallbackCourses: new Set(state.filledByFallbackCourses),
      });
    }
  }

  backtrack(0, {
    schedule: createEmptyScheduleGrid(),
    usedNames: new Set<string>(),
    selectedCourseIds: new Set<string>(),
    matchedElectives: new Set<string>(),
    filledByFallbackCourses: new Set<string>(),
  });

  return bases;
}

function generateSchedulesForBase(
  baseState: SearchState,
  eligibleCourses: CourseRecord[],
  electivePriority: string[],
  gradeProfile: GradeProfile,
  completedNames: Set<string>,
  explicitlyRequestedSpecials: Set<string>,
) {
  const options: GeneratedScheduleOption[] = [];
  const candidateBySlot = new Map<string, CourseRecord[]>();

  for (const slot of SLOT_ORDER) {
    candidateBySlot.set(
      `${slot.semester}-${slot.day}-${slot.period}`,
      eligibleCourses.filter((course) => courseFitsSlot(course, slot)),
    );
  }

  function search(slotIndex: number, state: SearchState) {
    if (options.length >= 8) {
      return;
    }
    if (slotIndex >= SLOT_ORDER.length) {
      options.push({
        sem1: state.schedule.sem1,
        sem2: state.schedule.sem2,
        score: scoreElectives(state.matchedElectives, electivePriority),
        matchedElectives: Array.from(state.matchedElectives),
        filledByFallbackCourses: Array.from(state.filledByFallbackCourses),
      });
      return;
    }

    const slot = SLOT_ORDER[slotIndex];
    if (slotIsFilled(state.schedule, slot)) {
      search(slotIndex + 1, state);
      return;
    }

    const slotKey = `${slot.semester}-${slot.day}-${slot.period}`;
    const candidates = (candidateBySlot.get(slotKey) ?? [])
      .filter((course) => canUseCourse(course, gradeProfile, completedNames, state.usedNames, explicitlyRequestedSpecials))
      .sort((left, right) => {
        const leftRank = electivePriority.indexOf(left.normalizedName);
        const rightRank = electivePriority.indexOf(right.normalizedName);
        const normalizedLeftRank = leftRank === -1 ? Number.MAX_SAFE_INTEGER : leftRank;
        const normalizedRightRank = rightRank === -1 ? Number.MAX_SAFE_INTEGER : rightRank;
        if (normalizedLeftRank !== normalizedRightRank) {
          return normalizedLeftRank - normalizedRightRank;
        }
        return left.name.localeCompare(right.name);
      });

    for (const candidate of candidates) {
      const requestedElective = electivePriority.includes(candidate.normalizedName);
      const nextMatchedElectives = new Set(state.matchedElectives);
      const nextFallback = new Set(state.filledByFallbackCourses);
      if (requestedElective) {
        nextMatchedElectives.add(candidate.normalizedName);
      } else if (!state.usedNames.has(candidate.normalizedName)) {
        nextFallback.add(candidate.normalizedName);
      }

      search(slotIndex + 1, {
        schedule: markCourseOnSchedule(state.schedule, candidate),
        usedNames: new Set(state.usedNames).add(candidate.normalizedName),
        selectedCourseIds: new Set(state.selectedCourseIds).add(candidate.id),
        matchedElectives: nextMatchedElectives,
        filledByFallbackCourses: nextFallback,
      });
    }
  }

  search(0, baseState);
  return options;
}

export function generateSchedules({
  gradeProfile,
  completedCourses,
  coreSelections,
  electiveSelections,
  courses,
}: GeneratorInput): GeneratedScheduleOption[] {
  const completedNames = getCourseNamesFromCompleted(completedCourses);
  const coursesByName = groupCoursesByNormalizedName(courses);
  const requiredCoreNames = Object.values(coreSelections).filter(Boolean) as string[];
  const electivePriority = electiveSelections.filter(Boolean) as string[];
  const explicitlyRequestedSpecials = new Set(
    electivePriority.filter((name) => {
      const sample = coursesByName[name]?.[0];
      return sample?.isSpecialPlacement;
    }),
  );

  const eligibleCourses = courses.filter(
    (course) =>
      course.allowedGrades.includes(gradeProfile) &&
      (!course.isSpecialPlacement || explicitlyRequestedSpecials.has(course.normalizedName)),
  );

  const coreBases = generateCoreBases(
    requiredCoreNames,
    coursesByName,
    gradeProfile,
    completedNames,
    explicitlyRequestedSpecials,
  );

  const options = coreBases.flatMap((base) =>
    generateSchedulesForBase(base, eligibleCourses, electivePriority, gradeProfile, completedNames, explicitlyRequestedSpecials),
  );

  return distinctBySignature(options)
    .sort((left, right) => right.score - left.score || left.filledByFallbackCourses.length - right.filledByFallbackCourses.length)
    .slice(0, 3);
}
