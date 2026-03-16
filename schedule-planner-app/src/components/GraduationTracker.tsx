import { useState } from 'react';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';
import type { CourseRecord, ScheduleGrid } from '@/types/schedule';
import { buildCourseMap, getScheduleIds } from '@/utils/courseUtils';

const gradRequirements = [
  { area: 'English 9/10/11', categories: ['E09', 'E10', 'E11'], required: 3.0 },
  { area: 'Language Art Applied', categories: ['LAC'], required: 1.0 },
  { area: 'Math Core', categories: ['MC'], required: 2.0 },
  { area: 'Applied Math', categories: ['AMC'], required: 1.0 },
  { area: 'Science Core', categories: ['SC'], required: 2.0 },
  { area: 'Applied Science', categories: ['ASC'], required: 1.0 },
  { area: 'World Civ & Geography', categories: ['WC'], required: 0.5 },
  { area: 'US History 2', categories: ['US'], required: 1.0 },
  { area: "Gov't & Citizenship", categories: ['GC'], required: 0.5 },
  { area: 'Social Studies', categories: ['SS'], required: 0.5 },
  { area: 'Fine Art', categories: ['A'], required: 1.5 },
  { area: 'PE Skills', categories: ['PES'], required: 0.5 },
  { area: 'PE Fitness', categories: ['PEF'], required: 0.5 },
  { area: 'PE Activity', categories: ['PEA'], required: 0.5 },
  { area: 'Health', categories: ['H'], required: 0.5 },
  { area: 'Digital Literacy', categories: ['CT'], required: 0.5 },
  { area: 'Financial Literacy', categories: ['FIN'], required: 0.5 },
  { area: 'Career Tech Ed', categories: ['CTE'], required: 1.0 },
];

type Props = {
  schedule: ScheduleGrid;
  completed: CourseRecord[];
  courses: CourseRecord[];
};

export function GraduationTracker({ schedule, completed, courses }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const courseMap = buildCourseMap(courses);

  const calculateCredits = (categories: string[], sourceItems: Array<CourseRecord | string>, isCompletedList = false) => {
    let total = 0;

    if (isCompletedList) {
      sourceItems.forEach((course) => {
        const typedCourse = course as CourseRecord;
        if (typedCourse.graduationCategories?.some((category) => categories.includes(category))) {
          total += typedCourse.credits;
        } else if (!typedCourse.graduationCategories?.length && categories.includes(typedCourse.requirementArea)) {
          total += typedCourse.credits;
        }
      });
      return total;
    }

    const uniqueIds = new Set(sourceItems as string[]);
    uniqueIds.forEach((id) => {
      const course = courseMap[id];
      if (course?.graduationCategories?.some((category) => categories.includes(category))) {
        total += course.credits;
      } else if (course && !course.graduationCategories?.length && categories.includes(course.requirementArea)) {
        total += course.credits;
      }
    });
    return total;
  };

  const scheduledIds = getScheduleIds(schedule);

  return (
    <div className="bg-white rounded-xl shadow-md border border-parchment-300 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3 bg-garden-500/5 border-b border-garden-500/10 hover:bg-garden-500/10 transition-colors"
      >
        <h3 className="font-serif text-lg text-slate-800 flex items-center gap-2">
          <Award className="h-5 w-5 text-garden-500" />
          Graduation Requirements Progress
        </h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div>
          <div className="px-5 py-2 text-xs text-slate-500 bg-parchment-50 border-b border-parchment-300">
            Estimate based on completed coursework plus the current schedule.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-600 uppercase bg-parchment-50 border-b border-parchment-300">
                <tr>
                  <th className="px-5 py-3 font-semibold">Subject Area</th>
                  <th className="px-5 py-3 font-semibold text-center">Required</th>
                  <th className="px-5 py-3 font-semibold text-center text-garden-600">Completed</th>
                  <th className="px-5 py-3 font-semibold text-center text-gold-600">Scheduled</th>
                  <th className="px-5 py-3 font-semibold text-center">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-200">
                {gradRequirements.map((req, i) => {
                  const completedCredits = calculateCredits(req.categories, completed, true);
                  const scheduledCredits = calculateCredits(req.categories, scheduledIds, false);
                  const remaining = Math.max(0, req.required - completedCredits - scheduledCredits);
                  const isDone = remaining === 0;

                  return (
                    <tr key={req.area} className={i % 2 === 0 ? 'bg-white' : 'bg-parchment-50/50'}>
                      <td className="px-5 py-2.5 font-medium text-slate-800">{req.area}</td>
                      <td className="px-5 py-2.5 text-center text-slate-600">{req.required.toFixed(1)}</td>
                      <td className="px-5 py-2.5 text-center font-medium text-garden-600">
                        {completedCredits > 0 ? completedCredits.toFixed(1) : '-'}
                      </td>
                      <td className="px-5 py-2.5 text-center font-medium text-gold-600">
                        {scheduledCredits > 0 ? scheduledCredits.toFixed(1) : '-'}
                      </td>
                      <td className={`px-5 py-2.5 text-center font-bold ${isDone ? 'text-slate-300' : 'text-berry-500'}`}>
                        {remaining.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
