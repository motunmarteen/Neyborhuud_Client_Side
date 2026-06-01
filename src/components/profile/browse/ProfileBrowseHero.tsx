'use client';

import Link from 'next/link';
import { MiniMap } from '@/components/ui/InteractiveMap';
import { BrandPinAvatar } from '@/components/brand/BrandPinAvatar';
import { resolveProfileAvatarInitial, resolveUserAvatarUrl } from '@/lib/userAvatar';
import { PROFILE_MAP_DEFAULT } from '@/lib/profileSnapHelpers';

type ProfileBrowseHeroProps = {
  displayName: string;
  personalName: string;
  username: string;
  profilePicture?: string | null;
  avatarUrl?: string | null;
  isOwnProfile: boolean;
  uploading?: boolean;
  hasMapLocation: boolean;
  mapCenter?: { lat: number; lng: number };
  locationLabel?: string;
  onShare: () => void;
  onMessage?: () => void;
  messaging?: boolean;
  onChangePhoto?: () => void;
  onSetLocation?: () => void;
  onMapLocationChange?: (loc: { lat: number; lng: number }) => void;
  settingLocation?: boolean;
  savingMapLocation?: boolean;
  identityVerified?: boolean;
  vouchCount?: number;
};

export function ProfileBrowseHero({
  displayName,
  personalName,
  username,
  profilePicture,
  avatarUrl,
  isOwnProfile,
  uploading,
  mapCenter,
  locationLabel,
  onShare,
  onMessage,
  messaging,
  onChangePhoto,
  onSetLocation,
  onMapLocationChange,
  settingLocation,
  savingMapLocation,
  identityVerified,
  vouchCount = 0,
}: ProfileBrowseHeroProps) {
  const handle = username.trim().toLowerCase();
  const initial = resolveProfileAvatarInitial({ displayName, username: handle }, handle);
  const resolved = resolveUserAvatarUrl({ profilePicture, avatarUrl });
  const center = mapCenter ?? PROFILE_MAP_DEFAULT;

  const resolvedName =
    personalName.trim() ||
    (displayName.trim().toLowerCase() !== handle &&
    displayName.trim().toLowerCase() !== `@${handle}`
      ? displayName.trim()
      : '');
  const hasFullName = resolvedName.length > 0;
  const primaryLabel = hasFullName ? resolvedName : `@${handle}`;

  return (
    <div className="mod-card overflow-hidden rounded-2xl">
      <div className="relative h-32 w-full overflow-hidden sm:h-36">
        <MiniMap
          center={center}
          height="100%"
          className="absolute inset-0 h-full w-full !rounded-none"
          draggable={isOwnProfile}
          onLocationChange={onMapLocationChange}
          showDragHint={false}
          showNavigationControl={false}
          showAttribution={false}
          customMarkerNode={
            <BrandPinAvatar
              src={resolved}
              alt={displayName}
              fallbackInitial={initial}
              size="marker"
              priority
              className="brand-mark-hero drop-shadow-lg"
            />
          }
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute right-2 top-2 flex gap-1.5">
          <button
            type="button"
            onClick={onShare}
            className="mod-chip inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            Share
          </button>
          {isOwnProfile && onSetLocation ? (
            <button
              type="button"
              onClick={onSetLocation}
              disabled={settingLocation || savingMapLocation}
              className="mod-chip inline-flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-50"
              aria-label="Set location"
            >
              <span className="material-symbols-outlined text-[18px]">
                {settingLocation || savingMapLocation ? 'hourglass_top' : 'my_location'}
              </span>
            </button>
          ) : null}
        </div>
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="mod-chip rounded-full px-3 py-1 text-xs font-semibold">Uploading…</span>
          </div>
        ) : null}
      </div>

      <div className="relative px-4 pb-4">
        <div className="-mt-10 mb-3">
          <BrandPinAvatar
            src={resolved}
            alt={displayName}
            fallbackInitial={initial}
            size="lg"
            onClick={isOwnProfile && !uploading ? onChangePhoto : undefined}
            className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
          />
        </div>

        <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--neu-text)' }}>
          {primaryLabel}
        </h1>
        {hasFullName ? (
          <p className="text-sm text-[var(--neu-text-muted)]">@{handle}</p>
        ) : null}
        {locationLabel ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--neu-text-muted)]">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            {locationLabel}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          {identityVerified ? (
            <span className="mod-chip mod-chip-active inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-primary">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              Verified
            </span>
          ) : null}
          {vouchCount > 0 ? (
            <span className="mod-chip inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
              🤜 {vouchCount} vouches
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {isOwnProfile ? (
            <>
              <Link
                href="/settings"
                className="mod-chip mod-chip-active inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold text-primary"
              >
                My account
              </Link>
              <button
                type="button"
                onClick={onShare}
                className="mod-chip inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold"
              >
                <span className="material-symbols-outlined text-[14px]">share</span>
                Share
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onMessage}
                disabled={messaging}
                className="mod-chip mod-chip-active inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold text-primary disabled:opacity-50"
              >
                {messaging ? 'Opening…' : 'Message'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
