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
  primary: 'text-blue-600 bg-blue-50 border-blue-100',
  blue: 'text-blue-600 bg-blue-50 border-blue-100',
  red: 'text-red-600 bg-red-50 border-red-100',
  muted: 'text-gray-650 bg-gray-50 border-gray-100',
};

export function SosQuickActions() {
  return (
    <div className="flex flex-col bg-white border-y border-gray-100">
      {SOS_PREP_ACTIONS.map((feature) => (
        <Link
          key={feature.id}
          href={feature.href}
          className="flex items-start gap-4 py-5 px-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors no-underline rounded-none"
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${ACCENT_ICON[feature.accent]}`}
          >
            <span className="material-symbols-outlined text-[23px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {feature.icon}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800">
              {feature.label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {feature.tagline}
            </p>
            <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
              <span className="font-bold text-blue-600 uppercase tracking-wide">Setup: </span>
              {feature.howTo}
            </p>
          </div>
          <span className="material-symbols-outlined text-gray-400 self-center">chevron_right</span>
        </Link>
      ))}
    </div>
  );
}
