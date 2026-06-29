const STEPS = [
  {
    icon: 'play_circle',
    title: 'Start a session',
    body: 'Choose emergency type and ping interval. Guardians and agencies can be alerted immediately.',
  },
  {
    icon: 'my_location',
    title: 'Continuous pings',
    body: 'Your phone sends GPS (or network fallback) on a fixed interval until you stop or signal is lost.',
  },
  {
    icon: 'stop_circle',
    title: 'Stop when safe',
    body: 'End the session only when you are out of danger. Offline pings queue and sync when back online.',
  },
] as const;

export function LiveTrackingHowItWorks() {
  return (
    <div className="mod-card rounded-2xl border border-brand-red/15 bg-brand-red/5 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-red">How live tracking works</p>
      <p className="mt-2 text-sm" style={{ color: 'var(--neu-text-muted)' }}>
        <strong className="text-brand-red">How:</strong> Start a session when you need guardians to follow your path in
        real time.
      </p>
      <ul className="mt-3 space-y-2">
        {STEPS.map((step) => (
          <li key={step.title} className="flex gap-2.5 text-sm">
            <span className="material-symbols-outlined shrink-0 text-[20px] text-brand-red">{step.icon}</span>
            <span style={{ color: 'var(--neu-text)' }}>
              <strong>{step.title}.</strong>{' '}
              <span style={{ color: 'var(--neu-text-muted)' }}>{step.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
