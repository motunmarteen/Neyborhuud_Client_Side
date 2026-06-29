'use client';

import { useRef, useCallback } from 'react';
import type { FeedTab } from '@/types/api';

const TAB_ORDER: FeedTab[] = ['your_huud', 'street_radar', 'following_places'];
const SWIPE_THRESHOLD = 56;

export function useFeedTabSwipe(activeTab: FeedTab, onTabChange: (tab: FeedTab) => void) {
    const startX = useRef(0);
    const startY = useRef(0);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
    }, []);

    const onTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            const dx = e.changedTouches[0].clientX - startX.current;
            const dy = e.changedTouches[0].clientY - startY.current;
            if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

            const idx = TAB_ORDER.indexOf(activeTab);
            if (idx < 0) return;

            if (dx < 0 && idx < TAB_ORDER.length - 1) {
                onTabChange(TAB_ORDER[idx + 1]);
            } else if (dx > 0 && idx > 0) {
                onTabChange(TAB_ORDER[idx - 1]);
            }
        },
        [activeTab, onTabChange]
    );

    return { onTouchStart, onTouchEnd };
}
