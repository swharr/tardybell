import { X, AlertTriangle, Sparkles } from 'lucide-react';

type Props = {
  conflicts: string[];
  onClose: () => void;
  onAutoSchedule: () => void;
};

export function ConflictModal({ conflicts, onClose, onAutoSchedule }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[85vh] flex flex-col modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-berry-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-berry-500" />
            <h2 className="font-serif text-lg font-bold text-berry-700">Heads Up!</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-parchment-200 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-sm text-slate-700">
          <p>
            We built the best schedule we could, but couldn't fit everything in:
          </p>
          <ul className="space-y-2">
            {conflicts.map((msg, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-berry-100 text-berry-600 flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
          <p className="text-slate-500 text-xs">
            Try changing priorities, removing a class, or dragging things around on the schedule to make room.
          </p>
        </div>

        <div className="px-5 py-3 border-t border-parchment-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-berry-600 hover:bg-berry-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            I'll tweak it
          </button>
          <button
            onClick={onAutoSchedule}
            className="flex-1 py-2 bg-garden-600 hover:bg-garden-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            Automagically Fix
          </button>
        </div>
      </div>
    </div>
  );
}
