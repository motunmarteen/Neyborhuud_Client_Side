export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-brand-black pb-[var(--app-bottomnav-h)]">
      {/* Cover image */}
      <div className="h-44 w-full animate-pulse bg-white/8" />
      <div className="mx-auto max-w-2xl px-4">
        {/* Avatar + action row */}
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="h-20 w-20 rounded-full border-4 border-brand-black bg-white/10 animate-pulse" />
          <div className="h-9 w-24 rounded-full bg-white/8 animate-pulse" />
        </div>
        {/* Name + handle */}
        <div className="space-y-2 mb-4 animate-pulse">
          <div className="h-5 w-40 rounded-full bg-white/10" />
          <div className="h-3.5 w-24 rounded-full bg-white/6" />
        </div>
        {/* Bio */}
        <div className="space-y-2 mb-5 animate-pulse">
          <div className="h-3 w-full rounded-full bg-white/6" />
          <div className="h-3 w-4/5 rounded-full bg-white/6" />
        </div>
        {/* Stats row */}
        <div className="flex gap-6 mb-6 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 w-10 rounded-full bg-white/10" />
              <div className="h-3 w-16 rounded-full bg-white/5" />
            </div>
          ))}
        </div>
        {/* Tab strip */}
        <div className="flex gap-2 mb-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-white/8" />
          ))}
        </div>
        {/* Post cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-3 animate-pulse rounded-2xl bg-white/5 p-4 space-y-2">
            <div className="h-3.5 w-3/4 rounded-full bg-white/8" />
            <div className="h-3 w-1/2 rounded-full bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
