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
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-soft text-brand-green-dark">
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
            {hub.icon}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[17px] font-black leading-snug text-navy">{tagline}</p>
          <p className="mt-0.5 text-[13px] font-semibold leading-relaxed text-muted">{body}</p>
        </div>
      </div>
      {action ? <div className="mt-3 flex">{action}</div> : null}
    </div>
  );
}

export function LocalHuudHubSectionNav({ hubId }: { hubId: LocalHuudHubId }) {
  const pathname = usePathname() ?? '';
  const { hub, section, sectionsLabel } = useHubText(hubId);
  const active = resolveLocalHuudSection(hubId, pathname);

  if (hub.sections.length <= 1) return null;

  return (
    <nav className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1" aria-label={sectionsLabel}>
      {hub.sections.map((sec) => {
        const isActive = sec.id === active;
        return (
          <Link
            key={sec.id}
            href={sec.href}
            className={[
              'tap-target inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-extrabold no-underline',
              'shadow-[0_2px_6px_rgba(29,36,51,0.12)] transition-colors',
              isActive ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-[#F6F8FB]',
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
              {sec.icon}
            </span>
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
    'tap-target inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-extrabold text-white shadow-[0_4px_12px_rgba(0,184,46,0.25)] transition-opacity hover:opacity-90';

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
