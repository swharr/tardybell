import { X } from 'lucide-react';

type Props = {
  onClose: () => void;
  isWelcome?: boolean;
};

export function HelpModal({ onClose, isWelcome }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-parchment-200">
          <h2 className="font-serif text-xl font-bold text-garden-700">
            {isWelcome ? "Don't be Tardy!" : 'How TardyBell Works'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-parchment-200 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm text-slate-700 leading-relaxed">
          {isWelcome && (
            <p className="text-base text-slate-600">
              Welcome to TardyBell — your schedule planner for Timpanogos High School 2026–2027.
            </p>
          )}
          <p className="text-base font-medium text-slate-800">
            {isWelcome ? "Here's how it works — just 3 steps:" : 'TardyBell helps you plan your class schedule in 3 easy steps:'}
          </p>

          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gold-500 text-white flex items-center justify-center font-bold text-sm">1</span>
              <div>
                <p className="font-semibold text-slate-800">Pick your classes</p>
                <p>
                  Browse the Course Catalog on the left and tap the <strong>+</strong> button
                  on any class you're interested in. Use the filters (English, Math, Science, etc.)
                  to narrow things down, or search by name.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gold-500 text-white flex items-center justify-center font-bold text-sm">2</span>
              <div>
                <p className="font-semibold text-slate-800">Rank them by priority</p>
                <p>
                  Your picks show up in the <strong>My Classes</strong> panel. Use the
                  up/down arrows to set how important each one is:
                </p>
                <ul className="mt-1.5 space-y-1 ml-1">
                  <li><strong className="text-berry-600">Must Have</strong> — classes you absolutely need (like Swim Team or a required course)</li>
                  <li><strong className="text-gold-600">Want</strong> — classes you really want but could live without</li>
                  <li><strong className="text-garden-600">If It Fits</strong> — would be cool, but no big deal if they don't work out</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gold-500 text-white flex items-center justify-center font-bold text-sm">3</span>
              <div>
                <p className="font-semibold text-slate-800">Build your schedule</p>
                <p>
                  Hit <strong>Build My Schedule</strong> and TardyBell will figure out
                  the best way to fit everything in. It starts with your must-haves,
                  then adds your wants, then tries to squeeze in the rest.
                </p>
                <p className="mt-1.5">
                  If something doesn't fit, it'll tell you why (like a time conflict).
                  You can drag classes around on the schedule grid to tweak things manually.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-parchment-200" />

          <div className="space-y-2">
            <p className="font-semibold text-slate-800">Good to know:</p>
            <ul className="space-y-1.5 ml-4 list-disc">
              <li>
                <strong>A-Day / B-Day</strong> — Timpanogos runs an alternating block schedule.
                You have 4 classes on A-days (periods 1–4) and 4 different classes on B-days (periods 5–8).
              </li>
              <li>
                <strong>Year-long classes</strong> run both semesters in the same period.
                Semester-only classes free up that slot for something else the other semester.
              </li>
              <li>
                <strong>Requirements bar</strong> — the checklist at the top tracks whether
                you've covered your required subjects. Green check = you're good.
              </li>
              <li>
                <strong>Some classes can't overlap</strong> — for example, you can't take both
                US History and AP US History. If you pick one, it'll automatically swap out the other.
              </li>
              <li>
                <strong>Reset</strong> — the JK-Reset button clears everything so you can start fresh.
              </li>
            </ul>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-parchment-200">
          <button
            onClick={onClose}
            className="w-full py-2 bg-garden-600 hover:bg-garden-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {isWelcome ? "Let's Go!" : 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
}
