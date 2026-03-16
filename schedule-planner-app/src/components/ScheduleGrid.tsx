import type { CourseRecord, DayKey, Period, ScheduleGrid as ScheduleGridType, SemesterKey } from '@/types/schedule';
import { DroppableSlot } from './DroppableSlot';
import { getSlotCourseId } from '@/utils/courseUtils';

type Props = {
  schedule: ScheduleGridType;
  courseMap: Record<string, CourseRecord>;
  lockedSlots: Set<string>;
  validSlots: Set<string>;
  dragTargetSlots: Set<string>;
  isDragging: boolean;
  onRemoveCourse: (semester: SemesterKey, day: DayKey, period: Period) => void;
  onClickPlace: (semester: SemesterKey, day: DayKey, period: Period) => void;
};

const A_PERIODS: Period[] = [1, 2, 3, 4];
const B_PERIODS: Period[] = [5, 6, 7, 8];

function SemesterColumn({
  label,
  semester,
  schedule,
  courseMap,
  lockedSlots,
  validSlots,
  dragTargetSlots,
  isDragging,
  onRemoveCourse,
  onClickPlace,
}: {
  label: string;
  semester: SemesterKey;
  schedule: ScheduleGridType;
  courseMap: Record<string, CourseRecord>;
  lockedSlots: Set<string>;
  validSlots: Set<string>;
  dragTargetSlots: Set<string>;
  isDragging: boolean;
  onRemoveCourse: (semester: SemesterKey, day: DayKey, period: Period) => void;
  onClickPlace: (semester: SemesterKey, day: DayKey, period: Period) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-parchment-300 overflow-hidden">
      <div className="px-4 py-2.5 bg-garden-600 text-white text-center">
        <h3 className="font-serif text-base font-semibold">{label}</h3>
      </div>
      <div className="grid grid-cols-2 divide-x divide-parchment-300">
        {/* A-Day */}
        <div>
          <div className="px-3 py-1.5 bg-gold-50 border-b border-parchment-300 text-center">
            <span className="text-xs font-semibold text-gold-700 uppercase tracking-wide">A-Day</span>
          </div>
          <div className="p-2 space-y-1.5">
            {A_PERIODS.map((period) => {
              const courseId = getSlotCourseId(schedule, semester, 'A', period);
              const course = courseId ? courseMap[courseId] ?? null : null;
              const slotKey = `${semester}-A-${period}`;
              return (
                <DroppableSlot
                  key={period}
                  semester={semester}
                  day="A"
                  period={period}
                  course={course}
                  isLocked={lockedSlots.has(slotKey)}
                  canPlace={validSlots.has(slotKey)}
                  isDragTarget={dragTargetSlots.has(slotKey)}
                  isDragging={isDragging}
                  onRemove={() => onRemoveCourse(semester, 'A', period)}
                  onClickPlace={() => onClickPlace(semester, 'A', period)}
                />
              );
            })}
          </div>
        </div>

        {/* B-Day */}
        <div>
          <div className="px-3 py-1.5 bg-garden-50 border-b border-parchment-300 text-center">
            <span className="text-xs font-semibold text-garden-700 uppercase tracking-wide">B-Day</span>
          </div>
          <div className="p-2 space-y-1.5">
            {B_PERIODS.map((period) => {
              const courseId = getSlotCourseId(schedule, semester, 'B', period);
              const course = courseId ? courseMap[courseId] ?? null : null;
              const slotKey = `${semester}-B-${period}`;
              return (
                <DroppableSlot
                  key={period}
                  semester={semester}
                  day="B"
                  period={period}
                  course={course}
                  isLocked={lockedSlots.has(slotKey)}
                  canPlace={validSlots.has(slotKey)}
                  isDragTarget={dragTargetSlots.has(slotKey)}
                  isDragging={isDragging}
                  onRemove={() => onRemoveCourse(semester, 'B', period)}
                  onClickPlace={() => onClickPlace(semester, 'B', period)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScheduleGrid({ schedule, courseMap, lockedSlots, validSlots, dragTargetSlots, isDragging, onRemoveCourse, onClickPlace }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SemesterColumn
        label="Semester 1"
        semester="sem1"
        schedule={schedule}
        courseMap={courseMap}
        lockedSlots={lockedSlots}
        validSlots={validSlots}
        dragTargetSlots={dragTargetSlots}
        isDragging={isDragging}
        onRemoveCourse={onRemoveCourse}
        onClickPlace={onClickPlace}
      />
      <SemesterColumn
        label="Semester 2"
        semester="sem2"
        schedule={schedule}
        courseMap={courseMap}
        lockedSlots={lockedSlots}
        validSlots={validSlots}
        dragTargetSlots={dragTargetSlots}
        isDragging={isDragging}
        onRemoveCourse={onRemoveCourse}
        onClickPlace={onClickPlace}
      />
    </div>
  );
}
