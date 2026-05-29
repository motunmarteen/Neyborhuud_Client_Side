'use client';

import Link from 'next/link';
import { BrandPinAvatar } from '@/components/brand/BrandPinAvatar';
import { useHuudDisplayName } from '@/hooks/useHuudDisplayName';
import {
  resolveProfileDisplayName,
  resolveProfilePersonalName,
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
  const handle = (user?.username ?? 'neybor').trim().toLowerCase();
  const resolvedAvatar = resolveUserAvatarUrl(user);
  const personalName = resolveProfilePersonalName(user, handle);
  const displayName = resolveProfileDisplayName(user, handle);
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
          ? `View ${displayName} (@${handle}) profile in ${huudName}`
          : `View @${handle} profile in ${huudName}`
      }
    >
      <div className={isSky ? 'left-sidebar__sky-profile__avatar' : undefined}>
        <BrandPinAvatar
          src={resolvedAvatar}
          alt={displayName}
          fallbackInitial={initial}
          size="md"
          priority
          className={isSky ? undefined : 'shrink-0 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]'}
        />
      </div>
      <div className={isSky ? 'left-sidebar__sky-profile__copy' : 'min-w-0 flex-1 text-left'}>
        <p className={isSky ? 'left-sidebar__sky-profile__huud' : 'auth-signup-identity-card__eyebrow'}>
          {huudName}
        </p>
        <p
          className={
            isSky
              ? 'left-sidebar__sky-profile__handle'
              : 'auth-signup-identity-card__handle !text-base truncate'
          }
        >
          {displayName}
        </p>
        {hasLegalName ? (
          <p
            className={
              isSky
                ? 'left-sidebar__sky-profile__handle !text-[11px] !font-semibold !opacity-75'
                : 'text-[11px] font-semibold text-[var(--neu-text-muted)] truncate'
            }
          >
            @{handle}
          </p>
        ) : null}
        {isSky ? (
          <p className="left-sidebar__sky-profile__meta-row">
            <span>View profile</span>
            <i className="bi bi-chevron-right" aria-hidden />
          </p>
        ) : (
          <p className="auth-signup-identity-card__meta truncate">View profile</p>
        )}
      </div>
      {!isSky ? (
        <span className="auth-signup-location-peek__chevron shrink-0" aria-hidden>
          <i className="bi bi-chevron-right" />
        </span>
      ) : null}
    </Link>
  );
}
