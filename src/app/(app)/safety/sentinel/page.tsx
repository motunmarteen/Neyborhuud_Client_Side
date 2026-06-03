'use client';

import Link from 'next/link';
import { SentinelFeatureCard } from '@/components/sentinel/SentinelFeatureCard';
import { SentinelHowItWorks } from '@/components/sentinel/SentinelHowItWorks';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { SentinelSubpageLayout } from '@/components/sentinel/SentinelSubpageLayout';
import { getSentinelFeature } from '@/lib/sentinel-catalog';

const SCAN_AREAS = [
  {
    icon: 'chat',
    title: 'Messages & chat',
    body: 'Flags harassment, scams, and coercion patterns before they escalate.',
  },
  {
    icon: 'feed',
    title: 'Feed & posts',
    body: 'Surfaces harmful rumours, doxxing, and crisis misinformation in your Huud.',
  },
  {
    icon: 'location_on',
    title: 'Location context',
    body: 'Combines time-of-day and area signals with geofence and trip data.',
  },
  {
    icon: 'gavel',
    title: 'Trust & reports',
    body: 'Weights community reports and TrustOS signals for repeat offenders.',
  },
] as const;

const RELATED = ['emergency', 'geofences', 'guardians'] as const;

export default function SentinelAiPage() {
  return (
    <SentinelSubpageLayout
      pageTitle="Threat scanning"
      pageSubtitle="Sentinel AI watches patterns across your Huud and suggests action."
      icon="psychology"
      iconAccent="blue"
    >
      <div className="mod-card rounded-2xl bg-gradient-to-br from-brand-blue/12 via-[var(--neu-bg)] to-primary/6 p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-blue">
          Sentinel intelligence
        </p>
        <h2 className="mt-2 text-lg font-extrabold" style={{ color: 'var(--neu-text)' }}>
          AI-assisted safety, built for Nigerian neighbourhoods
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
          Sentinel does not replace guardians or emergency services — it helps you spot risk
          earlier, document incidents, and route the right tool (SOS, trips, or agency report).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="mod-chip rounded-full px-3 py-1 text-xs font-semibold">Scanning active</span>
          <span className="mod-chip rounded-full px-3 py-1 text-xs font-semibold text-primary">
            Huud-aware
          </span>
        </div>
      </div>

      <SentinelHowItWorks>
        <ol className="list-decimal space-y-2 pl-4 text-sm">
          <li>Sentinel reviews signals from chat, feed, and location (with your privacy settings).</li>
          <li>High-risk items appear here and in notifications — you choose what to act on.</li>
          <li>
            For immediate danger, use{' '}
            <Link href="/sos" className="font-semibold text-brand-red hover:underline">
              SOS
            </Link>{' '}
            or{' '}
            <Link href="/safety/emergency" className="font-semibold text-primary hover:underline">
              Emergency report
            </Link>
            .
          </li>
        </ol>
      </SentinelHowItWorks>

      <section>
        <SentinelSectionHeader
          title="What Sentinel watches"
          subtitle="Four lenses — same design language as the rest of your safety tools"
        />
        <div className="mt-3 mod-card divide-y overflow-hidden rounded-2xl">
          {SCAN_AREAS.map((row) => (
            <div key={row.title} className="flex gap-3 p-4">
              <div className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-blue">
                <span className="material-symbols-outlined text-[20px]">{row.icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                  {row.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
                  {row.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SentinelSectionHeader title="Related tools" subtitle="Open when Sentinel flags something actionable" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RELATED.map((id) => {
            const f = getSentinelFeature(id);
            return f ? <SentinelFeatureCard key={id} feature={f} compact /> : null;
          })}
        </div>
      </section>
    </SentinelSubpageLayout>
  );
}
