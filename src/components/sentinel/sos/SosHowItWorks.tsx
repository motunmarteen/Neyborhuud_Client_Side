const STEPS = [
  {
    icon: 'touch_app',
    title: 'Arm or trigger',
    body: 'Set countdown & options on the Now tab, tap the red button, or long-press SOS in the bottom nav for silent mode.',
  },
  {
    icon: 'groups',
    title: 'Circle responds',
    body: 'Guardians get your live location and can acknowledge. Emergency services dispatch if you enabled them.',
  },
  {
    icon: 'task_alt',
    title: 'Mark safe',
    body: 'When the danger passes, tap “I’m safe” to close the incident and save a recap in History.',
  },
] as const;

export function SosHowItWorks() {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">How SOS works</p>
      <div className="grid gap-2">
        {STEPS.map((step, i) => (
          <div key={step.title} className="mod-card flex gap-3 rounded-2xl p-4">
            <div className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary">
              <span className="text-xs font-black tabular-nums">{i + 1}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden>
                  {step.icon}
                </span>
                <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                  {step.title}
                </p>
              </div>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
