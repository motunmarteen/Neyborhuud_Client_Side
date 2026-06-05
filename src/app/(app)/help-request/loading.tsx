export default function HelpRequestLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-3">
        <div className="h-7 w-36 animate-pulse rounded-full bg-white/8" />
        <div className="flex gap-2 mb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-16 shrink-0 animate-pulse rounded-full bg-white/8" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-white/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-white/8" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 rounded-full bg-white/10" />
                <div className="h-3 w-1/3 rounded-full bg-white/5" />
              </div>
              <div className="h-6 w-16 rounded-full bg-white/8" />
            </div>
            <div className="h-3 w-full rounded-full bg-white/6" />
            <div className="h-3 w-4/5 rounded-full bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
