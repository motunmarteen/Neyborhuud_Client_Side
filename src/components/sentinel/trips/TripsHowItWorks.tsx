const STEPS = [
  {
    icon: 'play_circle',
    title: 'Start a trip',
    body: 'Set origin, destination, ETA, and check-in interval. Guardians are notified immediately.',
  },
  {
    icon: 'location_on',
    title: 'Share live progress',
    body: 'GPS updates in the background while the trip is active. Check in when prompted.',
  },
  {
    icon: 'flag',
    title: 'Arrive safely',
    body: 'Mark arrived to close the trip. Missed check-ins escalate — severe misses can auto-trigger SOS.',
  },
] as const;

export function TripsHowItWorks() {
  return (
    <div className="mod-card rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">How safe trips work</p>
      <p className="mt-2 text-sm" style={{ color: 'var(--neu-text-muted)' }}>
        <strong className="text-primary">How:</strong> Start a trip, check in on schedule, and mark arrived when you reach.
      </p>
      <ul className="mt-3 space-y-2">
        {STEPS.map((step) => (
          <li key={step.title} className="flex gap-2.5 text-sm">
            <span className="material-symbols-outlined shrink-0 text-[20px] text-primary">{step.icon}</span>
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
