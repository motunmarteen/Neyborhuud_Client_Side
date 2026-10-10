'use client';

import type { SentinelHubTab } from '@/lib/sentinel-catalog';

const QUICK_NAV: {
  tab: SentinelHubTab;
  icon: string;
  label: string;
  hint: string;
  bg: string;
  iconClass: string;
}[] = [
  {
    tab: 'protect',
    icon: 'shield',
    label: 'Protect',
    hint: 'Trips · tracking · zones',
    bg: 'bg-primary/10',
    iconClass: 'text-primary',
  },
  {
    tab: 'network',
    icon: 'groups',
    label: 'Network',
    hint: 'Guardians · circle · status',
    bg: 'bg-brand-blue/10',
    iconClass: 'text-brand-blue',
  },
  {
    tab: 'tools',
    icon: 'construction',
    label: 'Tools',
    hint: 'SOS · PIN · reports',
    bg: 'bg-brand-red/10',
    iconClass: 'text-brand-red',
  },
  {
    tab: 'history',
    icon: 'history',
    label: 'History',
    hint: 'Trips · incidents',
    bg: 'bg-black/5 ',
    iconClass: 'text-[var(--neu-text-muted)]',
  },
];

type SentinelHubQuickNavProps = {
  activeTab: SentinelHubTab;
  onSelect: (tab: SentinelHubTab) => void;
};

export function SentinelHubQuickNav({ activeTab, onSelect }: SentinelHubQuickNavProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {QUICK_NAV.map((item) => {
        const active = activeTab === item.tab;
        return (
          <button
            key={item.tab}
            type="button"
            onClick={() => onSelect(item.tab)}
            className={`mod-card relative overflow-hidden rounded-2xl p-3 text-left transition-all active:scale-[0.98] ${
              active ? 'ring-2 ring-primary/40' : 'mod-card-hover'
            }`}
          >
            <div
              className={`pointer-events-none absolute inset-0 ${item.bg}`}
              aria-hidden
            />
            <div className="relative flex flex-col gap-1">
              <span className={`material-symbols-outlined text-[22px] ${item.iconClass}`}>
                {item.icon}
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {item.label}
              </span>
              <span className="text-[10px] leading-tight" style={{ color: 'var(--neu-text-muted)' }}>
                {item.hint}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
