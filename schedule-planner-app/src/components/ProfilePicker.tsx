import { useState } from 'react';
import { Flower2, Plus, Trash2, User } from 'lucide-react';

export type StudentProfile = {
  id: string;
  name: string;
  createdAt: string;
};

type Props = {
  profiles: StudentProfile[];
  onSelectProfile: (profile: StudentProfile) => void;
  onCreateProfile: (name: string) => void;
  onDeleteProfile: (id: string) => void;
};

export function ProfilePicker({ profiles, onSelectProfile, onCreateProfile, onDeleteProfile }: Props) {
  const [newName, setNewName] = useState('');
  const [showDelete, setShowDelete] = useState<string | null>(null);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateProfile(trimmed);
    setNewName('');
  };

  return (
    <div className="min-h-screen bg-parchment-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-parchment-300 w-full max-w-md overflow-hidden modal-panel">
        {/* Header */}
        <div className="bg-garden-700 text-white px-6 py-6 text-center">
          <Flower2 className="h-12 w-12 text-gold-400 mx-auto mb-3" />
          <h1 className="font-serif text-3xl font-bold tracking-tight">TardyBell</h1>
          <p className="text-garden-200 text-sm mt-1">Timpanogos High School &middot; 2026-2027</p>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-600 text-center">
            Select your profile or create a new one to start planning your schedule.
          </p>

          {/* Existing profiles */}
          {profiles.length > 0 && (
            <div className="space-y-2">
              {profiles.map((profile) => (
                <div key={profile.id} className="relative group">
                  <button
                    onClick={() => onSelectProfile(profile)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-parchment-50 border border-parchment-300 rounded-xl hover:bg-garden-50 hover:border-garden-300 hover:shadow-md transition-all duration-200 text-left cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-garden-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-garden-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">{profile.name}</p>
                      <p className="text-xs text-slate-400">
                        Created {new Date(profile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (showDelete === profile.id) {
                        onDeleteProfile(profile.id);
                        setShowDelete(null);
                      } else {
                        setShowDelete(profile.id);
                      }
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-berry-100 text-slate-400 hover:text-berry-500 transition-all"
                    title={showDelete === profile.id ? 'Confirm delete' : 'Delete profile'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {showDelete === profile.id && (
                    <p className="text-xs text-berry-500 mt-1 ml-4">Click again to confirm delete</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create new */}
          <div className="border-t border-parchment-300 pt-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">New Profile</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Your first name..."
                className="flex-1 px-3 py-2 text-sm border border-parchment-300 rounded-lg bg-parchment-50 focus:outline-none focus:ring-2 focus:ring-garden-400 focus:border-garden-400"
                maxLength={30}
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-garden-500 text-white rounded-lg hover:bg-garden-600 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
