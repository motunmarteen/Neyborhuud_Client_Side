'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  getLocalHuudHub,
  resolveLocalHuudSection,
  type LocalHuudHubId,
} from '@/lib/local-huud-hub';

type LocalHuudHubHeaderProps = {
  hubId: LocalHuudHubId;
  /** Filters, search, primary CTA row — rendered below section nav. */
  toolbar?: ReactNode;
  hideSectionNav?: boolean;
};

export function LocalHuudHubHero({ hubId }: { hubId: LocalHuudHubId }) {
  const hub = getLocalHuudHub(hubId);

  return (
    <div className="local-huud-hub-hero mod-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="local-huud-hub-hero__icon mod-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden
          >
            {hub.icon}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
            Local Huud · {hub.label}
          </p>
          <p className="mt-0.5 text-sm font-bold leading-snug" style={{ color: 'var(--neu-text)' }}>
            {hub.tagline}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--neu-text-muted)]">{hub.description}</p>
          <p className="local-huud-hub-hero__economy mt-2 text-[11px] font-semibold text-primary/90">
            {hub.economyNote}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LocalHuudHubSectionNav({ hubId }: { hubId: LocalHuudHubId }) {
  const pathname = usePathname() ?? '';
  const hub = getLocalHuudHub(hubId);
  const active = resolveLocalHuudSection(hubId, pathname);

  if (hub.sections.length <= 1) return null;

  return (
    <nav className="browse-chip-row browse-chip-row--scroll no-scrollbar" aria-label={`${hub.label} sections`}>
      {hub.sections.map((section) => {
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
              aria-hidden
            >
              {section.icon}
            </span>
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function LocalHuudHubHeader({ hubId, toolbar, hideSectionNav = false }: LocalHuudHubHeaderProps) {
  return (
    <div className="local-huud-hub-header space-y-3">
      <LocalHuudHubHero hubId={hubId} />
      {!hideSectionNav ? <LocalHuudHubSectionNav hubId={hubId} /> : null}
      {toolbar ? <div className="local-huud-hub-toolbar">{toolbar}</div> : null}
    </div>
  );
}

type LocalHuudHubPrimaryActionProps = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: string;
};

export function LocalHuudHubPrimaryAction({
  label,
  href,
  onClick,
  icon = 'add',
}: LocalHuudHubPrimaryActionProps) {
  const className =
    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold mod-chip mod-chip-active text-primary transition-opacity hover:opacity-90';

  const inner = (
    <>
      <span className="material-symbols-outlined text-[18px]" aria-hidden>
        {icon}
      </span>
      {label}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${className} no-underline`}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}
