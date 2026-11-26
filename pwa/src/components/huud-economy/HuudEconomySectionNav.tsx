'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  HUUD_ECONOMY_SECTIONS,
  resolveHuudEconomySection,
} from '@/lib/huud-economy-nav';

export function HuudEconomyHero() {
  return (
    <p className="px-1 text-[15px] leading-relaxed text-muted">
      Your Huud Score, your HuudCredit and how much neighbours trust you.
    </p>
  );
}

export function HuudEconomySectionNav() {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const active = resolveHuudEconomySection(pathname, searchParams.get('tab'));

  return (
    <nav aria-label="Huud Economy" className="no-scrollbar flex overflow-x-auto border-b border-line">
      {HUUD_ECONOMY_SECTIONS.map((section) => {
        const isActive = section.id === active;
        return (
          <Link
            key={section.id}
            href={section.href}
            className={`relative inline-flex h-11 shrink-0 items-center whitespace-nowrap px-3 text-sm no-underline transition-colors ${
              isActive
                ? 'font-extrabold text-navy after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary'
                : 'font-semibold text-muted hover:text-navy'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
