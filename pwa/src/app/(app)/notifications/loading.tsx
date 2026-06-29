export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl divide-y divide-white/5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5 animate-pulse">
            <div className="h-10 w-10 shrink-0 rounded-full bg-white/8" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-full rounded-full bg-white/8" />
              <div className="h-3 w-3/4 rounded-full bg-white/5" />
              <div className="h-2.5 w-16 rounded-full bg-white/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
