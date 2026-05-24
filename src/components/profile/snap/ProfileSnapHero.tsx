'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MiniMap } from '@/components/ui/InteractiveMap';
import { BrandPinAvatar } from '@/components/brand/BrandPinAvatar';
import { resolveUserAvatarUrl } from '@/lib/userAvatar';
import { PROFILE_MAP_DEFAULT } from '@/lib/profileSnapHelpers';

type ProfileSnapHeroProps = {
  displayName: string;
  personalName: string;
  username: string;
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

function ProfileMapPills({
  isOwnProfile,
  handle,
  onShare,
  onMessage,
  messaging,
}: {
  isOwnProfile: boolean;
  handle: string;
  onShare: () => void;
  onMessage?: () => void;
  messaging?: boolean;
}) {
  return (
    <div className="auth-signup-actions auth-signup-actions--row profile-auth-map-pills">
      {isOwnProfile ? (
        <>
          <Link href="/settings" className="landing-btn landing-btn-secondary profile-auth-map-pill">
            My account
          </Link>
          <button type="button" onClick={onShare} className="landing-btn landing-btn-secondary profile-auth-map-pill">
            Public profile
          </button>
        </>
      ) : (
        <>
          <Link href={`/profile/${handle}`} className="landing-btn landing-btn-secondary profile-auth-map-pill">
            Public profile
          </Link>
          <button
            type="button"
            onClick={onMessage}
            disabled={messaging}
            className="landing-btn landing-btn-secondary profile-auth-map-pill"
          >
            {messaging ? 'Opening…' : 'Message'}
          </button>
        </>
      )}
    </div>
  );
}

function ProfileMapIdentity({
  personalName,
  displayName,
  handle,
  locationLabel,
  identityVerified,
  vouchCount = 0,
}: {
  personalName: string;
  displayName: string;
  handle: string;
  locationLabel?: string;
  identityVerified?: boolean;
  vouchCount?: number;
}) {
  const resolvedName =
    personalName.trim() ||
    (displayName.trim().toLowerCase() !== handle &&
    displayName.trim().toLowerCase() !== `@${handle}`
      ? displayName.trim()
      : '');

  const hasFullName = resolvedName.length > 0;
  const [emphasisHandle, setEmphasisHandle] = useState(false);

  const primaryLabel = emphasisHandle || !hasFullName ? `@${handle}` : resolvedName;
  const secondaryLabel = hasFullName ? (emphasisHandle ? resolvedName : `@${handle}`) : null;

  const identityHeading = hasFullName ? (
    <button
      type="button"
      onClick={() => setEmphasisHandle((value) => !value)}
      className="profile-auth-map-foot__name-toggle"
      aria-expanded={emphasisHandle}
      aria-label={emphasisHandle ? 'Show full name' : 'Show username'}
    >
      <span className="profile-auth-map-foot__name landing-headline landing-headline--white !text-[1.35rem] !leading-tight">
        {primaryLabel}
      </span>
      <span className="material-symbols-outlined text-[20px] opacity-70" aria-hidden>
        {emphasisHandle ? 'expand_less' : 'expand_more'}
      </span>
    </button>
  ) : (
    <h1 className="profile-auth-map-foot__name landing-headline landing-headline--white !text-[1.35rem] !leading-tight">
      @{handle}
    </h1>
  );

  return (
    <div className="profile-auth-map-foot__identity">
      {identityHeading}
      {secondaryLabel ? (
        <p className="profile-auth-map-foot__handle">{secondaryLabel}</p>
      ) : null}
      {locationLabel && (
        <p className="profile-auth-map-foot__location">
          <span className="material-symbols-outlined text-[14px]">location_on</span>
          {locationLabel}
        </p>
      )}
      {(identityVerified || vouchCount > 0) && (
        <div className="profile-auth-map-foot__badges">
          {identityVerified && (
            <span className="profile-auth-map-badge">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              Verified
            </span>
          )}
          {vouchCount > 0 && (
            <span className="profile-auth-map-badge profile-auth-map-badge--accent">🤜 {vouchCount}</span>
          )}
        </div>
      )}
    </div>
  );
}

function MapChrome({
  isOwnProfile,
  onShare,
  onSetLocation,
  onChangePhoto,
  settingLocation,
  savingMapLocation,
  uploading,
}: {
  isOwnProfile: boolean;
  onShare: () => void;
  onSetLocation?: () => void;
  onChangePhoto?: () => void;
  settingLocation?: boolean;
  savingMapLocation?: boolean;
  uploading?: boolean;
}) {
  return (
    <div className="auth-map-chrome">
      <button type="button" onClick={onShare} className="auth-map-chrome__share">
        <span className="material-symbols-outlined auth-map-chrome__glyph">share</span>
        Share
      </button>
      {isOwnProfile && (
        <div className="auth-map-chrome__group">
          {onSetLocation && (
            <button
              type="button"
              onClick={onSetLocation}
              disabled={settingLocation || savingMapLocation}
              className="auth-map-chrome__icon-btn"
              aria-label="Set location"
            >
              <span className="material-symbols-outlined auth-map-chrome__glyph">
                {settingLocation || savingMapLocation ? 'hourglass_top' : 'my_location'}
              </span>
            </button>
          )}
          {onChangePhoto && (
            <button
              type="button"
              onClick={onChangePhoto}
              disabled={uploading}
              className="auth-map-chrome__icon-btn"
              aria-label="Change profile photo"
            >
              <span className="material-symbols-outlined auth-map-chrome__glyph">
                {uploading ? 'hourglass_top' : 'photo_camera'}
              </span>
            </button>
          )}
          <Link href="/settings" className="auth-map-chrome__icon-btn" aria-label="Settings">
            <span className="material-symbols-outlined auth-map-chrome__glyph">settings</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export function ProfileSnapHero({
  displayName,
  personalName,
  username,
  avatarUrl,
  isOwnProfile,
  uploading,
  hasMapLocation,
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
}: ProfileSnapHeroProps) {
  const handle = username.trim().toLowerCase();
  const initial = displayName[0]?.toUpperCase() || handle[0]?.toUpperCase() || 'N';
  const resolved = resolveUserAvatarUrl({ profilePicture: avatarUrl, avatarUrl });
  const center = mapCenter ?? PROFILE_MAP_DEFAULT;

  return (
    <section className="profile-auth-hero">
      <div className="profile-auth-map-stage">
        <div className="auth-signup-map-layer profile-auth-map-layer">
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
                className="brand-mark-hero drop-shadow-2xl"
              />
            }
          />
        </div>
        <div className="auth-signup-map-scrim profile-auth-map-scrim" aria-hidden />

        <MapChrome
          isOwnProfile={isOwnProfile}
          onShare={onShare}
          onSetLocation={onSetLocation}
          onChangePhoto={onChangePhoto}
          settingLocation={settingLocation}
          savingMapLocation={savingMapLocation}
          uploading={uploading}
        />

        <div className="profile-auth-map-foot">
          <ProfileMapIdentity
            personalName={personalName}
            displayName={displayName}
            handle={handle}
            locationLabel={locationLabel}
            identityVerified={identityVerified}
            vouchCount={vouchCount}
          />
          <ProfileMapPills
            isOwnProfile={isOwnProfile}
            handle={handle}
            onShare={onShare}
            onMessage={onMessage}
            messaging={messaging}
          />
        </div>

        {uploading && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/25">
            <span className="rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-[#1A1A1A] shadow-lg">
              Uploading photo…
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
