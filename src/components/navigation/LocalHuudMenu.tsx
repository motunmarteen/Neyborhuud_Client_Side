'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';
import {
  LOCAL_HUUD_LINKS,
  LOCAL_HUUD_MENU,
  getLocalHuudLinkForPath,
  isLocalHuudPath,
} from '@/lib/localHuudLinks';

type LocalHuudMenuProps = {
  variant?: 'sidebar' | 'panel';
  onNavigate?: () => void;
  defaultOpen?: boolean;
  className?: string;
};

function NavRow({
  href,
  icon,
  label,
  active,
  onNavigate,
  asButton,
  expanded,
  onToggle,
  subtitle,
}: {
  href?: string;
  icon: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
  asButton?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  subtitle?: string;
}) {
  const className = `left-sidebar__link${active ? ' left-sidebar__link--active' : ''}`;

  const inner = (
    <>
      <span className="left-sidebar__link-icon">
        <span className={`material-symbols-outlined${active ? ' fill-1' : ''}`}>{icon}</span>
      </span>
      <span className="left-sidebar__link-text min-w-0 flex-1">
        <span className="left-sidebar__link-label block">{label}</span>
        {subtitle ? (
          <span className="left-sidebar__link-sub block truncate text-[10px] font-medium normal-case tracking-normal text-[var(--neu-text-muted)]">
            {subtitle}
          </span>
        ) : null}
      </span>
      {asButton ? (
        <span
          className={`material-symbols-outlined shrink-0 text-[20px] text-[var(--neu-text-muted)] transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          expand_more
        </span>
      ) : null}
    </>
  );

  if (asButton) {
    return (
      <button
        type="button"
        className={className}
        aria-expanded={expanded ? true : false}
        onClick={onToggle}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link href={href!} onClick={onNavigate} className={className}>
      {inner}
    </Link>
  );
}

export function LocalHuudMenu({
  variant = 'sidebar',
  onNavigate,
  defaultOpen = false,
  className = '',
}: LocalHuudMenuProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panelId = useId();
  const childActive = isLocalHuudPath(pathname);
  const activeLink = getLocalHuudLinkForPath(pathname);

  const [open, setOpen] = useState(defaultOpen || childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive, pathname]);

  const isItemActive = useCallback(
    (href: string, type: string) => {
      if (href && pathname?.startsWith(href)) return true;
      if (pathname === '/feed' && searchParams.get('type') === type) return true;
      return false;
    },
    [pathname, searchParams],
  );

  const triggerSubtitle =
    childActive && activeLink
      ? activeLink.label
      : `${LOCAL_HUUD_LINKS.length} services in your Huud`;

  const subnav = (
    <ul
      id={panelId}
      className="left-sidebar__subnav"
      role="group"
      aria-label={`${LOCAL_HUUD_MENU.label} links`}
    >
      {LOCAL_HUUD_LINKS.map((item) => (
        <li key={item.type} className="left-sidebar__nav-item">
          <NavRow
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={isItemActive(item.href, item.type)}
            onNavigate={onNavigate}
          />
        </li>
      ))}
    </ul>
  );

  if (variant === 'panel') {
    return (
      <div className={`mod-card overflow-hidden rounded-2xl p-1 ${className}`.trim()}>
        <div className="mod-inset rounded-xl p-1">
          <NavRow
            asButton
            icon={LOCAL_HUUD_MENU.icon}
            label={LOCAL_HUUD_MENU.label}
            active={childActive}
            expanded={open}
            onToggle={() => setOpen((v) => !v)}
            subtitle={triggerSubtitle}
          />
          {open ? subnav : null}
        </div>
      </div>
    );
  }

  return (
    <section className={`left-sidebar__section left-sidebar__section--local-huud ${className}`.trim()}>
      <ul className="left-sidebar__nav">
        <li className="left-sidebar__nav-item">
          <NavRow
            asButton
            icon={LOCAL_HUUD_MENU.icon}
            label={LOCAL_HUUD_MENU.label}
            active={childActive}
            expanded={open}
            onToggle={() => setOpen((v) => !v)}
            subtitle={triggerSubtitle}
          />
        </li>
      </ul>
      {open ? subnav : null}
    </section>
  );
}
