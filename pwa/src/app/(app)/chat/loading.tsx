export default function ChatLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="mx-auto max-w-2xl divide-y divide-white/5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
            <div className="h-12 w-12 shrink-0 rounded-full bg-white/8" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex justify-between">
                <div className="h-3.5 w-32 rounded-full bg-white/8" />
                <div className="h-3 w-10 rounded-full bg-white/5" />
              </div>
              <div className="h-3 w-2/3 rounded-full bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
