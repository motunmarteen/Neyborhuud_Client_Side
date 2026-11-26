'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  getLocalHuudHub,
  resolveLocalHuudSection,
  type LocalHuudHubId,
} from '@/lib/local-huud-hub';
import { useTranslation } from '@/lib/i18n';

type LocalHuudHubHeaderProps = {
  hubId: LocalHuudHubId;
  /** Filters, search, primary CTA row — rendered below section nav. */
  toolbar?: ReactNode;
  /** The main action (e.g. "Post a notice"), shown inside the header card. */
  action?: ReactNode;
  hideSectionNav?: boolean;
};

/** Translated text for a hub, falling back to the English in local-huud-hub.ts. */
function useHubText(hubId: LocalHuudHubId) {
  const { t } = useTranslation();
  const hub = getLocalHuudHub(hubId);
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  return {
    hub,
    tagline: tr(`hub.${hubId}.tagline`, hub.tagline),
    body: tr(`hub.${hubId}.body`, hub.description),
    section: (id: string, fallback: string) => tr(`hub.sec.${id}`, fallback),
    sectionsLabel: tr('hub.sections', 'Sections'),
  };
}

/**
 * Header card for list pages (Phase 4 restyle, 2026-10-18): icon, one plain title and one line,
 * with the main action inside the card. The old "Local Huud ·" label and reward notes are gone
 * (several promised HuudCredit for things that no longer earn it, Phase 7).
 */
export function LocalHuudHubHero({ hubId, action }: { hubId: LocalHuudHubId; action?: ReactNode }) {
  const { hub, tagline, body } = useHubText(hubId);
  // Owner 2026-11-26: the words get the whole width; the button sits under them, inside the card.
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-soft text-brand-green-dark">
        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
          {hub.icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[17px] font-black leading-snug text-navy">{tagline}</p>
        <p className="mt-0.5 text-[13px] font-semibold leading-relaxed text-muted">{body}</p>
        {action ? <div className="mt-3 flex">{action}</div> : null}
      </div>
    </div>
  );
}

export function LocalHuudHubSectionNav({ hubId }: { hubId: LocalHuudHubId }) {
  const pathname = usePathname() ?? '';
  const { hub, section, sectionsLabel } = useHubText(hubId);
  const active = resolveLocalHuudSection(hubId, pathname);

  if (hub.sections.length <= 1) return null;

  return (
    <nav className="no-scrollbar flex overflow-x-auto border-b border-line" aria-label={sectionsLabel}>
      {hub.sections.map((sec) => {
        const isActive = sec.id === active;
        return (
          <Link
            key={sec.id}
            href={sec.href}
            className={[
                'relative inline-flex h-11 shrink-0 items-center whitespace-nowrap px-3 text-sm transition-colors no-underline',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                isActive ? 'font-extrabold text-navy after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary' : 'font-semibold text-muted hover:text-navy',
              ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            {section(`${hubId}.${sec.id}`, sec.label)}
          </Link>
        );
      })}
    </nav>
  );
}

export function LocalHuudHubHeader({ hubId, toolbar, action, hideSectionNav = false }: LocalHuudHubHeaderProps) {
  return (
    <div className="local-huud-hub-header space-y-2.5">
      <LocalHuudHubHero hubId={hubId} action={action} />
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
    'tap-target inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-full bg-primary pl-2.5 pr-3.5 text-[13px] font-extrabold text-white transition-colors hover:bg-brand-green-dark';

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
