'use client';

type TripsEscalationBannerProps = {
  alert: { level: number; message: string };
  onDismiss: () => void;
  onCheckIn: () => void;
};

export function TripsEscalationBanner({ alert, onDismiss, onCheckIn }: TripsEscalationBannerProps) {
  return (
    <div className="mod-card rounded-2xl border border-amber-400/50 bg-amber-50/80 p-4 dark:bg-amber-950/20">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
            Missed check-in — level {alert.level}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            {alert.message}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-lg leading-none"
          style={{ color: 'var(--neu-text-muted)' }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <button
        type="button"
        onClick={onCheckIn}
        className="mt-3 rounded-full bg-status-warning px-4 py-2.5 text-sm font-bold text-white"
      >
        I&apos;m safe — check in now
      </button>
    </div>
  );
}
