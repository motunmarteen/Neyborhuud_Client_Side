import type { User } from '@/types/api';

export type SafetyEligibilityIssue = {
  id: 'verify' | 'profile';
  message: string;
  href: string;
  actionLabel: string;
};

/** Only a sign-in is needed to start emergency tracking (server rule since 2026-11-28). */
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

  // Emergency tracking is never locked behind email or profile (owner rule: safety is never
  // gated). The server dropped that requirement on 2026-11-28; a signed-in person can always start.
  return [];
}

export function canStartLiveTracking(user: User | null | undefined): boolean {
  return getLiveTrackingBlockers(user).length === 0;
}
