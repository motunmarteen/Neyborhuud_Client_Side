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
  MessagesSquare,
  Search,
  Shield,
  Siren,
  Users,
  Phone,
  User,
  MapPin,
  Contact,
  Speech,
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
  | 'gist'
  | 'profile'
  | 'mapPin';

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
  connect: MessagesSquare,
  localHuud: LayoutGrid,
  sos: Siren,
  call: Phone,
  gist: Speech,
  profile: User,
  mapPin: MapPin,
};

function MenuIcon() {
  return (
    <svg className="app-nav-icon__glyph" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <rect x="2" y="5.25" width="12" height="1.5" rx="0.75" />
      <rect x="2" y="11.25" width="8" height="1.5" rx="0.75" />
    </svg>
  );
}

export function SentinelIcon({ active, className, ...props }: React.SVGProps<SVGSVGElement> & { active?: boolean }) {
  return (
    <svg className={className || "app-nav-icon__glyph"} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      {/* Sleek outer shield with curved edges */}
      <path
        d="M12 21.5c0 0 8-4 8-10V5c0 0-4 0-8-3-4 3-8 3-8 3v6.5c0 6 8 10 8 10z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
      />
      {/* Primary AI Star inside */}
      <path
        d="M12 8c0 2 1.5 3.5 3.5 3.5-2 0-3.5 1.5-3.5 3.5 0-2-1.5-3.5-3.5-3.5C10.5 11.5 12 10 12 8z"
        fill={active ? "#1A221C" : "#00c431"}
      />
      {/* Accent AI Star top right */}
      <path
        d="M16.5 5.5c0 .8.6 1.4 1.4 1.4-.8 0-1.4.6-1.4 1.4 0-.8-.6-1.4-1.4-1.4.8 0 1.4-.6 1.4-1.4z"
        fill={active ? "#1A221C" : "#00c431"}
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
              strokeWidth={1.5}
              fill={filled ? 'currentColor' : 'none'}
              aria-hidden
            />
          );
        })()
      )}
    </NavIconShell>
  );
}
