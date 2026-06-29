export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {/* Search bar skeleton */}
        <div className="h-11 w-full animate-pulse rounded-2xl bg-white/8" />
        {/* Tab strip skeleton */}
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-16 shrink-0 animate-pulse rounded-full bg-white/8" />
          ))}
        </div>
        {/* Result rows skeleton */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-white/8" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded-full bg-white/8" />
              <div className="h-3 w-1/3 rounded-full bg-white/8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
