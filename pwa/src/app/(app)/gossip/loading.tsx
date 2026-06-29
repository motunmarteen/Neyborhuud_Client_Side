export default function GossipLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        <div className="h-7 w-32 animate-pulse rounded-full bg-white/8" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-white/5 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-white/8" />
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded-full bg-white/8" />
                <div className="h-2.5 w-14 rounded-full bg-white/5" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded-full bg-white/8" />
              <div className="h-3.5 w-5/6 rounded-full bg-white/6" />
              <div className="h-3.5 w-2/3 rounded-full bg-white/5" />
            </div>
            <div className="flex gap-4 pt-1">
              <div className="h-5 w-12 rounded-full bg-white/6" />
              <div className="h-5 w-12 rounded-full bg-white/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
