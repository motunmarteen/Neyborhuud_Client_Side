'use client';

/**
 * Sentinel AI hub — discovery surface for all safety features (Huud Score template).
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { SentinelFeatureCard } from '@/components/sentinel/SentinelFeatureCard';
import { SentinelHubHero } from '@/components/sentinel/SentinelHubHero';
import { SentinelHubQuickNav } from '@/components/sentinel/SentinelHubQuickNav';
import { SentinelHubTabBanner } from '@/components/sentinel/SentinelHubTabBanner';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import SosCountdownOverlay from '@/components/safety/SosCountdownOverlay';
import {
  featuresForTab,
  SENTINEL_FEATURES,
  SENTINEL_HUB_TABS,
  type SentinelHubTab,
} from '@/lib/sentinel-catalog';
import { useSos } from '@/hooks/useSos';
import { safetyService } from '@/services/safety.service';

export const dynamic = 'force-dynamic';

function PanicPinHint() {
  const [pinSet, setPinSet] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void safetyService
      .getPanicPinStatus()
      .then((res) => {
        if (!cancelled) setPinSet(Boolean(res?.data?.panicPinSet));
      })
      .catch(() => {
        if (!cancelled) setPinSet(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (pinSet !== false) return null;

  return (
    <Link
      href="/safety/panic-pin"
      className="group flex items-center gap-3 rounded-2xl border border-brand-red/25 bg-gradient-to-r from-brand-red/8 to-transparent p-3.5 no-underline transition-colors hover:from-brand-red/12"
    >
      <span className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-red">
        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          pin
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-brand-red">Set Panic PIN</p>
        <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
          Recommended — silent SOS from a decoy code
        </p>
      </div>
      <span className="material-symbols-outlined text-brand-red transition-transform group-hover:translate-x-0.5">
        chevron_right
      </span>
    </Link>
  );
}

function SosNavHint() {
  return (
    <div className="flex items-center gap-3 rounded-2xl mod-inset px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-red text-white shadow-[0_4px_12px_rgba(220,38,38,0.35)]">
        <span className="material-symbols-outlined text-[20px]">emergency</span>
      </span>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
        <strong className="text-brand-red">SOS</strong> on the bottom nav — tap to open, long-press for silent alert.
      </p>
    </div>
  );
}

export default function SentinelHubPage() {
  const [tab, setTab] = useState<SentinelHubTab>('overview');
  const sos = useSos();

  const visibleFeatures = tab === 'overview' ? featuresForTab('overview') : featuresForTab(tab);
  const tabFeatureCount =
    tab === 'overview' ? visibleFeatures.length : SENTINEL_FEATURES.filter((f) => f.tab === tab).length;

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
          <BrowseTabStrip
            tabs={SENTINEL_HUB_TABS}
            activeId={tab}
            onChange={(id) => setTab(id as SentinelHubTab)}
            trailing={
              <Link
                href="/sos"
                className="mod-chip mod-chip-active inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-primary no-underline"
                title="SOS command center"
              >
                <span className="material-symbols-outlined text-[16px]">emergency</span>
                <span className="hidden min-[480px]:inline">SOS</span>
              </Link>
            }
          />
        }
      >
        <div className="space-y-5 pb-6">
          {tab === 'overview' ? (
            <>
              <SentinelHubHero
                sosPhase={sos.phase === 'active' || sos.phase === 'pending' ? sos.phase : 'idle'}
                onCancelSos={() => void sos.cancelSos('User cancelled from hub')}
                onResolveSos={() => void sos.resolveSos()}
                incidentHref={
                  sos.activeSos?._id ? `/safety/incident/${sos.activeSos._id}` : undefined
                }
              />

              <SentinelHubQuickNav activeTab={tab} onSelect={setTab} />

              <PanicPinHint />

              <section>
                <SentinelSectionHeader
                  title="Quick access"
                  subtitle="Your most-used tools"
                />
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {visibleFeatures.map((f) => (
                    <SentinelFeatureCard key={f.id} feature={f} />
                  ))}
                </div>
              </section>

              <section>
                <SentinelSectionHeader
                  title="Browse by category"
                  subtitle={`${SENTINEL_FEATURES.length} tools across Sentinel`}
                  action={
                    <button
                      type="button"
                      onClick={() => setTab('protect')}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Explore all
                    </button>
                  }
                />
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {SENTINEL_HUB_TABS.filter((t) => t.id !== 'overview').map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className="mod-chip flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold"
                      style={{ color: 'var(--neu-text)' }}
                    >
                      <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              <SentinelHubTabBanner tab={tab} count={tabFeatureCount} />
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {visibleFeatures.map((f) => (
                  <SentinelFeatureCard key={f.id} feature={f} />
                ))}
              </div>
            </>
          )}

          <SosNavHint />
        </div>
      </AppBrowseLayout>
    </>
  );
}
