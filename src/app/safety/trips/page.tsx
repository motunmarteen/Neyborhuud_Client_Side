'use client';

/**
 * /safety/trips — Safe Trips (Huud Score / Sentinel template).
 * Tabs: Trip · Start · History · Circle
 */

import { Suspense, useEffect, useState } from 'react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { SentinelBackLink } from '@/components/sentinel/SentinelBackLink';
import { TripsActivePanel } from '@/components/sentinel/trips/TripsActivePanel';
import { TripsAutoSosBanner } from '@/components/sentinel/trips/TripsAutoSosBanner';
import { TripsEscalationBanner } from '@/components/sentinel/trips/TripsEscalationBanner';
import { TripsFloatingSosButton } from '@/components/sentinel/trips/TripsFloatingSosButton';
import { TripsGuardianPanel } from '@/components/sentinel/trips/TripsGuardianPanel';
import { TripsHistoryPanel } from '@/components/sentinel/trips/TripsHistoryPanel';
import { TripsHowItWorks } from '@/components/sentinel/trips/TripsHowItWorks';
import { TripsPageHero } from '@/components/sentinel/trips/TripsPageHero';
import { TripsStartForm } from '@/components/sentinel/trips/TripsStartForm';
import { isLiveTripStatus } from '@/components/sentinel/trips/tripsFormat';
import { useTripMonitor } from '@/hooks/useTripMonitor';

export const dynamic = 'force-dynamic';

type TripsTab = 'trip' | 'start' | 'history' | 'circle';

const TABS: { id: TripsTab; label: string; icon: string }[] = [
  { id: 'trip', label: 'Trip', icon: 'route' },
  { id: 'start', label: 'Start', icon: 'play_circle' },
  { id: 'history', label: 'History', icon: 'history' },
  { id: 'circle', label: 'Circle', icon: 'groups' },
];

const HASH_TO_TAB: Record<string, TripsTab> = {
  start: 'start',
  history: 'history',
  circle: 'circle',
  trip: 'trip',
};

function tabFromHash(): TripsTab {
  if (typeof window === 'undefined') return 'trip';
  const hash = window.location.hash.replace('#', '');
  return HASH_TO_TAB[hash] ?? 'trip';
}

function SafeTripsInner() {
  const [tab, setTab] = useState<TripsTab>('trip');
  const {
    state,
    startTrip,
    checkIn,
    completeTrip,
    cancelTrip,
    pauseTrip,
    resumeTrip,
    dismissEscalationAlert,
    triggerManualSos,
  } = useTripMonitor();

  const hasActiveTrip = state.trip !== null && isLiveTripStatus(state.trip.status);
  const isLiveTrip = hasActiveTrip && !state.trip?.pausedAt;

  useEffect(() => {
    setTab(tabFromHash());
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (hasActiveTrip && tab === 'start') {
      setTab('trip');
    }
  }, [hasActiveTrip, tab]);

  const setTabWithHash = (id: TripsTab) => {
    setTab(id);
    const hash = id === 'trip' ? '' : `#${id}`;
    window.history.replaceState(null, '', `/safety/trips${hash}`);
  };

  return (
    <>
      <AppBrowseLayout
        maxWidth="680"
        header={
          <div className="flex flex-col gap-3">
            <Suspense fallback={null}>
              <SentinelBackLink />
            </Suspense>
            <BrowseTabStrip tabs={TABS} activeId={tab} onChange={(id) => setTabWithHash(id as TripsTab)} />
          </div>
        }
      >
        <div className="space-y-5 pb-20">
          <TripsPageHero
            trip={state.trip}
            tracking={state.tracking}
            checkInCountdown={state.checkInCountdown}
            autoSosTriggered={state.autoSosTriggered}
          />

          {state.error ? (
            <div className="mod-card rounded-2xl border border-brand-red/30 px-4 py-3 text-sm text-brand-red">
              {state.error}
            </div>
          ) : null}

          {state.autoSosTriggered ? <TripsAutoSosBanner onCheckIn={() => void checkIn()} /> : null}

          {state.escalationAlert && !state.autoSosTriggered ? (
            <TripsEscalationBanner
              alert={state.escalationAlert}
              onDismiss={dismissEscalationAlert}
              onCheckIn={() => void checkIn()}
            />
          ) : null}

          {tab === 'trip' && (
            <>
              {state.loading && !state.trip ? (
                <div className="mod-card rounded-2xl p-6 text-center text-sm" style={{ color: 'var(--neu-text-muted)' }}>
                  Loading trip…
                </div>
              ) : null}

              {hasActiveTrip && state.trip ? (
                <TripsActivePanel
                  trip={state.trip}
                  tracking={state.tracking}
                  checkInCountdown={state.checkInCountdown}
                  currentLocation={state.currentLocation}
                  onCheckIn={() => void checkIn()}
                  onComplete={() => void completeTrip()}
                  onCancel={(reason) => void cancelTrip(reason)}
                  onPause={() => void pauseTrip()}
                  onResume={() => void resumeTrip()}
                />
              ) : !state.loading ? (
                <div className="mod-card rounded-2xl p-4 text-center">
                  <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                    No active trip
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                    Start a safe trip to share live progress with your guardians.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTabWithHash('start')}
                    className="mt-3 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white"
                  >
                    Start a trip
                  </button>
                </div>
              ) : null}
            </>
          )}

          {tab === 'start' && (
            <>
              {hasActiveTrip ? (
                <div className="mod-card rounded-2xl p-4 text-sm" style={{ color: 'var(--neu-text-muted)' }}>
                  You already have a trip in progress. Use the <strong>Trip</strong> tab to check in or mark arrived.
                </div>
              ) : (
                <TripsStartForm
                  disabled={state.loading}
                  onStart={async (payload) => {
                    await startTrip(payload);
                    setTabWithHash('trip');
                  }}
                />
              )}
              <TripsHowItWorks />
            </>
          )}

          {tab === 'history' && <TripsHistoryPanel />}

          {tab === 'circle' && <TripsGuardianPanel />}

          {tab === 'trip' && !hasActiveTrip && !state.loading ? <TripsHowItWorks /> : null}
        </div>
      </AppBrowseLayout>

      {isLiveTrip ? <TripsFloatingSosButton onClick={triggerManualSos} /> : null}
    </>
  );
}

export default function SafeTripsPage() {
  return (
    <Suspense>
      <SafeTripsInner />
    </Suspense>
  );
}
