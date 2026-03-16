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
    <footer className="bg-garden-800 text-garden-300 text-xs py-3 px-4">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
        <span>TardyBell &middot; tardybell.t8rsk8s.io</span>
        <span className="font-mono text-garden-400">
          Build {buildId} &middot; {gmt} &middot; {local} ({tz})
        </span>
      </div>
    </footer>
  );
}
