import { useState, useMemo } from 'react';
import { BookOpen, Search, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import type { CourseRecord } from '@/types/schedule';
import { getUniqueCourses } from '@/utils/courseUtils';

type Props = {
  allCourses: CourseRecord[];
  completedCourses: CourseRecord[];
  onAddCourse: (course: CourseRecord) => void;
  onRemoveCourse: (normalizedName: string) => void;
};

export function CompletedCoursework({ allCourses, completedCourses, onAddCourse, onRemoveCourse }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const completedNames = useMemo(
    () => new Set(completedCourses.map((c) => c.normalizedName)),
    [completedCourses],
  );

  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    const unique = getUniqueCourses(allCourses);
    return unique
      .filter((c) => c.name.toLowerCase().includes(q) && !completedNames.has(c.normalizedName))
      .slice(0, 8);
  }, [allCourses, search, completedNames]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-parchment-300 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gold-50 border-b border-parchment-300 hover:bg-gold-100 transition-colors"
      >
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-gold-600" />
          Completed Coursework
          {completedCourses.length > 0 && (
            <span className="text-xs bg-gold-200 text-gold-800 px-1.5 py-0.5 rounded-full">
              {completedCourses.length}
            </span>
          )}
        </h3>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div className="p-3 space-y-3">
          <p className="text-xs text-slate-500">
            Add courses you've already taken so we can track graduation progress.
          </p>

          {/* Search to add */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search to add a completed course..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-parchment-300 rounded-lg bg-parchment-50 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="border border-parchment-300 rounded-lg divide-y divide-parchment-200 max-h-48 overflow-y-auto">
              {searchResults.map((course) => (
                <button
                  key={course.normalizedName}
                  onClick={() => {
                    onAddCourse(course);
                    setSearch('');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-garden-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 truncate">{course.name}</p>
                    <p className="text-xs text-slate-400">{course.requirementArea} &middot; {course.credits} credits</p>
                  </div>
                  <Plus className="h-4 w-4 text-garden-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Completed list */}
          {completedCourses.length > 0 ? (
            <div className="space-y-1">
              {completedCourses.map((course) => (
                <div
                  key={course.normalizedName}
                  className="flex items-center justify-between px-3 py-1.5 bg-garden-50 rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{course.name}</p>
                    <p className="text-xs text-slate-400">{course.requirementArea} &middot; {course.credits} cr</p>
                  </div>
                  <button
                    onClick={() => onRemoveCourse(course.normalizedName)}
                    className="p-1 rounded hover:bg-berry-100 text-slate-400 hover:text-berry-500 transition-colors flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">No completed courses added yet</p>
          )}
        </div>
      )}
    </div>
  );
}
