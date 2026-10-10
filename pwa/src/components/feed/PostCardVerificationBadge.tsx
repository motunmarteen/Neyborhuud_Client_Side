import type { PostAuthor } from '@/types/api';
import { CheckCircle2 } from 'lucide-react';
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
    <span title={tooltip} aria-label={tooltip} className="inline-flex">
      <CheckCircle2
        size={16}
        className={`post-card-verification-badge fill-[#00B82E] text-black ${meta.colorClass}`}
        style={{ color: meta.color || '#00B82E' }}
      />
    </span>
  );

  if (withAvatarBackground) {
    const sizeClass = avatarBadgeSize === 'sm' ? 'h-[17px] w-[17px]' : 'h-[20px] w-[20px]';
    return (
      <div className={`post-card-avatar-badge absolute -bottom-1 -right-1 z-10 flex ${sizeClass} items-center justify-center rounded-full bg-white dark:bg-[#1D2433] border-[1.5px] border-white dark:border-[#1D2433] shadow-sm select-none pointer-events-none`}>
        {badge}
      </div>
    );
  }

  return badge;
}
