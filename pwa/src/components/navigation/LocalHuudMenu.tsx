'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  LOCAL_HUUD_LINKS,
  LOCAL_HUUD_MENU,
  getLocalHuudLinkForPath,
  isLocalHuudPath,
  type LocalHuudLink,
} from '@/lib/localHuudLinks';

type LocalHuudMenuProps = {
  variant?: 'sidebar' | 'panel';
  onNavigate?: () => void;
  className?: string;
};

function getLocalHuudRotationItems(): LocalHuudLink[] {
  const priority = ['marketplace', 'services', 'job', 'event'];
  const byType = new Map(LOCAL_HUUD_LINKS.map((item) => [item.type, item]));
  const ordered = priority
    .map((type) => byType.get(type))
    .filter((item): item is LocalHuudLink => Boolean(item));
  const rest = LOCAL_HUUD_LINKS.filter((item) => !priority.includes(item.type));
  return [...ordered, ...rest];
}

function LocalHuudRotatingSubtitle({ label, visible }: { label: string; visible: boolean }) {
  return (
    <span
      className="left-sidebar__link-sub left-sidebar__link-sub--rotate block truncate"
      aria-live="polite"
    >
      <span className={`left-sidebar__link-sub-rotate__text${visible ? ' is-visible' : ''}`}>
        {label}
      </span>
    </span>
  );
}

function useLocalHuudRotation(active = true) {
  const items = useMemo(() => getLocalHuudRotationItems(), []);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active || items.length <= 1) return;

    let swapTimeout: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      setVisible(false);
      swapTimeout = setTimeout(() => {
        setIndex((current) => (current + 1) % items.length);
        setVisible(true);
      }, 220);
    }, 2800);

    return () => {
      clearInterval(interval);
      if (swapTimeout) clearTimeout(swapTimeout);
    };
  }, [active, items.length]);

  return { items, index, visible };
}

function NavRow({
  href,
  icon,
  label,
  active,
  onNavigate,
  subtitle,
  flat = false,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
  subtitle?: ReactNode;
  /** Sidebar Local Huud row — no pill/chip container on hover or active */
  flat?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`left-sidebar__link${flat ? ' left-sidebar__link--flat' : ''}${active ? ' left-sidebar__link--active' : ''}`}
    >
      <span className="left-sidebar__link-icon" aria-hidden>
        <span className={`material-symbols-outlined${active ? ' fill-1' : ''}`}>{icon}</span>
      </span>
      <span className="left-sidebar__link-text min-w-0 flex-1">
        <span className="left-sidebar__link-label block">{label}</span>
        {subtitle ? (
          typeof subtitle === 'string' ? (
            <span className="left-sidebar__link-sub block truncate">{subtitle}</span>
          ) : (
            subtitle
          )
        ) : null}
      </span>
    </Link>
  );
}

export function LocalHuudMenu({
  variant = 'sidebar',
  onNavigate,
  className = '',
}: LocalHuudMenuProps) {
  const pathname = usePathname();
  const childActive = isLocalHuudPath(pathname);
  const activeLink = getLocalHuudLinkForPath(pathname);
  const { items, index, visible } = useLocalHuudRotation(!childActive);

  const currentItem = childActive && activeLink ? activeLink : items[index];

  if (variant === 'panel') {
    return (
      <section className={className.trim()} aria-label={`${LOCAL_HUUD_MENU.label} links`}>
        <ul className="left-sidebar__nav space-y-0.5">
      {LOCAL_HUUD_LINKS.map((item) => (
        <li key={item.type} className="left-sidebar__nav-item">
          <NavRow
            href={item.href}
            icon={item.icon}
            label={item.label}
                active={
                  pathname === item.href || Boolean(pathname?.startsWith(`${item.href}/`))
                }
            onNavigate={onNavigate}
          />
        </li>
      ))}
    </ul>
      </section>
    );
  }

  return (
    <li className={`left-sidebar__nav-item ${className}`.trim()}>
          <NavRow
        href={currentItem.href}
            icon={LOCAL_HUUD_MENU.icon}
            label={LOCAL_HUUD_MENU.label}
            active={childActive}
            flat
        onNavigate={onNavigate}
        subtitle={
          childActive && activeLink ? (
            activeLink.label
          ) : (
            <LocalHuudRotatingSubtitle label={items[index]?.label ?? ''} visible={visible} />
          )
        }
          />
        </li>
  );
}
