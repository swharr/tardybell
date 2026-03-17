import { useState } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { X, Clock, User, GripVertical } from 'lucide-react';
import clsx from 'clsx';
import type { CourseRecord, DayKey, Period, SemesterKey } from '@/types/schedule';

type Props = {
  semester: SemesterKey;
  day: DayKey;
  period: Period;
  course: CourseRecord | null;
  isLocked: boolean;
  canPlace: boolean; // true when a selected course has a section for this slot
  isDragTarget: boolean; // true = valid drop target during drag, highlights gold
  isDragging: boolean; // true when any drag is active (to dim non-targets)
  onRemove: () => void;
  onClickPlace: () => void;
};

const periodTimes: Record<number, string> = {
  1: '7:45 - 9:05',
  2: '9:15 - 10:35',
  3: '10:45 - 12:10',
  4: '12:55 - 2:15',
  5: '7:45 - 9:05',
  6: '9:15 - 10:35',
  7: '10:45 - 12:10',
  8: '12:55 - 2:15',
};

export function DroppableSlot({ semester, day, period, course, isLocked, canPlace, isDragTarget, isDragging, onRemove, onClickPlace }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const slotId = `slot-${semester}-${day}-${period}`;
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: slotId,
    data: { semester, day, period },
  });

  // Make occupied (non-locked) slots draggable for grid-to-grid moves
  const dragId = `grid-${semester}-${day}-${period}`;
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging: isThisDragging } = useDraggable({
    id: dragId,
    data: {
      normalizedName: course?.normalizedName ?? '',
      displayName: course?.name ?? '',
      requirementArea: course?.requirementArea ?? '',
      fromSlot: { semester, day, period },
    },
    disabled: !course || isLocked,
  });

  const dragStyle = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined;

  // Merge refs: both droppable and draggable need to attach to the same DOM node
  const setNodeRef = (el: HTMLElement | null) => {
    setDropRef(el);
    setDragRef(el);
  };

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      onClick={() => {
        if (canPlace && !course) {
          onClickPlace();
        } else if (course && !isLocked) {
          setShowDetails(!showDetails);
        }
      }}
      className={clsx(
        'relative group min-h-[64px] rounded-lg border-2 transition-all',
        course
          ? 'border-solid border-garden-300 bg-white shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md'
          : canPlace
            ? 'border-dashed border-gold-400 bg-gold-50 cursor-pointer hover:bg-gold-100 animate-pulse'
            : 'border-dashed border-parchment-400 bg-parchment-50',
        // Drag feedback: glow valid targets, dim invalid ones
        isDragging && !course && isDragTarget && 'border-gold-400 bg-gold-50 border-dashed scale-[1.02] shadow-md',
        isDragging && !course && !isDragTarget && 'opacity-40',
        isDragging && course && !isDragTarget && 'opacity-60',
        isDragging && course && isDragTarget && 'border-gold-400 scale-[1.02] shadow-md',
        // Hover feedback during drag
        isOver && isDragTarget && 'border-gold-500 bg-gold-100 scale-[1.04] shadow-lg',
        isOver && !isDragTarget && 'border-berry-400 bg-berry-50',
        isLocked && 'border-solid border-garden-200 bg-garden-50/50 cursor-default',
        isThisDragging && 'opacity-50 shadow-lg scale-105',
      )}
    >
      {course ? (
        <div className="px-2.5 py-2">
          <div className="flex items-start justify-between gap-1">
            {!isLocked && (
              <div
                {...listeners}
                {...attributes}
                className="flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing touch-none"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{course.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <User className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-500">{course.teacher}</span>
              </div>
            </div>
            {!isLocked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-berry-100 text-slate-400 hover:text-berry-500 transition-all flex-shrink-0"
                title="Remove course"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Detail popover */}
          {showDetails && !isLocked && (
            <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{periodTimes[period] ?? `Period ${period}`}</span>
                <span className="text-slate-300">|</span>
                <span>{course.semester === 'Both' ? 'Year-long' : course.semester}</span>
                <span className="text-slate-300">|</span>
                <span>{course.credits} cr</span>
              </div>
              {course.description && (
                <p className="text-xs text-slate-500 line-clamp-3">{course.description}</p>
              )}
              <div className="flex items-center gap-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-garden-100 text-garden-700 font-medium">
                  {course.requirementArea}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full min-h-[64px] gap-0.5">
          {canPlace ? (
            <>
              <span className="text-xs font-medium text-gold-600">Tap to place</span>
              <span className="text-[10px] text-gold-500">Period {period}</span>
            </>
          ) : (
            <>
              <span className="text-xs text-slate-400">P{period}</span>
              <span className="text-[10px] text-slate-300">{periodTimes[period]}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
