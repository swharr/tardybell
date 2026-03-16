import { useState } from 'react';
import { Bookmark, ChevronDown, ChevronUp, Trash2, Upload } from 'lucide-react';
import clsx from 'clsx';
import type { ScheduleGrid } from '@/types/schedule';
import type { PoolEntry } from '@/components/CoursePool';

export type SavedVersion = {
  id: string;
  name: string;
  savedAt: string;
  schedule: ScheduleGrid;
  poolEntries: PoolEntry[];
};

type Props = {
  versions: SavedVersion[];
  onSave: (name: string) => void;
  onLoad: (version: SavedVersion) => void;
  onDelete: (id: string) => void;
};

export function SavedVersions({ versions, onSave, onLoad, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [saveName, setSaveName] = useState('');

  const handleSave = () => {
    const name = saveName.trim() || `Version ${versions.length + 1}`;
    onSave(name);
    setSaveName('');
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-parchment-300 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-semibold text-slate-700 hover:bg-parchment-50 transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-garden-500" />
          Saved Versions {versions.length > 0 && <span className="text-xs text-slate-400">({versions.length})</span>}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="border-t border-parchment-200 px-4 py-3 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={`Version ${versions.length + 1}`}
              className="flex-1 px-3 py-1.5 border border-parchment-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-garden-400"
            />
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-garden-500 text-white rounded-lg text-sm font-medium hover:bg-garden-600 transition-colors"
            >
              <Bookmark className="h-3.5 w-3.5" />
              Save
            </button>
          </div>

          {versions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">No saved versions yet</p>
          ) : (
            <div className="space-y-1.5">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-parchment-50 border border-parchment-200"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{v.name}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(v.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => onLoad(v)}
                      className={clsx(
                        'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
                        'bg-garden-100 text-garden-700 hover:bg-garden-200',
                      )}
                      title="Load this version"
                    >
                      <Upload className="h-3 w-3" />
                      Load
                    </button>
                    <button
                      onClick={() => onDelete(v.id)}
                      className="p-1 rounded text-slate-400 hover:text-berry-500 hover:bg-berry-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
