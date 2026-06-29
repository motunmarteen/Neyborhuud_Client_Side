'use client';

/**
 * /safety/kidnapping-tracking — Live tracking (Huud Score / Sentinel template).
 * Tabs: Live · Start · Trail · Circle
 */

import { useQueryClient } from '@tanstack/react-query';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { SentinelBackLink } from '@/components/sentinel/SentinelBackLink';
import { LiveTrackingActivePanel } from '@/components/sentinel/tracking/LiveTrackingActivePanel';
import { LiveTrackingDuringSessionTips } from '@/components/sentinel/tracking/LiveTrackingDuringSessionTips';
import { LiveTrackingGuardianPanel } from '@/components/sentinel/tracking/LiveTrackingGuardianPanel';
import { LiveTrackingHowItWorks } from '@/components/sentinel/tracking/LiveTrackingHowItWorks';
import { LiveTrackingPageHero } from '@/components/sentinel/tracking/LiveTrackingPageHero';
import { LiveTrackingStartPanel } from '@/components/sentinel/tracking/LiveTrackingStartPanel';
import { LiveTrackingTrailPanel } from '@/components/sentinel/tracking/LiveTrackingTrailPanel';
import { useAuth } from '@/hooks/useAuth';
import { isSessionLive } from '@/lib/liveTrackingFormat';
import { getLiveTrackingBlockers } from '@/lib/safetyEligibility';
import { extractApiError } from '@/lib/safetyLocation';
import { useLiveTrackingPage } from '@/hooks/useLiveTrackingPage';
import type { KidnappingEmergencyType } from '@/services/safety.service';

export const dynamic = 'force-dynamic';

type TrackingTab = 'live' | 'start' | 'trail' | 'circle';

const TABS: { id: TrackingTab; label: string; icon: string }[] = [
  { id: 'live', label: 'Live', icon: 'my_location' },
  { id: 'start', label: 'Start', icon: 'play_circle' },
  { id: 'trail', label: 'Trail', icon: 'timeline' },
  { id: 'circle', label: 'Circle', icon: 'groups' },
];

const HASH_TO_TAB: Record<string, TrackingTab> = {
  live: 'live',
  start: 'start',
  trail: 'trail',
  circle: 'circle',
};

function tabFromHash(): TrackingTab {
  if (typeof window === 'undefined') return 'live';
  const hash = window.location.hash.replace('#', '');
  return HASH_TO_TAB[hash] ?? 'live';
}

