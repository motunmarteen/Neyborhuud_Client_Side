'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  ChevronLeft,
  CirclePlus,
  Home,
  LayoutGrid,
  MessageCircle,
  Search,
  Shield,
  Siren,
  Users,
  Phone,
  User,
} from 'lucide-react';

export type AppNavIconName =
  | 'menu'
  | 'search'
  | 'create'
  | 'notifications'
  | 'messages'
  | 'back'
  | 'home'
  | 'shield'
  | 'connect'
  | 'localHuud'
  | 'sos'
  | 'call'
  | 'profile';

type AppNavIconProps = {
  name: AppNavIconName;
  className?: string;
  /** Filled variant for active bottom tabs */
  active?: boolean;
};

const lucideIcons: Record<Exclude<AppNavIconName, 'menu'>, LucideIcon> = {
  search: Search,
  create: CirclePlus,
  notifications: Bell,
  messages: MessageCircle,
  back: ChevronLeft,
  home: Home,
  shield: Shield,
  connect: Users,
  localHuud: LayoutGrid,
  sos: Siren,
  call: Phone,
  profile: User,
};

function MenuIcon() {
  return (
    <svg className="app-nav-icon__glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6.5h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 12h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 17.5h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SentinelIcon({ active, className, ...props }: React.SVGProps<SVGSVGElement> & { active?: boolean }) {
  return (
    <svg className={className || "app-nav-icon__glyph"} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      {/* Filled Quadrants: Top-Right and Bottom-Left */}
      <path 
        d="M12 2L20 5V12H12Z M12 12H4C4 18 12 22 12 22Z" 
        fill="#00d431" 
        fillOpacity={active ? 1 : 0.8}
      />
      {/* Shield Outline and Cross Divider */}
      <path 
        d="M20 12V5l-8-3-8 3v7c0 6 8 10 8 10s8-4 8-10z M12 2v20 M4 12h16" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

function NavIconShell({
  name,
  className,
  children,
}: {
  name: AppNavIconName;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const playTap = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('is-tapping');
    void el.offsetWidth;
    el.classList.add('is-tapping');
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const trigger = el.closest(
      '.app-topnav__action, .app-bottomnav__item, .app-bottomnav__sos-btn, button.app-bottomnav__item',
    ) as HTMLElement | null;
    if (!trigger) return;

    const handleTap = (event: PointerEvent) => {
      if (event.button !== 0) return;
      playTap();
    };

    trigger.addEventListener('pointerup', handleTap);
    return () => trigger.removeEventListener('pointerup', handleTap);
  }, [playTap]);

  return (
    <span
      ref={ref}
      data-nav-icon={name}
      className={`app-nav-icon-shell app-nav-icon-shell--${name}${className ? ` ${className}` : ''}`}
      onAnimationEnd={() => ref.current?.classList.remove('is-tapping')}
    >
      {children}
    </span>
  );
}

export function AppNavIcon({ name, className, active = false }: AppNavIconProps) {
  const filled = active && name !== 'sos';

  return (
    <NavIconShell name={name} className={className}>
      {name === 'menu' ? (
        <MenuIcon />
      ) : name === 'shield' ? (
        <SentinelIcon active={filled} />
      ) : (
        (() => {
          const Icon = lucideIcons[name];
          return (
            <Icon
              className="app-nav-icon__glyph"
              strokeWidth={2}
              fill={filled ? 'currentColor' : 'none'}
              aria-hidden
            />
          );
        })()
      )}
    </NavIconShell>
  );
}
