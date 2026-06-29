export default function CommunitiesLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {/* Header */}
        <div className="h-7 w-36 animate-pulse rounded-full bg-white/8" />
        {/* Community cards */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white/5">
            <div className="h-28 w-full bg-white/8" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-2/3 rounded-full bg-white/10" />
              <div className="h-3 w-1/2 rounded-full bg-white/6" />
              <div className="flex items-center gap-2 pt-1">
                <div className="h-5 w-5 rounded-full bg-white/8" />
                <div className="h-3 w-20 rounded-full bg-white/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
