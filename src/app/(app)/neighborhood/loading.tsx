export default function NeighborhoodLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {/* Header skeleton */}
        <div className="h-7 w-44 animate-pulse rounded-full bg-white/8" />
        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white/5 p-4 space-y-2">
              <div className="h-6 w-6 rounded-lg bg-white/8" />
              <div className="h-4 w-8 rounded-full bg-white/10" />
              <div className="h-3 w-16 rounded-full bg-white/5" />
            </div>
          ))}
        </div>
        {/* Section rows */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-white/8" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/3 rounded-full bg-white/8" />
              <div className="h-3 w-1/2 rounded-full bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
