const STEPS = [
  {
    icon: 'group_add',
    title: 'Add guardians',
    body: 'Only mutual followers you trust. Accepted guardians get SOS, trips, and status updates.',
  },
  {
    icon: 'share_location',
    title: 'Share status',
    body: 'Post safe / in transit / need attention so your circle knows how you are without an emergency.',
  },
  {
    icon: 'notifications_active',
    title: 'Respond to alerts',
    body: 'When someone you protect triggers SOS, respond here with map, acknowledge, and incident timeline.',
  },
] as const;

export function DashboardHowItWorks() {
  return (
    <div className="mod-card rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">How the dashboard works</p>
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
