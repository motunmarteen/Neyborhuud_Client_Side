'use client';

import Link from 'next/link';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { useGuardianAlerts } from '@/contexts/GuardianAlertsContext';
import { mapsUrl } from '@/lib/guardian-alerts';

const SEVERITY_RING: Record<string, string> = {
  critical: 'border-brand-red/40 bg-brand-red/8',
  high: 'border-orange-500/35 bg-orange-500/8',
  medium: 'border-amber-500/30 bg-amber-500/8',
  low: 'border-primary/25 bg-primary/5',
};

export function SosGuardianIncomingAlerts() {
  const { alerts, loading, refresh, dismissAlert, acknowledge, acknowledgingId } = useGuardianAlerts();

  return (
    <section className="space-y-3">
      <SentinelSectionHeader
        title="Alerts for you as a guardian"
        subtitle="When someone you protect triggers SOS, their location and status appear here in real time."
        action={
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-xs font-semibold text-primary"
          >
            Refresh
          </button>
        }
      />

      {loading && alerts.length === 0 && (
        <div className="animate-pulse mod-card h-28 rounded-2xl" />
      )}

      {!loading && alerts.length === 0 && (
        <BrowseEmptyState
          icon="notifications_active"
          filledIcon
          title="No active alerts"
          description="When a protégé triggers SOS, you will get a push notification (if enabled) and the alert will show here with their location."
          action={
            <Link
              href="/safety/manage#guardians"
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white no-underline"
            >
              Manage trusted contacts
            </Link>
          }
        />
      )}

      <ul className="space-y-3">
        {alerts.map((alert) => {
          const ring = SEVERITY_RING[alert.severity] ?? SEVERITY_RING.high;
          const isSos =
            alert.source === 'manual_sos' || alert.type === 'sos' || Boolean(alert.sosEventId);

          return (
            <li
              key={alert.emergencyId}
              className={`mod-card space-y-3 rounded-2xl border-2 p-4 ${ring}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-red">
                    {isSos ? 'SOS alert' : 'Emergency'}
                  </p>
                  <p className="mt-0.5 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                    {alert.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
                    {alert.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissAlert(alert.emergencyId)}
                  className="shrink-0 text-lg leading-none"
                  style={{ color: 'var(--neu-text-muted)' }}
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>

              <div className="mod-inset rounded-xl p-3 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                <p className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-brand-red">location_on</span>
                  {alert.locationStr}
                </p>
                {alert.assignedAgency ? (
                  <p className="mt-1">Agency: {alert.assignedAgency}</p>
                ) : null}
                <p className="mt-1 tabular-nums">{new Date(alert.timestamp).toLocaleString()}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={mapsUrl(alert.location.lat, alert.location.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mod-chip inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-primary no-underline"
                >
                  <span className="material-symbols-outlined text-[16px]">map</span>
                  Open map
                </a>
                <Link
                  href={`/safety/trips/watch/${alert.userId}`}
                  className="mod-chip inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold no-underline"
                  style={{ color: 'var(--neu-text)' }}
                >
                  Trip view
                </Link>
                {alert.sosEventId ? (
                  <>
                    <Link
                      href={`/safety/incident/${alert.sosEventId}`}
                      className="mod-chip mod-chip-active inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-primary no-underline"
                    >
                      Incident timeline
                    </Link>
                    <button
                      type="button"
                      disabled={acknowledgingId === alert.sosEventId}
                      onClick={() => void acknowledge(alert.sosEventId!)}
                      className="rounded-full bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {acknowledgingId === alert.sosEventId ? 'Sending…' : 'I’m responding'}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/safety/emergency"
                    className="mod-chip mod-chip-active inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-primary no-underline"
                  >
                    Emergency dashboard
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
