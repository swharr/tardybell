export type GradeProfile = '9' | '10' | '11' | '12';

export type SemesterKey = 'sem1' | 'sem2';
export type DayKey = 'A' | 'B';
export type Period = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ScheduleSlots = Partial<Record<Period, string | null>>;

export type ScheduleGrid = {
  sem1: { A: ScheduleSlots; B: ScheduleSlots };
  sem2: { A: ScheduleSlots; B: ScheduleSlots };
};

export type CourseRecord = {
  id: string;
  canonicalCourseId?: string;
  name: string;
  normalizedName: string;
  teacher: string;
  period: Period;
  day: DayKey;
  semester: 'S1' | 'S2' | 'Both';
  credits: number;
  requirementArea: string;
  graduationCategories?: string[];
  allowedGrades: GradeProfile[];
  prerequisiteCourseIds?: string[];
  prerequisiteCourseNames: string[];
  countsAsElective?: boolean;
  isSpecialPlacement: boolean;
  description: string;
};

export type CoreSelectionKey = 'english' | 'math' | 'science' | 'history' | 'pe';

export type GeneratedScheduleOption = ScheduleGrid & {
  score: number;
  matchedElectives: string[];
  filledByFallbackCourses: string[];
};
