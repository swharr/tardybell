import { Flower2, Monitor } from 'lucide-react';

interface MobileGateProps {
  onDismiss: () => void;
}

export function MobileGate({ onDismiss }: MobileGateProps) {
  return (
    <div className="min-h-screen bg-parchment-100 flex items-center justify-center p-6 md:hidden">
      <div className="bg-white rounded-2xl shadow-xl border border-parchment-300 w-full max-w-sm overflow-hidden text-center">
        <div className="bg-garden-700 text-white px-6 py-6">
          <Flower2 className="h-10 w-10 text-gold-400 mx-auto mb-3" />
          <h1 className="font-serif text-2xl font-bold tracking-tight">TardyBell</h1>
          <p className="text-garden-200 text-sm mt-1">Timpanogos High School &middot; 2026-2027</p>
        </div>
        <div className="p-6 space-y-4">
          <Monitor className="h-12 w-12 text-garden-400 mx-auto" />
          <h2 className="font-serif text-lg font-semibold text-slate-800">
            Grab a bigger screen!
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            TardyBell works best on an iPad or computer so you can drag and drop courses onto your schedule grid.
          </p>
          <p className="text-xs text-slate-400">
            Open this page on a tablet or laptop to get started.
          </p>
          <button
            onClick={onDismiss}
            className="w-full mt-2 px-4 py-2.5 bg-garden-100 hover:bg-garden-200 text-garden-700 text-sm font-medium rounded-lg transition-colors"
          >
            OK fine, but let me see it 👀
          </button>
          <div className="pt-2 border-t border-parchment-300">
            <p className="text-xs text-garden-600 font-medium">tardybell.t8rsk8s.io</p>
          </div>
        </div>
      </div>
    </div>
  );
}
