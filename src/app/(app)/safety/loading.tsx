export default function SafetyLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {/* Page header */}
        <div className="h-7 w-28 animate-pulse rounded-full bg-white/8" />
        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white/5 p-5 space-y-3">
              <div className="h-9 w-9 rounded-xl bg-white/8" />
              <div className="h-3.5 w-24 rounded-full bg-white/8" />
              <div className="h-3 w-full rounded-full bg-white/5" />
            </div>
          ))}
        </div>
        {/* Recent activity */}
        <div className="h-4 w-36 animate-pulse rounded-full bg-white/6 mt-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 shrink-0 rounded-full bg-white/8" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded-full bg-white/8" />
              <div className="h-3 w-1/3 rounded-full bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
