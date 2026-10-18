import { getNeedsCommunitySelection } from '@/lib/communityContext';
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
  '/auth-callback',
  '/setup-complete',
  '/pick-community',
  '/verify-location',
  '/complete-profile',
  '/info/community-rules',
  '/info/terms-of-service',
  '/info/privacy-policy',
  // Public design reference (Phase 2 building blocks).
  '/design-kit',
] as const;

export function isOnboardingOrAuthRoute(pathname: string): boolean {
  return ONBOARDING_EXCLUDED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** True while the home area or the first welcome is still unfinished (the location check is optional). */
export function isAccountSetupIncomplete(): boolean {
  if (typeof window === 'undefined') return true;
  if (getNeedsCommunitySelection()) return true;
  if (!hasCompletedProductTour()) return true;
  return false;
}
