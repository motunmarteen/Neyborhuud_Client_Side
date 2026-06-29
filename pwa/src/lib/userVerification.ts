/**
 * @deprecated Prefer `@/lib/verificationIdentity` for tier-based verification.
 * Legacy helpers kept for backward compatibility during migration.
 */

import {
  extractVerificationIdentityInput,
  getVerificationTier,
  getVerificationProgress,
  getVerificationTierMeta,
  type VerificationIdentityInput,
  type VerificationTier,
} from '@/lib/verificationIdentity';

export type { VerificationIdentityInput, VerificationTier };

export {
  VERIFICATION_TIER_META,
  VERIFICATION_TIER_ORDER,
  extractVerificationIdentityInput,
  getVerificationTier,
  getVerificationProgress,
  getVerificationTierMeta,
  isEmailVerified,
  isSilverProfileReady,
  shouldShowVerificationBadge,
} from '@/lib/verificationIdentity';

/** @deprecated Use VerificationIdentityInput */
export type UserVerificationInput = VerificationIdentityInput;

/** @deprecated Use extractVerificationIdentityInput */
export function extractUserVerificationInput(
  source: Record<string, unknown> | null | undefined,
): VerificationIdentityInput {
  return extractVerificationIdentityInput(source);
}

/** Gold tier or above — community-trusted neighbour */
export function isCommunityVerified(input: VerificationIdentityInput): boolean {
  const tier = getVerificationTier(input);
  return ['gold', 'diamond', 'platinum'].includes(tier);
}

export type VerificationDisplayStatus = 'none' | 'progress' | 'verified';

/** Maps metal tiers to legacy 3-state display */
export function getVerificationDisplayStatus(
  input: VerificationIdentityInput,
): VerificationDisplayStatus {
  const tier = getVerificationTier(input);
  if (['gold', 'diamond', 'platinum'].includes(tier)) return 'verified';
  if (['bronze', 'silver'].includes(tier)) return 'progress';
  return 'none';
}

export function getVerificationTooltip(input: VerificationIdentityInput): string {
  return getVerificationProgress(input).tooltip;
}

// Legacy constants — re-export from verificationIdentity thresholds
export { TRUST_TIERS } from '@/lib/trust-economy';
