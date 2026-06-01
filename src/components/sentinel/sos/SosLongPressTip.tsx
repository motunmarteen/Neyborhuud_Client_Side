export function SosLongPressTip() {
  return (
    <div className="mod-card flex gap-3 rounded-2xl border border-brand-red/15 bg-brand-red/5 p-4">
      <div className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-red">
        <span className="material-symbols-outlined text-[22px]">touch_long</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
          Long-press SOS in the bottom nav
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
          From any screen, press and hold the red SOS tab to fire a silent alert instantly — no countdown,
          no on-screen feedback.
        </p>
      </div>
    </div>
  );
}
