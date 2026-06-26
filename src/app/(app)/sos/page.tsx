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

const SOS_TAB_STYLES: Record<SosTab, { active: string; inactive: string; icon: string }> = {
  now: {
    active: 'bg-red-600 border-red-600 text-white shadow-[0_4px_16px_rgba(220,38,38,0.25)]',
    inactive: 'bg-red-50 border-red-100/50 text-red-600 hover:bg-red-100/60',
    icon: 'emergency',
  },
  prepare: {
    active: 'bg-blue-600 border-blue-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.25)]',
    inactive: 'bg-[#F0F5FF] border-blue-100/50 text-blue-600 hover:bg-blue-100/60',
    icon: 'shield',
  },
  history: {
    active: 'bg-slate-900 border-slate-950 text-white shadow-[0_4px_16px_rgba(15,23,42,0.25)]',
    inactive: 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100/60',
    icon: 'history',
  },
  circle: {
    active: 'bg-emerald-600 border-emerald-600 text-white shadow-[0_4px_16px_rgba(5,150,105,0.25)]',
    inactive: 'bg-[#F0FDF4] border-emerald-100/50 text-emerald-600 hover:bg-emerald-100/60',
    icon: 'groups',
  },
};

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
        className="!bg-white !px-0 !pt-0 !min-h-[100dvh] flex-1"
        header={
          <div className="bg-white">
            <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3 pt-4">
              <Suspense fallback={null}>
                <SentinelBackLink />
              </Suspense>
            </div>
            <div className="relative bg-white border-b border-gray-150/40 mt-3">
              <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] py-4 flex items-center justify-around gap-2 overflow-x-auto no-scrollbar">
                {TABS.map((t) => {
                  const isActive = tab === t.id;
                  const style = SOS_TAB_STYLES[t.id];
                  const circleClass = `w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-200 ${
                    isActive ? style.active : style.inactive
                  }`;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className="flex flex-col items-center gap-1.5 focus:outline-none touch-manipulation group flex-shrink-0"
                    >
                      <div className={circleClass}>
                        <span className="material-symbols-outlined text-[23px] select-none" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                          {style.icon}
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold transition-colors uppercase tracking-wider ${
                        isActive ? 'text-gray-900 font-extrabold' : 'text-gray-400 group-hover:text-gray-600'
                      }`}>
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        }
      >
        <style dangerouslySetInnerHTML={{ __html: `
          main[data-app-scroll-root] {
            background-color: #ffffff !important;
          }
        ` }} />
        <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3 space-y-5">
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
