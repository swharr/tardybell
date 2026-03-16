export function BuildFooter() {
  const buildId = __BUILD_ID__;
  const buildTime = __BUILD_TIME__;

  const gmt = new Date(buildTime).toUTCString();
  const local = new Date(buildTime).toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <footer className="bg-garden-800 text-garden-300 text-xs py-3 px-4 border-t border-garden-700/50">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-garden-400/60" aria-hidden="true" />
          TardyBell &middot; tardybell.t8rsk8s.io
        </span>
        <span className="font-mono text-garden-400/80 tabular-nums">
          Build {buildId} &middot; {gmt} &middot; {local} ({tz})
        </span>
      </div>
    </footer>
  );
}
