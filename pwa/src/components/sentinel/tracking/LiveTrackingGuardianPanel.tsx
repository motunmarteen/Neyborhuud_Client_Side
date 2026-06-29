'use client';

import Link from 'next/link';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';

const LINKS = [
  {
    href: '/safety/manage#guardians',
    icon: 'group_add',
    title: 'Manage guardians',
    body: 'Only accepted guardians receive live tracking pings and alerts.',
  },
  {
    href: '/sos',
    icon: 'emergency',
    title: 'SOS command center',
    body: 'Pair tracking with SOS if the situation escalates.',
  },
  {
    href: '/safety/trips',
    icon: 'route',
    title: 'Safe trips',
    body: 'For planned journeys with check-ins — lighter than live tracking.',
  },
] as const;

export function LiveTrackingGuardianPanel() {
  return (
    <section className="space-y-3">
      <SentinelSectionHeader
        title="For guardians"
        subtitle="You protect someone when they add you as an accepted guardian."
      />
      <div className="grid gap-2">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="mod-card flex gap-3 rounded-2xl p-4 no-underline"
          >
            <div className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-red">
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {item.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
                {item.body}
              </p>
            </div>
            <span className="material-symbols-outlined shrink-0 self-center text-primary">chevron_right</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
