'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { appendSentinelFromParam, labelForSentinelPath, rememberSentinelBack } from '@/lib/sentinelBrowseBack';

const TOOLS = [
  {
    icon: 'route',
    label: 'Safe trips',
    tagline: 'Monitored journeys with check-ins.',
    howTo: 'Start before you travel; guardians see progress live.',
    href: '/safety/trips',
    accent: 'text-primary bg-primary/12',
  },
  {
    icon: 'fence',
    label: 'Safety zones',
    tagline: 'Geofences for home, work, and risk areas.',
    howTo: 'Draw zones on the map; get entry/exit alerts.',
    href: '/safety/geofences',
    accent: 'text-brand-blue bg-brand-blue/10',
  },
  {
    icon: 'local_police',
    label: 'Report emergency',
    tagline: 'Agency dispatch for robbery, fire, medical.',
    howTo: 'File a report with location; track dispatch status.',
    href: '/safety/emergency',
    accent: 'text-brand-red bg-brand-red/10',
  },
  {
    icon: 'my_location',
    label: 'Emergency tracking',
    tagline: 'High-frequency GPS for critical events.',
    howTo: 'Use when in immediate danger; guardians see trail.',
    href: '/safety/kidnapping-tracking',
    accent: 'text-brand-red bg-brand-red/10',
  },
] as const;

export function DashboardToolLinks({ activeEmergencyCount }: { activeEmergencyCount: number }) {
  const pathname = usePathname();

  return (
    <section className="space-y-3">
      <SentinelSectionHeader
        title="Advanced tools"
        subtitle="Open a focused page for each capability"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={appendSentinelFromParam(tool.href, pathname)}
            onClick={() => rememberSentinelBack(pathname, labelForSentinelPath(pathname))}
            className="mod-card mod-card-hover flex min-h-[9rem] flex-col gap-2 rounded-2xl p-4 no-underline"
          >
            <div className={`mod-inset flex h-10 w-10 items-center justify-center rounded-xl ${tool.accent}`}>
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {tool.icon}
              </span>
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
              {tool.label}
              {tool.href === '/safety/emergency' && activeEmergencyCount > 0 ? (
                <span className="ml-2 rounded-full bg-brand-red px-1.5 py-0.5 text-[10px] text-white">
                  {activeEmergencyCount}
                </span>
              ) : null}
            </p>
            <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
              {tool.tagline}
            </p>
            <p
              className="mt-auto border-t pt-2 text-[11px]"
              style={{ borderColor: 'var(--neu-shadow-dark)', color: 'var(--neu-text-secondary)' }}
            >
              <span className="font-semibold text-primary">How: </span>
              {tool.howTo}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
