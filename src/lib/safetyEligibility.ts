import { isUserEmailVerified } from '@/lib/authSession';
import {
  getSafetyProfileGaps,
  resolveUserFirstName,
  resolveUserLastName,
  resolveUserPhone,
} from '@/lib/userProfileFields';
import type { User } from '@/types/api';

export type SafetyEligibilityIssue = {
  id: 'verify' | 'profile';
  message: string;
  href: string;
  actionLabel: string;
};

/** Mirrors backend `requireVerification` on POST /safety/kidnapping/sessions/start */
export function getLiveTrackingBlockers(user: User | null | undefined): SafetyEligibilityIssue[] {
  if (!user) {
    return [
      {
        id: 'verify',
        message: 'Sign in to start live tracking.',
        href: '/login',
        actionLabel: 'Sign in',
      },
    ];
  }

  const issues: SafetyEligibilityIssue[] = [];

  if (!isUserEmailVerified(user)) {
    issues.push({
      id: 'verify',
      message: 'Verify your email before starting live tracking (required by the server for high-risk safety features).',
      href: '/verify-email',
      actionLabel: 'Verify email',
    });
  }

  const gaps = getSafetyProfileGaps(user);
  if (gaps.length > 0) {
    const parts: string[] = [];
    if (gaps.includes('firstName') || gaps.includes('lastName')) {
      parts.push('legal first and last name');
    }
    if (gaps.includes('phone')) {
      parts.push('Nigerian phone number');
    }

    const missingLabel = parts.join(' and ');
    const hasName = resolveUserFirstName(user) && resolveUserLastName(user);
    const hasPhone = !!resolveUserPhone(user);

    let message =
      `Add your ${missingLabel} on your profile — the server blocks live tracking without them.`;
    if (hasName && !hasPhone) {
      message =
        'Your name is saved, but live tracking still needs a phone number on your main profile. Add or confirm your Nigerian phone below.';
    }

    issues.push({
      id: 'profile',
      message,
      href: gaps.includes('phone') && hasName ? '/complete-profile?focus=phone' : '/complete-profile',
      actionLabel: gaps.includes('phone') && !gaps.includes('firstName') ? 'Add phone number' : 'Complete profile',
    });
  }

  return issues;
}

export function canStartLiveTracking(user: User | null | undefined): boolean {
  return getLiveTrackingBlockers(user).length === 0;
}
