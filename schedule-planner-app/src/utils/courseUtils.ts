import type {
  CourseRecord,
  DayKey,
  GradeProfile,
  Period,
  ScheduleGrid,
  ScheduleSlots,
  SemesterKey,
} from '@/types/schedule';

export const gradeProfiles: GradeProfile[] = ['9', '10', '11', '12'];

export const coreCategories = [
  { id: 'english', label: 'English', requirementAreas: ['English'] },
  { id: 'math', label: 'Mathematics', requirementAreas: ['Mathematics'] },
  { id: 'science', label: 'Science', requirementAreas: ['Science'] },
  { id: 'history', label: 'US History', requirementAreas: ['US History'] },
  { id: 'pe', label: 'PE Elective', requirementAreas: ['PE elective'] },
] as const;

export function createEmptyScheduleGrid(): ScheduleGrid {
  return {
    sem1: { A: {}, B: {} },
    sem2: { A: {}, B: {} },
  };
}

export function normalizeCourseName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\n/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/\beng\b/gi, 'english')
    .replace(/\blang\b/gi, 'language')
    .replace(/\blit\b/gi, 'literature')
    .replace(/[^\w:/+ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function getUniqueCourses(courses: CourseRecord[]) {
  const unique = new Map<string, CourseRecord>();
  for (const course of courses) {
    if (!unique.has(course.normalizedName)) {
      unique.set(course.normalizedName, course);
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function groupCoursesByNormalizedName(courses: CourseRecord[]) {
  return courses.reduce<Record<string, CourseRecord[]>>((groups, course) => {
    groups[course.normalizedName] ??= [];
    groups[course.normalizedName].push(course);
    return groups;
  }, {});
}

export function buildCourseMap(courses: CourseRecord[]) {
  return courses.reduce<Record<string, CourseRecord>>((map, course) => {
    map[course.id] = course;
    return map;
  }, {});
}

export function isCourseEligibleForGrade(course: CourseRecord, gradeProfile: GradeProfile | null) {
  return gradeProfile ? course.allowedGrades.includes(gradeProfile) : true;
}

export function getScheduleIds(schedule: ScheduleGrid) {
  return [
    ...Object.values(schedule.sem1.A),
    ...Object.values(schedule.sem1.B),
    ...Object.values(schedule.sem2.A),
    ...Object.values(schedule.sem2.B),
  ].filter(Boolean) as string[];
}

export function getScheduledCourses(schedule: ScheduleGrid, courseMap: Record<string, CourseRecord>) {
  return getScheduleIds(schedule)
    .map((id) => courseMap[id])
    .filter(Boolean);
}

export function scheduleSignature(schedule: ScheduleGrid) {
  return JSON.stringify(schedule);
}

export function getSlotCourseId(schedule: ScheduleGrid, semester: SemesterKey, day: DayKey, period: Period) {
  return schedule[semester][day][period] ?? null;
}

export function setSlotCourseId(
  schedule: ScheduleGrid,
  semester: SemesterKey,
  day: DayKey,
  period: Period,
  courseId: string | null,
) {
  const nextSlots = { ...schedule[semester][day] } as ScheduleSlots;
  if (courseId) {
    nextSlots[period] = courseId;
  } else {
    delete nextSlots[period];
  }
  return {
    ...schedule,
    [semester]: {
      ...schedule[semester],
      [day]: nextSlots,
    },
  };
}

export function slotLabel(day: DayKey, period: Period) {
  return `${day}-Day Period ${period}`;
}

export function getCourseNamesFromCompleted(completed: CourseRecord[]) {
  return new Set(completed.map((course) => course.normalizedName));
}

export function getScheduledNormalizedNames(
  schedule: ScheduleGrid,
  courseMap: Record<string, CourseRecord>,
  excludeId?: string | null,
) {
  const names = new Set<string>();
  for (const id of getScheduleIds(schedule)) {
    if (!id || id === excludeId) {
      continue;
    }
    const course = courseMap[id];
    if (course) {
      names.add(course.normalizedName);
    }
  }
  return names;
}

export function getPriorScheduledNames(
  schedule: ScheduleGrid,
  courseMap: Record<string, CourseRecord>,
  semester: SemesterKey,
) {
  const names = new Set<string>();
  const semesters: SemesterKey[] = semester === 'sem2' ? ['sem1'] : [];
  for (const semesterKey of semesters) {
    for (const id of [...Object.values(schedule[semesterKey].A), ...Object.values(schedule[semesterKey].B)]) {
      if (!id) {
        continue;
      }
      const course = courseMap[id];
      if (course) {
        names.add(course.normalizedName);
      }
    }
  }
  return names;
}

export function isSpecialPlacementName(name: string) {
  const normalized = normalizeCourseName(name);
  return ['release time', 'office aide', 'teacher aide', 'teacher aid', 'teacher assistant', 'student assistant'].some(
    (pattern) => normalized.includes(pattern),
  );
}
