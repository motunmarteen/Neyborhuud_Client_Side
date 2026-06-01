'use client';

import Link from 'next/link';
import type { SentinelFeature } from '@/lib/sentinel-catalog';

const SOS_PREP_ACTIONS: SentinelFeature[] = [
  {
    id: 'guardians',
    icon: 'shield_person',
    label: 'Trusted contacts',
    tagline: 'People who receive SOS and trip alerts.',
    howTo: 'Add guardians and set who gets notified first.',
    href: '/safety/manage#guardians',
    accent: 'blue',
    tab: 'network',
  },
  {
    id: 'trips',
    icon: 'route',
    label: 'Safe trips',
    tagline: 'Share your route with check-ins.',
    howTo: 'Start a trip before you travel; guardians see progress live.',
    href: '/safety/trips',
    accent: 'primary',
    tab: 'protect',
  },
  {
    id: 'fake-call',
    icon: 'phone_in_talk',
    label: 'Fake call',
    tagline: 'Stage an incoming call to leave a situation.',
    howTo: 'Pick a caller name and delay — full-screen call UI on your device only.',
    href: '/safety/fake-call',
    accent: 'muted',
    tab: 'tools',
  },
  {
    id: 'emergency',
    icon: 'contact_emergency',
    label: 'Emergency contacts',
    tagline: 'Numbers and agencies on speed dial.',
    howTo: 'Keep police, medical, and personal numbers ready before you need them.',
    href: '/safety/emergency',
    accent: 'red',
    tab: 'tools',
  },
];

const ACCENT_ICON: Record<SentinelFeature['accent'], string> = {
  primary: 'text-primary bg-primary/12',
  blue: 'text-brand-blue bg-brand-blue/10',
  red: 'text-brand-red bg-brand-red/10',
  muted: 'text-[var(--neu-text-muted)] bg-[var(--neu-shadow-dark)]/30',
};

export function SosQuickActions() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SOS_PREP_ACTIONS.map((feature) => (
        <Link
          key={feature.id}
          href={feature.href}
          className="mod-card mod-card-hover group flex min-h-[9rem] flex-col gap-2 rounded-2xl p-4 no-underline"
        >
          <div
            className={`mod-inset flex h-10 w-10 items-center justify-center rounded-xl ${ACCENT_ICON[feature.accent]}`}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {feature.icon}
            </span>
          </div>
          <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
            {feature.label}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
            {feature.tagline}
          </p>
          <p
            className="mt-auto border-t pt-2 text-[11px] leading-snug"
            style={{ borderColor: 'var(--neu-shadow-dark)', color: 'var(--neu-text-secondary)' }}
          >
            <span className="font-semibold text-primary">How: </span>
            {feature.howTo}
          </p>
        </Link>
      ))}
    </div>
  );
}
