'use client';

import { BrandPinAvatar } from '@/components/brand/BrandPinAvatar';
import { resolveUserAvatarUrl } from '@/lib/userAvatar';

type ProfileIdentityLockupProps = {
  avatarUrl?: string | null;
  username: string;
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
  username,
  size = 'hero',
  editable = false,
  onAvatarClick,
  uploading = false,
  showPin = true,
}: ProfileIdentityLockupProps) {
  const handle = username.trim().toLowerCase();
  const initial = handle.replace(/^@/, '').charAt(0).toUpperCase() || 'N';
  const resolvedAvatar = resolveUserAvatarUrl({
    profilePicture: avatarUrl,
    avatarUrl,
  });

  if (!showPin) {
    return (
      <span className="brand-wordmark text-[#00D431] leading-[0.95]" style={{ fontSize: 22 }}>
        @{handle}
      </span>
    );
  }

  return (
    <div className="profile-identity-lockup flex flex-col items-center gap-1.5">
      <div className="relative flex flex-col items-center">
        <div className="landing-logo-halo pointer-events-none absolute -inset-10 -z-10" aria-hidden />
        <BrandPinAvatar
          src={resolvedAvatar}
          alt={`@${handle}`}
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
      <span
        className={`brand-wordmark leading-[0.95] ${size === 'hero' ? 'brand-wordmark-hero text-[#00D431]' : 'text-[#00D431]'}`}
        style={{ fontSize: size === 'hero' ? 28 : 22 }}
      >
        @{handle}
      </span>
    </div>
  );
}
