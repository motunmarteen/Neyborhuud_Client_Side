export default function HuudEconomyLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {/* Balance card */}
        <div className="animate-pulse rounded-3xl bg-white/5 p-6 space-y-3">
          <div className="h-3.5 w-24 rounded-full bg-white/6" />
          <div className="h-10 w-40 rounded-full bg-white/10" />
          <div className="flex gap-3 pt-2">
            <div className="h-9 flex-1 rounded-2xl bg-white/8" />
            <div className="h-9 flex-1 rounded-2xl bg-white/6" />
          </div>
        </div>
        {/* Section header */}
        <div className="h-4 w-28 animate-pulse rounded-full bg-white/6" />
        {/* Transaction rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 shrink-0 rounded-full bg-white/8" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/2 rounded-full bg-white/8" />
              <div className="h-3 w-1/3 rounded-full bg-white/5" />
            </div>
            <div className="h-4 w-14 rounded-full bg-white/8" />
          </div>
        ))}
      </div>
    </div>
  );
}
