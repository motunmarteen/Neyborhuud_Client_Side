export function SosLongPressTip() {
  return (
    <div className="rounded-none border-y border-red-100 bg-red-50/20 px-6 py-5 shadow-none flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white border border-red-100 text-red-600">
        <span className="material-symbols-outlined text-[22px]">touch_long</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-800">
          Long-press SOS in the bottom nav
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          From any screen, press and hold the red SOS tab to fire a silent alert instantly — no countdown,
          no on-screen feedback.
        </p>
      </div>
    </div>
  );
}
