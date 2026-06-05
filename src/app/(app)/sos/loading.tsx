export default function SosLoading() {
  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        {/* SOS ring placeholder */}
        <div className="h-52 w-52 rounded-full bg-white/5 border-4 border-white/8" />
        {/* Label */}
        <div className="h-4 w-32 rounded-full bg-white/8" />
        {/* Sub-label */}
        <div className="h-3 w-52 rounded-full bg-white/5" />
        {/* Action row */}
        <div className="flex gap-4 mt-2">
          <div className="h-12 w-28 rounded-2xl bg-white/8" />
          <div className="h-12 w-28 rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
