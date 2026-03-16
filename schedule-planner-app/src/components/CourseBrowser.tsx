import { useState, useMemo } from 'react';
import { Search, Filter, X, Plus, Check, ArrowLeftRight } from 'lucide-react';
import clsx from 'clsx';
import type { CourseRecord, GradeProfile } from '@/types/schedule';
import { getUniqueCourses, isCourseEligibleForGrade } from '@/utils/courseUtils';
import { getExclusiveConflict } from '@/utils/poolScheduler';

type Props = {
  courses: CourseRecord[];
  gradeProfile: GradeProfile;
  poolCourseNames: Set<string>;
  placedCourseNames: Set<string>;
  onTogglePool: (course: CourseRecord) => void;
};

const REQUIREMENT_FILTERS = [
  { label: 'All', value: '' },
  { label: 'English', value: 'English' },
  { label: 'Lang Arts', value: 'Applied Languages' },
  { label: 'World Lang', value: 'World Languages' },
  { label: 'Math', value: 'Mathematics' },
  { label: 'Science', value: 'Science' },
  { label: 'History', value: 'US History' },
  { label: 'PE', value: 'PE elective' },
  { label: 'Fine Arts', value: 'Fine Arts' },
  { label: 'CTE', value: 'CTE' },
  { label: 'Electives', value: 'General Electives' },
];

const areaColors: Record<string, { border: string; bg: string; badge: string }> = {
  English: { border: 'border-l-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  'Applied Languages': { border: 'border-l-violet-600', bg: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700' },
  'World Languages': { border: 'border-l-indigo-600', bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700' },
  Mathematics: { border: 'border-l-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  Science: { border: 'border-l-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
  'US History': { border: 'border-l-red-700', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700' },
  'Social Studies': { border: 'border-l-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700' },
  'Fine Arts': { border: 'border-l-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  'PE elective': { border: 'border-l-cyan-600', bg: 'bg-cyan-50', badge: 'bg-cyan-100 text-cyan-700' },
  Health: { border: 'border-l-pink-600', bg: 'bg-pink-50', badge: 'bg-pink-100 text-pink-700' },
  'Digital Studies': { border: 'border-l-slate-600', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-700' },
  'Financial Literacy': { border: 'border-l-lime-700', bg: 'bg-lime-50', badge: 'bg-lime-100 text-lime-700' },
  CTE: { border: 'border-l-teal-600', bg: 'bg-teal-50', badge: 'bg-teal-100 text-teal-700' },
  'General Electives': { border: 'border-l-garden-500', bg: 'bg-garden-50', badge: 'bg-garden-100 text-garden-700' },
};

const defaultColors = { border: 'border-l-slate-400', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-600' };

export function CourseBrowser({ courses, gradeProfile, poolCourseNames, placedCourseNames, onTogglePool }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const filteredCourses = useMemo(() => {
    const eligible = courses.filter((c) => isCourseEligibleForGrade(c, gradeProfile) && !c.isSpecialPlacement);
    const unique = getUniqueCourses(eligible);
    return unique.filter((course) => {
      if (filter && course.requirementArea !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return course.name.toLowerCase().includes(q) || course.requirementArea.toLowerCase().includes(q);
      }
      return true;
    });
  }, [courses, gradeProfile, search, filter]);

  const poolCount = poolCourseNames.size;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-md border border-parchment-300 overflow-hidden">
      <div className="px-4 py-3 bg-garden-500 text-white">
        <h2 className="font-serif text-lg font-semibold">Course Catalog</h2>
        <p className="text-garden-100 text-xs mt-0.5">
          Tap courses to add them to your picks
        </p>
      </div>

      {poolCount > 0 && (
        <div className="px-4 py-2 bg-gold-50 border-b border-gold-200">
          <p className="text-xs font-medium text-gold-700">
            {poolCount} course{poolCount !== 1 ? 's' : ''} picked — hit "Build My Schedule" when ready
          </p>
        </div>
      )}

      <div className="px-3 py-2 border-b border-parchment-300 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-8 pr-8 py-1.5 text-sm border border-parchment-300 rounded-lg bg-parchment-50 focus:outline-none focus:ring-2 focus:ring-garden-400 focus:border-garden-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          {REQUIREMENT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(prev => prev === f.value ? '' : f.value)}
              className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer ${
                filter === f.value
                  ? 'bg-garden-500 text-white shadow-sm'
                  : 'bg-parchment-200 text-slate-600 hover:bg-parchment-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {filteredCourses.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No courses match your search</p>
        ) : (
          filteredCourses.map((course) => {
            const inPool = poolCourseNames.has(course.normalizedName);
            const isPlaced = placedCourseNames.has(course.normalizedName);
            const poolArray = Array.from(poolCourseNames);
            const wouldSwap = !inPool && getExclusiveConflict(course.normalizedName, poolArray);
            const colors = areaColors[course.requirementArea] ?? defaultColors;

            return (
              <button
                key={course.normalizedName}
                onClick={() => onTogglePool(course)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border-l-4 border border-slate-200 transition-all duration-200 text-sm text-left cursor-pointer',
                  colors.border,
                  colors.bg,
                  inPool && 'ring-2 ring-gold-400 border-gold-300 shadow-md',
                  wouldSwap && 'ring-1 ring-amber-400 border-amber-300',
                  isPlaced && !inPool && 'opacity-40',
                  !inPool && !isPlaced && !wouldSwap && 'hover:shadow-md hover:scale-[1.01]',
                )}
              >
                <div className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                  inPool ? 'bg-gold-500 text-white' : wouldSwap ? 'bg-amber-400 text-white' : 'bg-white border border-slate-300 text-slate-400',
                )}>
                  {inPool ? <Check className="h-3.5 w-3.5" /> : wouldSwap ? <ArrowLeftRight className="h-3 w-3" /> : <Plus className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={clsx('font-medium text-slate-700 truncate block', isPlaced && !inPool && 'line-through')}>
                    {course.name}
                  </span>
                  {wouldSwap && (
                    <p className="text-xs text-amber-600 mt-0.5">Swaps with {courses.find(c => c.normalizedName === wouldSwap)?.name ?? wouldSwap}</p>
                  )}
                  {inPool && course.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{course.description}</p>
                  )}
                </div>
                <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium', colors.badge)}>
                  {course.requirementArea === 'General Electives' ? 'Elective' : course.requirementArea}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="px-3 py-2 border-t border-parchment-300 bg-parchment-50">
        <p className="text-xs text-slate-500">{filteredCourses.length} courses available</p>
      </div>
    </div>
  );
}
