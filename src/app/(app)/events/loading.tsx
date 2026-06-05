export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {/* Header skeleton */}
        <div className="h-7 w-36 animate-pulse rounded-full bg-white/8" />
        {/* Event cards skeleton */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white/5">
            <div className="h-40 w-full bg-white/8" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded-full bg-white/8" />
              <div className="h-3 w-1/2 rounded-full bg-white/8" />
              <div className="flex gap-2 pt-1">
                <div className="h-6 w-20 rounded-full bg-white/8" />
                <div className="h-6 w-16 rounded-full bg-white/8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