function LiveTrackingInner() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TrackingTab>('live');
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const { user } = useAuth();
  const eligibilityIssues = getLiveTrackingBlockers(user);

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ['currentUser'] });
  }, [queryClient]);

  const {
    pageLoading,
    session,
    locationHistory,
    wsAlert,
    setWsAlert,
    wsConnected,
    tracking,
    refreshActiveSession,
    loadHistory,
    historyLoading,
    historyError,
    handleStop,
  } = useLiveTrackingPage();

  const live = isSessionLive(session);

  useEffect(() => {
    setTab(tabFromHash());
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (tab === 'trail' && session?._id) {
      void loadHistory(session._id);
    }
  }, [tab, session?._id, loadHistory]);

  const setTabWithHash = (id: TrackingTab) => {
    setTab(id);
    const hash = id === 'live' ? '' : `#${id}`;
    window.history.replaceState(null, '', `/safety/kidnapping-tracking${hash}`);
  };

  const handleTabChange = (id: string) => {
    if (live && id === 'start') {
      setTabWithHash('start');
      return;
    }
    setTabWithHash(id as TrackingTab);
  };

  const handleStopSession = useCallback(async () => {
    const result = await handleStop();
    if (result.ok) {
      toast.success('Live tracking stopped');
    } else {
      toast.error(result.error || 'Could not stop tracking. Try again.');
    }
  }, [handleStop]);

  const handleLoadSummary = useCallback(async () => {
    const result = await tracking.refreshSummary();
    if (result.ok) {
      toast.success('Session summary loaded');
    } else {
      toast.error(result.error || 'Could not load summary');
    }
  }, [tracking]);

  const handleStart = async (opts: {
    emergencyType: KidnappingEmergencyType;
    intervalSeconds: number;
  }) => {
    setStartError(null);
    setStarting(true);
    try {
      await tracking.startTracking(opts);
      setTabWithHash('live');
      await refreshActiveSession();
    } catch (err: unknown) {
      setStartError(tracking.error || extractApiError(err, 'Failed to start live tracking'));
    } finally {
      setStarting(false);
    }
  };

  return (
    <AppBrowseLayout
      maxWidth="920"
      header={
        <div className="flex flex-col gap-3">
          <Suspense fallback={null}>
            <SentinelBackLink />
          </Suspense>
          <BrowseTabStrip tabs={TABS} activeId={tab} onChange={handleTabChange} />
        </div>
      }
    >
      <div className="space-y-5 pb-20">
        <LiveTrackingPageHero
          session={session}
          wsConnected={wsConnected}
          queuedCount={tracking.queuedCount}
          isOnline={tracking.isOnline}
        />

        {wsAlert ? (
          <div className="mod-card flex items-start justify-between gap-2 rounded-2xl border border-status-warning/40 bg-status-warning/8 px-4 py-3 text-sm text-status-warning dark:bg-status-warning/12 dark:text-status-warning/90">
            <span>{wsAlert}</span>
            <button type="button" onClick={() => setWsAlert(null)} className="shrink-0 text-brand-red">
              Dismiss
            </button>
          </div>
        ) : null}

        {tracking.error ? (
          <div className="mod-card rounded-2xl border border-brand-red/30 px-4 py-3 text-sm text-brand-red">
            {tracking.error}
          </div>
        ) : null}

        {pageLoading ? (
          <div className="mod-card rounded-2xl py-12 text-center text-sm" style={{ color: 'var(--neu-text-muted)' }}>
            Loading session…
          </div>
        ) : (
          <>
            {tab === 'live' && (
              <>
                {live && session ? (
                  <>
                    <LiveTrackingActivePanel
                      session={session}
                      tracking={tracking}
                      onStop={handleStopSession}
                      onRefreshSummary={handleLoadSummary}
                    />
                    <LiveTrackingDuringSessionTips />
                  </>
                ) : (
                  <div className="mod-card rounded-2xl p-4 text-center">
                    <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                      No active tracking session
                    </p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                      Start live tracking when you need guardians to follow your path in real time.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTabWithHash('start')}
                      className="mt-3 rounded-full bg-brand-red px-4 py-2.5 text-sm font-bold text-white"
                    >
                      Start session
                    </button>
                  </div>
                )}
              </>
            )}

            {tab === 'start' && (
              <>
                {live ? (
                  <div className="mod-card rounded-2xl border border-primary/25 bg-primary/5 p-4 text-sm">
                    <p className="font-bold text-primary">Session already running</p>
                    <p className="mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                      You cannot start a second session. Open the <strong>Live</strong> tab to see pings, use{' '}
                      <strong>Trail</strong> for your path, or tap <strong>Stop tracking</strong> when you are safe.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTabWithHash('live')}
                      className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
                    >
                      Go to Live tab
                    </button>
                  </div>
                ) : (
                  <LiveTrackingStartPanel
                    onStart={handleStart}
                    busy={starting || tracking.isTracking}
                    error={startError}
                    eligibilityIssues={eligibilityIssues}
                  />
                )}
                <LiveTrackingHowItWorks />
              </>
            )}

            {tab === 'trail' && (
              <LiveTrackingTrailPanel
                points={locationHistory}
                sessionActive={live}
                loading={historyLoading}
                error={historyError}
                onRefresh={session?._id ? () => void loadHistory(session._id) : undefined}
              />
            )}

            {tab === 'circle' && <LiveTrackingGuardianPanel />}

            {tab === 'live' && !live && !pageLoading ? <LiveTrackingHowItWorks /> : null}
          </>
        )}
      </div>
    </AppBrowseLayout>
  );
}

export default function LiveTrackingPage() {
  return (
    <Suspense>
      <LiveTrackingInner />
    </Suspense>
  );
}
