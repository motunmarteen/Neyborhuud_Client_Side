'use client';

export function LiveTrackingDuringSessionTips() {
  return (
    <div className="mod-card rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">While this session is active</p>
      <ul className="mt-2 space-y-2 text-sm" style={{ color: 'var(--neu-text-muted)' }}>
        <li>
          <strong style={{ color: 'var(--neu-text)' }}>Keep this app open</strong> (or in the background) so your phone
          can send location pings every interval.
        </li>
        <li>
          <strong style={{ color: 'var(--neu-text)' }}>Allow location</strong> when the browser asks — GPS works best;
          network estimate is used if GPS is weak.
        </li>
        <li>
          <strong style={{ color: 'var(--neu-text)' }}>Stay on the Live tab</strong> to see pings and distance. Use{' '}
          <strong>Trail</strong> for the path history. <strong>Start</strong> is only for beginning a new session.
        </li>
        <li>
          <strong style={{ color: 'var(--neu-text)' }}>Stop tracking</strong> only when you are safe — that ends sharing
          with guardians.
        </li>
        <li>
          <strong style={{ color: 'var(--neu-text)' }}>Open SOS</strong> if danger escalates — live tracking and SOS work
          together but are separate features.
        </li>
      </ul>
      <p className="mt-2 text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
        &quot;Realtime offline&quot; means the live socket is disconnected; pings can still upload over normal internet.
        Check that last ping time keeps updating.
      </p>
    </div>
  );
}
