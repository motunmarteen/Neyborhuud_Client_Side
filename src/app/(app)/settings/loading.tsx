export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-2">
        {/* Section header */}
        <div className="h-3.5 w-24 animate-pulse rounded-full bg-white/6 mb-3 mt-1" />
        {/* Setting rows */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-white/8" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 rounded-full bg-white/8" />
              <div className="h-3 w-56 rounded-full bg-white/5" />
            </div>
            <div className="h-4 w-4 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
