export default function SavedLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-3">
        <div className="h-7 w-24 animate-pulse rounded-full bg-white/8" />
        <div className="flex gap-2 mb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-white/8" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/8" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 rounded-full bg-white/10" />
              <div className="h-3 w-1/2 rounded-full bg-white/6" />
              <div className="h-3 w-1/3 rounded-full bg-white/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
