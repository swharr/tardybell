import type {
  CourseRecord,
  GradeProfile,
  Period,
  ScheduleGrid,
  SemesterKey,
} from '@/types/schedule';
import { createEmptyScheduleGrid, groupCoursesByNormalizedName } from '@/utils/courseUtils';

type Slot = {
  semester: SemesterKey;
  day: 'A' | 'B';
  period: Period;
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

function slotIsFree(schedule: ScheduleGrid, slot: Slot): boolean {
  return !schedule[slot.semester][slot.day][slot.period];
}

function placeCourse(schedule: ScheduleGrid, course: CourseRecord): ScheduleGrid {
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

function sectionFitsSlot(course: CourseRecord, slot: Slot): boolean {
  if (course.day !== slot.day || course.period !== slot.period) return false;
  if (course.semester === 'Both') return slot.semester === 'sem1';
  return course.semester === (slot.semester === 'sem1' ? 'S1' : 'S2');
}

function canPlaceSection(schedule: ScheduleGrid, course: CourseRecord): boolean {
  if (course.semester === 'Both') {
    return (
      !schedule.sem1[course.day][course.period] &&
      !schedule.sem2[course.day][course.period]
    );
  }
  const sem = course.semester === 'S1' ? 'sem1' : 'sem2';
  return !schedule[sem][course.day][course.period];
}

/**
 * Mutually exclusive course groups — only one course from each group should be picked.
 * Each sub-array lists normalizedNames that fulfill the same requirement.
 */
const EXCLUSIVE_GROUPS: string[][] = [
  ['english 11', 'ap english language and composition'],
  ['us history', 'ap us history'],
  ['secondary math 3', 'secondary math 3 extended'],
];

/**
 * Given a normalizedName, returns any course names in the pool that are
 * mutually exclusive with it (i.e., in the same exclusive group).
 */
export function getExclusiveConflict(normalizedName: string, poolNames: string[]): string | null {
  for (const group of EXCLUSIVE_GROUPS) {
    if (group.includes(normalizedName)) {
      const conflict = poolNames.find((n) => n !== normalizedName && group.includes(n));
      if (conflict) return conflict;
    }
  }
  return null;
}

export type PoolScheduleResult = {
  schedule: ScheduleGrid;
  placed: string[];        // normalizedNames that were placed
  unplaced: string[];      // normalizedNames that couldn't fit
  conflicts: string[];     // human-readable conflict messages
};

/**
 * Given a list of desired course names from the pool (ordered by priority: must → want → nice),
 * try to place them all on a schedule using backtracking.
 * Priority groups are placed in order — must-haves first, then wants, then nice-to-haves.
 * Within each group, most constrained courses (fewest sections) are tried first.
 */
export function buildScheduleFromPool(
  poolNames: string[],
  allCourses: CourseRecord[],
  gradeProfile: GradeProfile,
  completedCourseNames: string[],
  priorityGroups?: { must: string[]; want: string[]; nice: string[] },
): PoolScheduleResult {
  const coursesByName = groupCoursesByNormalizedName(allCourses);

  // Build ordered list: must → want → nice, each sub-sorted by constraint
  const orderedNames = priorityGroups
    ? [...priorityGroups.must, ...priorityGroups.want, ...priorityGroups.nice]
    : poolNames;

  // For each pool course, find all available sections
  const poolSections: { name: string; sections: CourseRecord[] }[] = [];
  for (const name of orderedNames) {
    const sections = (coursesByName[name] ?? []).filter(
      (s) => s.allowedGrades.includes(gradeProfile),
    );
    poolSections.push({ name, sections });
  }

  // Within priority groups, sort by most constrained first
  if (priorityGroups) {
    const mustCount = priorityGroups.must.length;
    const wantCount = priorityGroups.want.length;
    const sortSlice = (start: number, end: number) => {
      const slice = poolSections.slice(start, end);
      slice.sort((a, b) => a.sections.length - b.sections.length);
      poolSections.splice(start, end - start, ...slice);
    };
    sortSlice(0, mustCount);
    sortSlice(mustCount, mustCount + wantCount);
    sortSlice(mustCount + wantCount, poolSections.length);
  } else {
    poolSections.sort((a, b) => a.sections.length - b.sections.length);
  }

  // Backtracking search
  type State = {
    schedule: ScheduleGrid;
    placed: string[];
    placedIds: Set<string>;
  };

  let bestResult: State | null = null;

  function backtrack(index: number, state: State) {
    // If we already found a perfect solution, stop
    if (bestResult && bestResult.placed.length === poolNames.length) return;

    if (index >= poolSections.length) {
      if (!bestResult || state.placed.length > bestResult.placed.length) {
        bestResult = { ...state, placed: [...state.placed], placedIds: new Set(state.placedIds) };
      }
      return;
    }

    const { name, sections } = poolSections[index];

    // Try each available section
    let placedAny = false;
    for (const section of sections) {
      if (canPlaceSection(state.schedule, section)) {
        placedAny = true;
        backtrack(index + 1, {
          schedule: placeCourse(state.schedule, section),
          placed: [...state.placed, name],
          placedIds: new Set(state.placedIds).add(section.id),
        });
        if (bestResult && bestResult.placed.length === poolNames.length) return;
      }
    }

    // Also try skipping this course (so we can still place others)
    if (!placedAny || (bestResult && bestResult.placed.length < poolNames.length)) {
      backtrack(index + 1, state);
    }
  }

  backtrack(0, {
    schedule: createEmptyScheduleGrid(),
    placed: [],
    placedIds: new Set(),
  });

  const result = bestResult ?? { schedule: createEmptyScheduleGrid(), placed: [], placedIds: new Set<string>() };
  const placedSet = new Set(result.placed);
  const unplaced = poolNames.filter((n) => !placedSet.has(n));

  // Generate conflict messages for unplaced courses
  const conflicts: string[] = [];
  for (const name of unplaced) {
    const sections = (coursesByName[name] ?? []).filter((s) => s.allowedGrades.includes(gradeProfile));
    if (sections.length === 0) {
      conflicts.push(`${sections[0]?.name ?? name}: not available for your grade level`);
    } else {
      // Find what's blocking each section
      const blockers: string[] = [];
      for (const section of sections) {
        const sem = section.semester === 'Both' ? 'sem1' : section.semester === 'S1' ? 'sem1' : 'sem2';
        const occupantId = result.schedule[sem][section.day][section.period];
        if (occupantId) {
          const occupant = allCourses.find((c) => c.id === occupantId);
          if (occupant && !blockers.includes(occupant.name)) {
            blockers.push(occupant.name);
          }
        }
      }
      const displayName = sections[0]?.name ?? name;
      if (blockers.length > 0) {
        conflicts.push(`${displayName} conflicts with ${blockers.join(', ')}`);
      } else {
        conflicts.push(`${displayName} couldn't be placed — no available time slots`);
      }
    }
  }

  return {
    schedule: result.schedule,
    placed: result.placed,
    unplaced,
    conflicts,
  };
}

/**
 * Detect conflicts in the pool before building.
 * Returns warning messages for courses that may be hard to place together.
 */
export function detectPoolConflicts(
  poolNames: string[],
  allCourses: CourseRecord[],
  gradeProfile: GradeProfile,
): string[] {
  const coursesByName = groupCoursesByNormalizedName(allCourses);
  const warnings: string[] = [];

  // Check for mutually exclusive courses
  for (const group of EXCLUSIVE_GROUPS) {
    const inPool = group.filter((n) => poolNames.includes(n));
    if (inPool.length > 1) {
      const displayNames = inPool.map((n) => coursesByName[n]?.[0]?.name ?? n);
      warnings.push(`You only need one of: ${displayNames.join(' or ')} — pick your favorite!`);
    }
  }

  // Check if any course has zero sections for this grade
  for (const name of poolNames) {
    const sections = (coursesByName[name] ?? []).filter(
      (s) => s.allowedGrades.includes(gradeProfile),
    );
    if (sections.length === 0) {
      const displayName = coursesByName[name]?.[0]?.name ?? name;
      warnings.push(`${displayName} isn't available for your grade level`);
    }
  }

  // Check for courses that only have one time slot and might conflict
  const singleSlotCourses: { name: string; displayName: string; slot: string }[] = [];
  for (const name of poolNames) {
    const sections = (coursesByName[name] ?? []).filter(
      (s) => s.allowedGrades.includes(gradeProfile),
    );
    const uniqueSlots = new Set(sections.map((s) => `${s.day}-${s.period}`));
    if (uniqueSlots.size === 1 && sections.length > 0) {
      singleSlotCourses.push({
        name,
        displayName: sections[0].name,
        slot: Array.from(uniqueSlots)[0],
      });
    }
  }

  // Check pairs of single-slot courses that share the same slot
  for (let i = 0; i < singleSlotCourses.length; i++) {
    for (let j = i + 1; j < singleSlotCourses.length; j++) {
      if (singleSlotCourses[i].slot === singleSlotCourses[j].slot) {
        warnings.push(
          `${singleSlotCourses[i].displayName} and ${singleSlotCourses[j].displayName} are only offered at the same time`,
        );
      }
    }
  }

  return warnings;
}
