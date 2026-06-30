'use client';

import Link from 'next/link';
import { BrandPinAvatar } from '@/components/brand/BrandPinAvatar';
import { useHuudDisplayName } from '@/hooks/useHuudDisplayName';
import {
  resolveProfileDisplayName,
  resolveProfilePersonalName,
  getGuestUsername,
  getGuestDisplayName,
  type ProfileNameSource,
} from '@/lib/profileSnapHelpers';
import {
  resolveProfileAvatarInitial,
  resolveUserAvatarUrl,
  type ProfileAvatarSource,
} from '@/lib/userAvatar';
import type { LocationData } from '@/types/api';

type SidebarProfileLockupProps = {
  user?: (ProfileAvatarSource & ProfileNameSource & { location?: LocationData | null }) | null;
  profileHref: string;
  onNavigate?: () => void;
  variant?: 'default' | 'sky';
};

export function SidebarProfileLockup({
  user,
  profileHref,
  onNavigate,
  variant = 'default',
}: SidebarProfileLockupProps) {
  const handle = (user?.username ?? getGuestUsername()).trim().toLowerCase();
  const resolvedAvatar = resolveUserAvatarUrl(user);
  const personalName = resolveProfilePersonalName(user, handle);
  const displayName = user ? resolveProfileDisplayName(user, handle) : getGuestDisplayName();
  const initial = resolveProfileAvatarInitial(user, handle);
  const isSky = variant === 'sky';
  const huudName = useHuudDisplayName(user);
  const hasLegalName = Boolean(personalName) && displayName.toLowerCase() !== handle;

  return (
    <Link
      href={profileHref}
      onClick={onNavigate}
      className={
        isSky
          ? 'left-sidebar__sky-profile'
          : 'auth-signup-identity-card group no-underline outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2'
      }
      aria-label={
        hasLegalName
          ? isSky
            ? `View ${displayName} (@${handle}) profile`
            : `View ${displayName} (@${handle}) profile in ${huudName}`
          : isSky
            ? `View @${handle} profile`
            : `View @${handle} profile in ${huudName}`
      }
      suppressHydrationWarning
    >
      <div className={isSky ? 'left-sidebar__sky-profile__avatar' : undefined}>
        <BrandPinAvatar
          src={resolvedAvatar}
          alt={displayName}
          fallbackInitial={initial}
          size={isSky ? 'lg' : 'md'}
          priority
          className={isSky ? undefined : 'shrink-0 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]'}
        />
      </div>
      <div className={isSky ? 'left-sidebar__sky-profile__copy' : 'min-w-0 flex-1 text-left'}>
        {!isSky ? (
          <p className="auth-signup-identity-card__eyebrow" suppressHydrationWarning>{huudName}</p>
        ) : null}
        <p
          className={
            isSky
              ? 'left-sidebar__sky-profile__handle'
              : 'auth-signup-identity-card__handle !text-base truncate'
          }
          suppressHydrationWarning
        >
          {displayName}
        </p>
        {hasLegalName ? (
          <div className="flex items-center justify-center gap-1 mt-0.5" suppressHydrationWarning>
            <p
              className={
                isSky
                  ? 'left-sidebar__sky-profile__handle !text-[11px] !font-semibold !opacity-75'
                  : 'text-[11px] font-semibold text-[var(--neu-text-muted)] truncate'
              }
              suppressHydrationWarning
            >
              @{handle}
            </p>
            {isSky && <span className="material-symbols-outlined text-[10px] opacity-70" aria-hidden="true">chevron_right</span>}
          </div>
        ) : (
          isSky && <span className="material-symbols-outlined text-[10px] opacity-70 mt-0.5" aria-hidden="true" suppressHydrationWarning>chevron_right</span>
        )}
      </div>
      {!isSky ? (
        <span className="auth-signup-location-peek__chevron shrink-0" aria-hidden>
          <span className="material-symbols-outlined"  aria-hidden="true">chevron_right</span>
        </span>
      ) : null}
    </Link>
  );
}
