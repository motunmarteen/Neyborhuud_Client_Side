/**
 * "Welcome done": set when the map tour finishes (or is skipped), or on a first visit to the
 * Feed. The check-in, notification and install prompts wait for it.
 */
export const PRODUCT_TOUR_COMPLETE_KEY = 'neyborhuud_product_tour_complete';

/** Fired when signup / welcome milestones finish — prompts can start their timers. */
export const SETUP_MILESTONE_EVENT = 'neyborhuud:setup-milestone';

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
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SETUP_MILESTONE_EVENT));
    }
}

/** Celebration screen after community + GPS setup. */
export function getPostSetupRoute(): '/setup-complete' {
    return '/setup-complete';
}

/** Home is the map, My Huud (owner 2026-10-18). */
export function getAppEntryRoute(): '/huud' {
    return '/huud';
}
