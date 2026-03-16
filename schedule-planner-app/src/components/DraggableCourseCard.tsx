import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Check } from 'lucide-react';
import clsx from 'clsx';

type Props = {
  normalizedName: string;
  displayName: string;
  requirementArea: string;
  description: string;
  isPlaced: boolean;
  isSelected: boolean;
  onSelect: (normalizedName: string) => void;
};

const areaColors: Record<string, { border: string; bg: string; badge: string }> = {
  English: { border: 'border-l-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
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

export function DraggableCourseCard({
  normalizedName,
  displayName,
  requirementArea,
  description,
  isPlaced,
  isSelected,
  onSelect,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `course-${normalizedName}`,
    data: { normalizedName, displayName, requirementArea },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const colors = areaColors[requirementArea] ?? defaultColors;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        if (!isPlaced) onSelect(normalizedName);
      }}
      className={clsx(
        'group relative flex items-center gap-2 px-3 py-2.5 rounded-lg border-l-4 border border-slate-200 transition-all text-sm',
        colors.border,
        colors.bg,
        isDragging && 'opacity-50 shadow-lg scale-105 z-50',
        isPlaced && 'opacity-40',
        isSelected && !isPlaced && 'ring-2 ring-gold-400 shadow-md scale-[1.02] border-gold-300',
        !isPlaced && !isSelected && 'cursor-pointer hover:shadow-md hover:scale-[1.01]',
        isPlaced && 'cursor-default',
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-slate-300 flex-shrink-0 cursor-grab active:cursor-grabbing" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={clsx('font-medium text-slate-700 truncate', isPlaced && 'line-through')}>
            {displayName}
          </span>
          {isPlaced && <Check className="h-3.5 w-3.5 text-garden-500 flex-shrink-0" />}
        </div>
        {isSelected && description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{description}</p>
        )}
      </div>
      <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium', colors.badge)}>
        {requirementArea === 'General Electives' ? 'Elective' : requirementArea}
      </span>
    </div>
  );
}
