'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  HUUD_ECONOMY_SECTIONS,
  resolveHuudEconomySection,
} from '@/lib/huud-economy-nav';

export function HuudEconomyHero() {
  return (
    <div className="mod-card rounded-2xl p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">Huud Economy</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--neu-text-muted)]">
        Huud Score, HuudCoins wallet, and TrustOS — your neighbourhood reputation and currency in one hub.
      </p>
    </div>
  );
}

export function HuudEconomySectionNav() {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const active = resolveHuudEconomySection(pathname, searchParams.get('tab'));

  return (
    <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
      {HUUD_ECONOMY_SECTIONS.map((section) => {
        const isActive = section.id === active;
        return (
          <Link
            key={section.id}
            href={section.href}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors ${
              isActive ? 'mod-chip mod-chip-active text-primary' : 'mod-chip'
            }`}
            style={isActive ? undefined : { color: 'var(--neu-text-muted)' }}
            aria-current={isActive ? 'page' : undefined}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {section.icon}
            </span>
            {section.label}
          </Link>
        );
      })}
    </div>
  );
}
