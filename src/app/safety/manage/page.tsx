'use client';

/**
 * Sentinel Dashboard — guardians, status, alerts, tools (/safety/manage).
 * Linked from hub hero “Dashboard” (Huud Score template).
 */

import { Suspense, useEffect, useState } from 'react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { SentinelBackLink } from '@/components/sentinel/SentinelBackLink';
import SosCountdownOverlay from '@/components/safety/SosCountdownOverlay';
import { DashboardActiveSosPanel } from '@/components/sentinel/dashboard/DashboardActiveSosPanel';
import { DashboardGuardiansPanel } from '@/components/sentinel/dashboard/DashboardGuardiansPanel';
import { DashboardHowItWorks } from '@/components/sentinel/dashboard/DashboardHowItWorks';
import { DashboardLiveStatusPanel } from '@/components/sentinel/dashboard/DashboardLiveStatusPanel';
import { DashboardToolLinks } from '@/components/sentinel/dashboard/DashboardToolLinks';
import { SentinelDashboardHero } from '@/components/sentinel/dashboard/SentinelDashboardHero';
import { SosGuardianIncomingAlerts } from '@/components/sentinel/sos/SosGuardianIncomingAlerts';
import { SosRecentHistory } from '@/components/sentinel/sos/SosRecentHistory';
import { useGuardianAlerts } from '@/contexts/GuardianAlertsContext';
import { useSafetyDashboard } from '@/hooks/useSafetyDashboard';
import { useSos } from '@/hooks/useSos';

export const dynamic = 'force-dynamic';

type DashboardTab = 'overview' | 'guardians' | 'circle' | 'alerts' | 'tools';

const TABS: { id: DashboardTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'guardians', label: 'Guardians', icon: 'group' },
  { id: 'circle', label: 'Circle', icon: 'share_location' },
  { id: 'alerts', label: 'Alerts', icon: 'notifications' },
  { id: 'tools', label: 'Tools', icon: 'handyman' },
];

const HASH_TO_TAB: Record<string, DashboardTab> = {
  guardians: 'guardians',
  linkers: 'guardians',
  status: 'circle',
  checkins: 'overview',
  alerts: 'alerts',
  history: 'alerts',
};

function tabFromHash(): DashboardTab {
  if (typeof window === 'undefined') return 'overview';
  const hash = window.location.hash.replace('#', '');
  return HASH_TO_TAB[hash] ?? 'overview';
}

function SafetyDashboardInner() {
  const [tab, setTab] = useState<DashboardTab>('overview');
  const sos = useSos();
  const { alerts } = useGuardianAlerts();
  const dash = useSafetyDashboard();

  useEffect(() => {
    setTab(tabFromHash());
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setTabWithHash = (id: DashboardTab) => {
    setTab(id);
    const hash =
      id === 'guardians'
        ? '#guardians'
        : id === 'circle'
          ? '#status'
          : id === 'alerts'
            ? '#alerts'
            : '';
    window.history.replaceState(null, '', `/safety/manage${hash}`);
  };

  return (
    <>
      <SosCountdownOverlay
        phase={sos.phase}
        secondsRemaining={sos.secondsRemaining}
        visibilityMode={sos.activeSos?.visibilityMode ?? 'normal'}
        onCancel={() => void sos.cancelSos('User cancelled countdown')}
      />
      <AppBrowseLayout
        maxWidth="920"
        subtitle={
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="material-symbols-outlined shrink-0 text-xl text-brand-blue">dashboard</span>
            <span className="truncate">
              {dash.acceptedGuardianCount} guardian{dash.acceptedGuardianCount === 1 ? '' : 's'}
              {alerts.length > 0 ? ` · ${alerts.length} alert${alerts.length === 1 ? '' : 's'}` : ''}
            </span>
          </span>
        }
        header={
          <div className="flex flex-col gap-3">
            <Suspense fallback={null}>
              <SentinelBackLink />
            </Suspense>
            <BrowseTabStrip tabs={TABS} activeId={tab} onChange={(id) => setTabWithHash(id as DashboardTab)} />
          </div>
        }
      >
        <div className="space-y-5">
          <SentinelDashboardHero
            acceptedGuardians={dash.acceptedGuardianCount}
            pendingIncoming={dash.pendingIncoming}
            activeEmergencyCount={dash.activeEmergencyCount}
            sosPhase={sos.phase}
            alertCount={alerts.length}
          />

          {dash.error && (
            <div className="mod-card rounded-2xl border border-brand-red/30 px-4 py-3 text-sm text-brand-red">
              {dash.error}
              <button
                type="button"
                onClick={() => dash.setError(null)}
                className="ml-2 text-xs font-semibold underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {tab === 'overview' && (
            <>
              <DashboardHowItWorks />
              <DashboardActiveSosPanel sos={sos} />
              {dash.pendingIncoming > 0 && (
                <button
                  type="button"
                  onClick={() => setTabWithHash('guardians')}
                  className="mod-card w-full rounded-2xl border border-primary/25 bg-primary/5 p-4 text-left"
                >
                  <p className="text-sm font-bold text-primary">
                    {dash.pendingIncoming} incoming guardian request
                    {dash.pendingIncoming === 1 ? '' : 's'}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                    Tap to review and accept
                  </p>
                </button>
              )}
            </>
          )}

          {tab === 'guardians' && (
            <DashboardGuardiansPanel
              guardians={dash.guardians}
              incomingRequests={dash.incomingRequests}
              statusFilter={dash.statusFilter}
              onStatusFilterChange={dash.setStatusFilter}
              linkers={dash.linkers}
              linkersLoading={dash.linkersLoading}
              linkersLoaded={dash.linkersLoaded}
              linkersMessage={dash.linkersMessage}
              onLoadLinkers={() => void dash.loadLinkers()}
              onRefresh={dash.fetchData}
              onError={dash.setError}
              loading={dash.loading}
            />
          )}

          {tab === 'circle' && (
            <DashboardLiveStatusPanel
              statusFeed={dash.statusFeed}
              onRefresh={dash.fetchData}
              onError={dash.setError}
            />
          )}

          {tab === 'alerts' && (
            <>
              <SosGuardianIncomingAlerts />
              <DashboardActiveSosPanel sos={sos} />
              <SosRecentHistory />
            </>
          )}

          {tab === 'tools' && <DashboardToolLinks activeEmergencyCount={dash.activeEmergencyCount} />}
        </div>
      </AppBrowseLayout>
    </>
  );
}

export default function SafetyDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <SafetyDashboardInner />
    </Suspense>
  );
}
