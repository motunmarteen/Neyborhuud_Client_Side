import {
  getNeedsCommunitySelection,
  getNeedsGpsLocationVerification,
} from '@/lib/communityContext';
import { hasCompletedProductTour } from '@/lib/onboarding';

/** Routes where post-login prompts (check-in, push) must not appear. */
export const ONBOARDING_EXCLUDED_ROUTES = [
  '/',
  '/app-root',
  '/welcome',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/setup-complete',
  '/pick-community',
  '/verify-location',
  '/complete-profile',
  '/info/community-rules',
  '/info/terms-of-service',
  '/info/privacy-policy',
] as const;

export function isOnboardingOrAuthRoute(pathname: string): boolean {
  return ONBOARDING_EXCLUDED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** True while signup / community / GPS / first-feed welcome is still unfinished. */
export function isAccountSetupIncomplete(): boolean {
  if (typeof window === 'undefined') return true;
  if (getNeedsCommunitySelection()) return true;
  if (getNeedsGpsLocationVerification()) return true;
  if (!hasCompletedProductTour()) return true;
  return false;
}
