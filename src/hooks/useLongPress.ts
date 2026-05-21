'use client';

import { useCallback, useRef } from 'react';

const DEFAULT_MS = 500;

export function useLongPress(onLongPress: () => void, ms = DEFAULT_MS) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fired = useRef(false);

    const start = useCallback(() => {
        fired.current = false;
        timer.current = setTimeout(() => {
            fired.current = true;
            onLongPress();
        }, ms);
    }, [onLongPress, ms]);

    const cancel = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
    }, []);

    const handlers = {
        onPointerDown: (e: React.PointerEvent) => {
            if (e.button !== 0) return;
            start();
        },
        onPointerUp: cancel,
        onPointerLeave: cancel,
        onPointerCancel: cancel,
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        /** Call from click handler to suppress navigation after long-press fired */
        didLongPress: () => fired.current,
        resetLongPress: () => {
            fired.current = false;
        },
    };

    return handlers;
}
