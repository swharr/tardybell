import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { CourseRecord, ScheduleGrid } from '@/types/schedule';
import { getScheduledCourses } from '@/utils/courseUtils';

type Requirement = {
  id: string;
  label: string;
  met: boolean;
};

function checkJuniorRequirements(
  schedule: ScheduleGrid,
  courseMap: Record<string, CourseRecord>,
  poolCourseNames: Set<string>,
): Requirement[] {
  const scheduled = getScheduledCourses(schedule, courseMap);
  const scheduledNames = new Set(scheduled.map((c) => c.normalizedName));
  const scheduledAreas = new Set(scheduled.map((c) => c.requirementArea));

  // Combine scheduled + pool for checking
  const allNames = new Set([...scheduledNames, ...poolCourseNames]);

  return [
    {
      id: 'english',
      label: 'English 11 or AP Language',
      met:
        allNames.has('english 11') ||
        allNames.has('english 11 h') ||
        allNames.has('ap english language and composition'),
    },
    {
      id: 'math-sci',
      label: 'Math or Science',
      met:
        scheduledAreas.has('Mathematics') ||
        scheduledAreas.has('Science') ||
        // Also check pool names against known math/science courses
        [...poolCourseNames].some((name) => {
          return name.includes('math') || name.includes('calculus') || name.includes('stats') ||
            name.includes('biology') || name.includes('chemistry') || name.includes('physics') ||
            name.includes('science');
        }),
    },
    {
      id: 'history',
      label: 'US History or AP History',
      met:
        allNames.has('us history') ||
        allNames.has('ap us history'),
    },
  ];
}

type Props = {
  schedule: ScheduleGrid;
  courseMap: Record<string, CourseRecord>;
  gradeProfile: string;
  poolCourseNames?: Set<string>;
};

export function RequirementsBar({ schedule, courseMap, gradeProfile, poolCourseNames }: Props) {
  if (gradeProfile !== '11') return null;

  const requirements = checkJuniorRequirements(schedule, courseMap, poolCourseNames ?? new Set());
  const allMet = requirements.every((r) => r.met);

  return (
    <div className={`rounded-xl border-2 px-4 py-3 transition-colors ${
      allMet ? 'border-garden-300 bg-garden-50' : 'border-gold-300 bg-gold-50'
    }`}>
      <h3 className="text-sm font-semibold text-slate-700 mb-2">Junior Year Requirements</h3>
      <div className="flex flex-wrap gap-x-6 gap-y-1.5">
        {requirements.map((req) => (
          <div key={req.id} className="flex items-center gap-1.5">
            {req.met ? (
              <CheckCircle2 className="h-4 w-4 text-garden-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-gold-500" />
            )}
            <span className={`text-sm ${req.met ? 'text-garden-700' : 'text-slate-600'}`}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
