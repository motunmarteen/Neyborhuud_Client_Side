'use client';

'use client';

import Link from 'next/link';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { useGuardianAlerts } from '@/contexts/GuardianAlertsContext';
import { mapsUrl } from '@/lib/guardian-alerts';

export function SosGuardianIncomingAlerts() {
  const { alerts, loading, refresh, dismissAlert, acknowledge, acknowledgingId } = useGuardianAlerts();

  return (
    <section className="space-y-0">
      <div className="px-6 py-4">
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
      </div>

      {loading && alerts.length === 0 && (
        <div className="animate-pulse bg-gray-50/30 h-24 border-y border-gray-100" />
      )}

      {!loading && alerts.length === 0 && (
        <div className="bg-white py-8 border-y border-gray-100">
          <BrowseEmptyState
            className="flex flex-col items-center gap-3 bg-white px-6 py-6 text-center rounded-none shadow-none border-0"
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
        </div>
      )}

      {alerts.length > 0 && (
        <ul className="flex flex-col bg-white border-y border-gray-100">
          {alerts.map((alert) => {
            const isSos =
              alert.source === 'manual_sos' || alert.type === 'sos' || Boolean(alert.sosEventId);

            return (
              <li
                key={alert.emergencyId}
                className="space-y-3 py-5 px-6 border-b border-gray-100 last:border-b-0 bg-white rounded-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-red">
                      {isSos ? 'Safety Alert' : 'Safety Alert'}
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
                    className="shrink-0 text-lg leading-none text-gray-400 hover:text-gray-650"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>

                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs text-gray-500">
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
      )}
    </section>
  );
}
