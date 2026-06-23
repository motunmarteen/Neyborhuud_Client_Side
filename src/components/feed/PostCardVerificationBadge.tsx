import type { PostAuthor } from '@/types/api';
import {
  extractVerificationIdentityInput,
  getVerificationProgress,
  getVerificationTierMeta,
  shouldShowVerificationBadge,
  type VerificationIdentityInput,
} from '@/lib/verificationIdentity';

type PostCardVerificationBadgeProps = {
  isVerified?: boolean;
  author?: VerificationIdentityInput | PostAuthor | null;
  verificationBadge?: PostAuthor['verificationBadge'];
  hidden?: boolean;
  withAvatarBackground?: boolean;
  avatarBadgeSize?: 'sm' | 'md';
};

export function PostCardVerificationBadge({
  isVerified,
  author,
  verificationBadge: _verificationBadge,
  hidden = false,
  withAvatarBackground = false,
  avatarBadgeSize = 'md',
}: PostCardVerificationBadgeProps) {
  if (hidden) return null;

  const input = author
    ? extractVerificationIdentityInput(author as Record<string, unknown>)
    : extractVerificationIdentityInput({ isVerified });

  const { tier, tooltip } = getVerificationProgress(input);
  if (!shouldShowVerificationBadge(tier)) return null;

  const meta = getVerificationTierMeta(tier);

  const badge = (
    <span
      className={`material-symbols-outlined text-[12px] post-card-verification-badge ${meta.colorClass}`}
      style={{ color: meta.color }}
      aria-label={tooltip}
      title={tooltip}
    >
      verified
    </span>
  );

  if (withAvatarBackground) {
    const sizeClass = avatarBadgeSize === 'sm' ? 'h-[17px] w-[17px]' : 'h-[20px] w-[20px]';
    return (
      <div className={`post-card-avatar-badge absolute -bottom-1 -right-1 z-10 flex ${sizeClass} items-center justify-center rounded-full bg-white dark:bg-[#121b14] border-[1.5px] border-white dark:border-[#121b14] shadow-sm select-none pointer-events-none`}>
        {badge}
      </div>
    );
  }

  return badge;
}
