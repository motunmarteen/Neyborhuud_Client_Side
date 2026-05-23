/** First-feed welcome — replaces the old full-page product tour. */
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

/** New users always enter the feed — welcome tips show inline on first visit. */
export function getAppEntryRoute(): '/feed' {
    return '/feed';
}
