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
};

export function PostCardVerificationBadge({
  isVerified,
  author,
  verificationBadge: _verificationBadge,
  hidden = false,
}: PostCardVerificationBadgeProps) {
  if (hidden) return null;

  const input = author
    ? extractVerificationIdentityInput(author as Record<string, unknown>)
    : extractVerificationIdentityInput({ isVerified });

  const { tier, tooltip } = getVerificationProgress(input);
  if (!shouldShowVerificationBadge(tier)) return null;

  const meta = getVerificationTierMeta(tier);

  return (
    <span
      className={`material-symbols-outlined text-[14px] post-card-verification-badge ${meta.colorClass}`}
      style={{ color: meta.color }}
      aria-label={tooltip}
      title={tooltip}
    >
      verified
    </span>
  );
}
