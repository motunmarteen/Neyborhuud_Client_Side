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
  identityVerified?: boolean;
  /** Grey badge while verification journey is underway */
  verificationInProgress?: boolean;
  verificationTierLabel?: string;
  vouchReceived?: number;
  vouchGiven?: number;
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
  identityVerified,
  verificationInProgress = false,
  verificationTierLabel,
  vouchReceived = 0,
  vouchGiven = 0,
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
    <div className="w-full bg-white">
      <div className="relative h-[110px] w-full overflow-hidden sm:h-[120px]">
        <MiniMap
          center={center}
          height="100%"
          className="absolute inset-0 h-full w-full !rounded-none"
          draggable={false}
          showDragHint={false}
          showNavigationControl={false}
          showAttribution={false}
          showMarker={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute right-4 top-4 flex gap-1.5">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm px-3 text-xs font-bold text-slate-800 shadow-sm border border-slate-100 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            Share
          </button>
        </div>
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="mod-chip rounded-full px-3 py-1 text-xs font-semibold">Uploading…</span>
          </div>
        ) : null}
      </div>

      <div className="relative px-6 pb-4">
        <div className="-mt-12 mb-3">
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
          {verificationTierLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              {verificationTierLabel}
            </span>
          ) : identityVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Verified
            </span>
          ) : verificationInProgress ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200/50 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-500">
              <span className="material-symbols-outlined text-[12px]">pending</span>
              Verifying
            </span>
          ) : null}
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-600 ${
              vouchReceived > 0 ? '' : 'opacity-65'
            }`}
            aria-label={`Vouches received: ${vouchReceived}`}
          >
            🤜 {vouchReceived} received
          </span>
          {isOwnProfile ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-600 ${
                vouchGiven > 0 ? '' : 'opacity-65'
              }`}
              aria-label={`Vouches given: ${vouchGiven}`}
            >
              🤝 {vouchGiven} given
            </span>
          ) : null}
        </div>

        {!isOwnProfile ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onMessage}
              disabled={messaging}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 px-5 py-2 text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              {messaging ? 'Opening…' : 'Message'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
