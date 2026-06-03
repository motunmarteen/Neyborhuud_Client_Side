'use client';

/**
 * /sos — SOS command center (Huud Score design template).
 *
 * Tabs: Now · Prepare · History · Circle
 * Long-press the bottom-nav SOS tab anywhere for silent alert.
 */

import { Suspense, useState } from 'react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { SentinelBackLink } from '@/components/sentinel/SentinelBackLink';
import SosCountdownOverlay from '@/components/safety/SosCountdownOverlay';
import { SosGuardianIncomingAlerts } from '@/components/sentinel/sos/SosGuardianIncomingAlerts';
import { SosGuardiansFeed } from '@/components/sentinel/sos/SosGuardiansFeed';
import { SosGuardiansNotifiedCard } from '@/components/sentinel/sos/SosGuardiansNotifiedCard';
import { SosHowItWorks } from '@/components/sentinel/sos/SosHowItWorks';
import { SosLongPressTip } from '@/components/sentinel/sos/SosLongPressTip';
import { SosPageHero } from '@/components/sentinel/sos/SosPageHero';
import { SosPanicPinBanner } from '@/components/sentinel/sos/SosPanicPinBanner';
import { SosQuickActions } from '@/components/sentinel/sos/SosQuickActions';
import { SosRecentHistory } from '@/components/sentinel/sos/SosRecentHistory';
import { SosTriggerCard } from '@/components/sentinel/sos/SosTriggerCard';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { useSos } from '@/hooks/useSos';

export const dynamic = 'force-dynamic';

type SosTab = 'now' | 'prepare' | 'history' | 'circle';

const TABS: { id: SosTab; label: string; icon: string }[] = [
  { id: 'now', label: 'Now', icon: 'emergency' },
  { id: 'prepare', label: 'Prepare', icon: 'shield' },
  { id: 'history', label: 'History', icon: 'history' },
  { id: 'circle', label: 'Circle', icon: 'groups' },
];

export default function SosPage() {
  const [tab, setTab] = useState<SosTab>('now');
  const sos = useSos();

  const incidentHref = sos.activeSos?._id ? `/safety/incident/${sos.activeSos._id}` : undefined;
  const showTrigger = sos.phase === 'idle';

  return (
    <>
      <SosCountdownOverlay
        phase={sos.phase}
        secondsRemaining={sos.secondsRemaining}
        visibilityMode={sos.activeSos?.visibilityMode ?? 'normal'}
        onCancel={() => void sos.cancelSos('User cancelled countdown')}
      />
      <AppBrowseLayout
        maxWidth="680"
        header={
          <div className="flex flex-col gap-3">
            <Suspense fallback={null}>
              <SentinelBackLink />
            </Suspense>
            <BrowseTabStrip tabs={TABS} activeId={tab} onChange={(id) => setTab(id as SosTab)} />
          </div>
        }
      >
        <div className="space-y-5">
          <SosPageHero
            phase={sos.phase}
            secondsRemaining={sos.secondsRemaining}
            escalationLevel={sos.activeSos?.escalationLevel ?? 0}
            incidentHref={incidentHref}
            onCancel={() => void sos.cancelSos('Cancelled from /sos page')}
            onResolve={() => void sos.resolveSos()}
          />

          {tab === 'now' && (
            <>
              <SosGuardiansNotifiedCard notifyMeta={sos.notifyMeta} phase={sos.phase} />
              {showTrigger ? <SosTriggerCard sos={sos} /> : null}
              <SosLongPressTip />
              <SosHowItWorks />
            </>
          )}

          {tab === 'prepare' && (
            <>
              <SosPanicPinBanner />
              <section className="space-y-3">
                <SentinelSectionHeader
                  title="Before an emergency"
                  subtitle="Set these up once so SOS and your circle work when it matters."
                />
                <SosQuickActions />
              </section>
              <SosLongPressTip />
            </>
          )}

          {tab === 'history' && <SosRecentHistory />}

          {tab === 'circle' && (
            <>
              <SosGuardianIncomingAlerts />
              <SosGuardiansFeed />
            </>
          )}
        </div>
      </AppBrowseLayout>
    </>
  );
}
