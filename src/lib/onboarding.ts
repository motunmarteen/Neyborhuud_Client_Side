/** Post-signup product tour — shown once before first feed visit. */
export const PRODUCT_TOUR_COMPLETE_KEY = 'neyborhuud_product_tour_complete';

export function hasCompletedProductTour(): boolean {
    if (typeof window === 'undefined') return true;
    try {
        return localStorage.getItem(PRODUCT_TOUR_COMPLETE_KEY) === '1';
    } catch {
        return true;
    }
}

export function markProductTourComplete(): void {
    try {
        localStorage.setItem(PRODUCT_TOUR_COMPLETE_KEY, '1');
    } catch {
        // ignore storage failures
    }
}

/** After auth setup steps, route new users through the product tour once. */
export function getAppEntryRoute(): '/onboarding' | '/feed' {
    if (!hasCompletedProductTour()) return '/onboarding';
    return '/feed';
}
