export default function MarketplaceLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* Filter bar skeleton */}
        <div className="mb-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-white/8" />
          ))}
        </div>
        {/* Product grid skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white/5">
              <div className="aspect-square bg-white/8" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-3/4 rounded-full bg-white/8" />
                <div className="h-3 w-1/2 rounded-full bg-white/8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
