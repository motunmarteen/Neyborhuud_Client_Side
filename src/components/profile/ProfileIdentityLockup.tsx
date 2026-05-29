'use client';

import { BrandPinAvatar } from '@/components/brand/BrandPinAvatar';
import { resolveProfileDisplayName, resolveProfilePersonalName } from '@/lib/profileSnapHelpers';
import {
  resolveProfileAvatarInitial,
  resolveUserAvatarUrl,
  type ProfileAvatarSource,
} from '@/lib/userAvatar';

type ProfileIdentityLockupProps = {
  avatarUrl?: string | null;
  profilePicture?: string | null;
  username: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: 'hero' | 'lg' | 'marker';
  editable?: boolean;
  onAvatarClick?: () => void;
  uploading?: boolean;
  /** When false, only render @username wordmark (pin lives elsewhere, e.g. on map). */
  showPin?: boolean;
};

/**
 * Landing / sidebar stacked lockup — brand pin + @username wordmark.
 * Used on profile hero (and can mirror sidebar identity).
 */
export function ProfileIdentityLockup({
  avatarUrl,
  profilePicture,
  username,
  displayName,
  firstName,
  lastName,
  size = 'hero',
  editable = false,
  onAvatarClick,
  uploading = false,
  showPin = true,
}: ProfileIdentityLockupProps) {
  const handle = username.trim().toLowerCase();
  const avatarSource: ProfileAvatarSource = {
    profilePicture,
    avatarUrl,
    username: handle,
    displayName,
    firstName,
    lastName,
  };
  const initial = resolveProfileAvatarInitial(avatarSource, handle);
  const resolvedAvatar = resolveUserAvatarUrl(avatarSource);
  const personalName = resolveProfilePersonalName(avatarSource, handle);
  const resolvedDisplayName = resolveProfileDisplayName(avatarSource, handle);
  const hasLegalName = Boolean(personalName) && resolvedDisplayName.toLowerCase() !== handle;

  if (!showPin) {
    return (
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="brand-name text-[#00D431] leading-[0.95] font-extrabold" style={{ fontSize: 22 }}>
          {resolvedDisplayName}
        </span>
        {hasLegalName ? (
          <span className="text-[12px] font-semibold text-white/70">@{handle}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="profile-identity-lockup flex flex-col items-center gap-1.5">
      <div className="relative flex flex-col items-center">
        <div className="landing-logo-halo pointer-events-none absolute -inset-10 -z-10" aria-hidden />
        <BrandPinAvatar
          src={resolvedAvatar}
          alt={resolvedDisplayName}
          fallbackInitial={initial}
          size={size}
          priority
          onClick={editable ? onAvatarClick : undefined}
          className={editable ? 'transition-transform hover:scale-[1.02] active:scale-[0.98]' : ''}
        />
        {editable && (
          <button
            type="button"
            onClick={onAvatarClick}
            className="profile-identity-lockup__camera absolute -right-1 bottom-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#006F35] text-white shadow-lg transition hover:bg-[#00D431]"
            aria-label="Upload profile photo"
          >
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
          </button>
        )}
        {uploading && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-live="polite"
            aria-busy="true"
          >
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#00D431] border-t-transparent bg-white/90 p-1 shadow-md" />
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span
          className={`brand-name leading-[0.95] font-extrabold ${size === 'hero' ? 'brand-name-hero text-[#00D431]' : 'text-[#00D431]'}`}
          style={{ fontSize: size === 'hero' ? 28 : 22 }}
        >
          {resolvedDisplayName}
        </span>
        {hasLegalName ? (
          <span className="text-[12px] font-semibold text-white/70">@{handle}</span>
        ) : null}
      </div>
    </div>
  );
}
