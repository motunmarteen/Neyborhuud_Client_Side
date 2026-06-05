export default function MarketplaceItemLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl">
        {/* Image */}
        <div className="h-72 w-full animate-pulse bg-white/8" />
        <div className="px-4 py-4 space-y-4">
          {/* Price + title */}
          <div className="space-y-2 animate-pulse">
            <div className="h-7 w-28 rounded-full bg-white/10" />
            <div className="h-5 w-3/4 rounded-full bg-white/8" />
          </div>
          {/* Seller row */}
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-white/8" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded-full bg-white/8" />
              <div className="h-3 w-20 rounded-full bg-white/5" />
            </div>
          </div>
          {/* Description */}
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 w-full rounded-full bg-white/5" />
            ))}
          </div>
          {/* CTA */}
          <div className="h-12 w-full animate-pulse rounded-2xl bg-white/8 mt-4" />
        </div>
      </div>
    </div>
  );
}
