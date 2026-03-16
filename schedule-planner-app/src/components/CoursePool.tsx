import { X, Sparkles, AlertTriangle, ChevronUp, ChevronDown, Lock, Heart, Smile } from 'lucide-react';
import clsx from 'clsx';
import type { CourseRecord } from '@/types/schedule';

export type CoursePriority = 'must' | 'want' | 'nice';

export type PoolEntry = {
  normalizedName: string;
  priority: CoursePriority;
};

type Props = {
  poolEntries: PoolEntry[];
  poolCourses: CourseRecord[];
  conflicts: string[];
  onRemoveCourse: (normalizedName: string) => void;
  onChangePriority: (normalizedName: string, priority: CoursePriority) => void;
  onBuildSchedule: () => void;
  isScheduleBuilt: boolean;
};

const priorityConfig: Record<CoursePriority, { label: string; icon: typeof Lock; color: string; chipColor: string }> = {
  must: { label: 'Must Have', icon: Lock, color: 'text-berry-600', chipColor: 'ring-berry-400 bg-berry-50' },
  want: { label: 'Want', icon: Heart, color: 'text-gold-600', chipColor: 'ring-gold-400 bg-gold-50' },
  nice: { label: 'If It Fits', icon: Smile, color: 'text-garden-600', chipColor: 'ring-garden-300 bg-garden-50' },
};

const areaColors: Record<string, string> = {
  English: 'bg-amber-100 text-amber-700 border-amber-300',
  'Applied Languages': 'bg-violet-100 text-violet-700 border-violet-300',
  'World Languages': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  Mathematics: 'bg-blue-100 text-blue-700 border-blue-300',
  Science: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'US History': 'bg-red-100 text-red-700 border-red-300',
  'Social Studies': 'bg-orange-100 text-orange-700 border-orange-300',
  'Fine Arts': 'bg-purple-100 text-purple-700 border-purple-300',
  'PE elective': 'bg-cyan-100 text-cyan-700 border-cyan-300',
  Health: 'bg-pink-100 text-pink-700 border-pink-300',
  'Digital Studies': 'bg-slate-100 text-slate-700 border-slate-300',
  'Financial Literacy': 'bg-lime-100 text-lime-700 border-lime-300',
  CTE: 'bg-teal-100 text-teal-700 border-teal-300',
  'General Electives': 'bg-garden-100 text-garden-700 border-garden-300',
};

const defaultColor = 'bg-slate-100 text-slate-600 border-slate-300';

const priorityOrder: CoursePriority[] = ['must', 'want', 'nice'];

function cyclePriority(current: CoursePriority, direction: 'up' | 'down'): CoursePriority {
  const idx = priorityOrder.indexOf(current);
  if (direction === 'up' && idx > 0) return priorityOrder[idx - 1];
  if (direction === 'down' && idx < priorityOrder.length - 1) return priorityOrder[idx + 1];
  return current;
}

export function CoursePool({ poolEntries, poolCourses, conflicts, onRemoveCourse, onChangePriority, onBuildSchedule, isScheduleBuilt }: Props) {
  if (poolEntries.length === 0) return null;

  // Group by priority
  const grouped = priorityOrder.map((priority) => {
    const entries = poolEntries.filter((e) => e.priority === priority);
    const courses = entries.map((e) => poolCourses.find((c) => c.normalizedName === e.normalizedName)).filter(Boolean) as CourseRecord[];
    return { priority, entries, courses };
  }).filter((g) => g.entries.length > 0);

  return (
    <div className="bg-white rounded-xl shadow-md border border-parchment-300 overflow-hidden">
      <div className="px-4 py-3 bg-gold-500 text-white flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold">My Classes</h2>
          <p className="text-gold-100 text-xs mt-0.5">
            {poolEntries.length} course{poolEntries.length !== 1 ? 's' : ''} picked — rank them by priority
          </p>
        </div>
        <button
          onClick={onBuildSchedule}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            isScheduleBuilt
              ? 'bg-white/20 text-white hover:bg-white/30'
              : 'bg-white text-gold-700 hover:bg-gold-50 shadow-md hover:shadow-lg',
          )}
        >
          <Sparkles className="h-4 w-4" />
          {isScheduleBuilt ? 'Rebuild Schedule' : 'Build My Schedule'}
        </button>
      </div>

      {conflicts.length > 0 && (
        <div className="px-4 py-2 bg-berry-50 border-b border-berry-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-berry-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-berry-600 space-y-0.5">
              {conflicts.map((msg, i) => (
                <p key={i}>{msg}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-3 space-y-3">
        {grouped.map(({ priority, entries, courses }) => {
          const config = priorityConfig[priority];
          const Icon = config.icon;
          return (
            <div key={priority}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className={clsx('h-3.5 w-3.5', config.color)} />
                <span className={clsx('text-xs font-semibold uppercase tracking-wide', config.color)}>
                  {config.label}
                </span>
                <span className="text-xs text-slate-400">({entries.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entries.map((entry) => {
                  const course = courses.find((c) => c.normalizedName === entry.normalizedName);
                  if (!course) return null;
                  return (
                    <div
                      key={entry.normalizedName}
                      className={clsx(
                        'flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ring-1',
                        areaColors[course.requirementArea] ?? defaultColor,
                        config.chipColor,
                      )}
                    >
                      <button
                        onClick={() => onChangePriority(entry.normalizedName, cyclePriority(entry.priority, 'up'))}
                        className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
                        title="Higher priority"
                        disabled={priority === 'must'}
                      >
                        <ChevronUp className={clsx('h-3 w-3', priority === 'must' ? 'text-slate-300' : '')} />
                      </button>
                      <span className="truncate max-w-[140px]">{course.name}</span>
                      <button
                        onClick={() => onChangePriority(entry.normalizedName, cyclePriority(entry.priority, 'down'))}
                        className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
                        title="Lower priority"
                        disabled={priority === 'nice'}
                      >
                        <ChevronDown className={clsx('h-3 w-3', priority === 'nice' ? 'text-slate-300' : '')} />
                      </button>
                      <button
                        onClick={() => onRemoveCourse(entry.normalizedName)}
                        className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
