'use client';

import Link from 'next/link';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';

const LINKS = [
  {
    href: '/safety/manage#guardians',
    icon: 'group_add',
    title: 'Manage guardians',
    body: 'Add accepted guardians who receive trip start, check-in, and SOS alerts.',
  },
  {
    href: '/sos',
    icon: 'emergency',
    title: 'SOS command center',
    body: 'When a trip escalates to SOS, guardians respond here with map and acknowledge.',
  },
  {
    href: '/safety/manage#status',
    icon: 'share_location',
    title: 'Circle live status',
    body: 'See who in your circle is in transit or needs attention from the dashboard.',
  },
] as const;

export function TripsGuardianPanel() {
  return (
    <section className="space-y-3">
      <SentinelSectionHeader
        title="For guardians"
        subtitle="People you protect can share trips with you. You need an accepted guardian relationship."
      />
      <div className="grid gap-2">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="mod-card flex gap-3 rounded-2xl p-4 no-underline transition-opacity hover:opacity-90"
          >
            <div className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary">
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
      <p className="text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
        To watch someone&apos;s live trip, they share their profile link or you open their trip from an alert. Guardian
        watch URLs use{' '}
        <code className="text-[10px]">/safety/trips/watch/[userId]</code>.
      </p>
    </section>
  );
}
