'use client';

import { motion, useDragControls, type PanInfo } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { resolveSignupSheetSnap, signupSheetTranslateY } from '@/lib/signupSheetSnap';

/** Visible strip when collapsed: handle + optional peek row */
const PEEK_HEIGHT = 108;

const SHEET_SPRING = {
    type: 'spring' as const,
    damping: 38,
    stiffness: 320,
    mass: 0.9,
};

type SignupBottomSheetProps = {
    ariaLabel: string;
    tall?: boolean;
    /** Changes reset the sheet to expanded and re-measure height. */
    stageKey: string;
    /** Shown in the always-visible peek area when collapsed (step 1 street name). */
    peek?: ReactNode;
    onCollapsedChange?: (collapsed: boolean) => void;
    children: ReactNode;
};

export function SignupBottomSheet({
    ariaLabel,
    tall,
    stageKey,
    peek,
    onCollapsedChange,
    children,
}: SignupBottomSheetProps) {
    const sheetRef = useRef<HTMLElement>(null);
    const dragControls = useDragControls();
    const dragMovedRef = useRef(false);
    const [collapsed, setCollapsed] = useState(false);
    const [collapseOffset, setCollapseOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const pointerStartYRef = useRef(0);

    const measureSheet = useCallback(() => {
        const el = sheetRef.current;
        if (!el) return;
        const height = el.getBoundingClientRect().height;
        setCollapseOffset(Math.max(0, Math.round(height - PEEK_HEIGHT)));
    }, []);

    const setCollapsedState = useCallback(
        (next: boolean) => {
            setCollapsed(next);
            onCollapsedChange?.(next);
        },
        [onCollapsedChange],
    );

    useEffect(() => {
        setCollapsedState(false);
    }, [stageKey, setCollapsedState]);

    useEffect(() => {
        const el = sheetRef.current;
        if (!el) return;

        measureSheet();
        const observer = new ResizeObserver(measureSheet);
        observer.observe(el);
        window.addEventListener('resize', measureSheet);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measureSheet);
        };
    }, [stageKey, children, peek, measureSheet]);

    const handleDragEnd = useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            setIsDragging(false);
            const next = resolveSignupSheetSnap({
                offsetY: info.offset.y,
                velocityY: info.velocity.y,
                collapseOffset,
                currentlyCollapsed: collapsed,
            });
            setCollapsedState(next === 'collapsed');
            dragMovedRef.current = false;
        },
        [collapseOffset, collapsed, setCollapsedState],
    );

    const handleHandlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
        if (dragMovedRef.current || collapseOffset <= 0) return;
        if (Math.abs(event.clientY - pointerStartYRef.current) < 8) {
            setCollapsedState(!collapsed);
        }
    };

    const snapY = signupSheetTranslateY(collapsed, collapseOffset);
    const canCollapse = collapseOffset > 0;

    return (
        <motion.section
            key={stageKey}
            ref={sheetRef}
            className={[
                'auth-signup-bottom-sheet',
                tall ? 'auth-signup-bottom-sheet--tall' : '',
                collapsed ? 'auth-signup-bottom-sheet--collapsed' : '',
                isDragging ? 'auth-signup-bottom-sheet--dragging' : '',
                peek ? 'auth-signup-bottom-sheet--with-peek' : '',
            ]
                .filter(Boolean)
                .join(' ')}
            aria-label={ariaLabel}
            aria-expanded={!collapsed}
            role="dialog"
            drag={canCollapse ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: Math.max(collapseOffset, 0) }}
            dragElastic={{ top: 0.04, bottom: 0.14 }}
            dragMomentum={false}
            onDragStart={() => {
                dragMovedRef.current = false;
                setIsDragging(true);
            }}
            onDrag={() => {
                dragMovedRef.current = true;
            }}
            onDragEnd={handleDragEnd}
            onAnimationComplete={measureSheet}
            initial={{ y: '100%' }}
            animate={{ y: snapY }}
            transition={SHEET_SPRING}
        >
            <div className="auth-signup-bottom-sheet__shine" aria-hidden />
            <button
                type="button"
                className="auth-signup-bottom-sheet__handle-zone"
                aria-label={collapsed ? 'Expand sheet' : 'Collapse sheet'}
                onPointerDown={(event) => {
                    if (!canCollapse) return;
                    pointerStartYRef.current = event.clientY;
                    dragControls.start(event);
                }}
                onPointerUp={handleHandlePointerUp}
            >
                <span className="auth-signup-bottom-sheet__handle" aria-hidden />
            </button>
            {peek ? <div className="auth-signup-bottom-sheet__peek">{peek}</div> : null}
            <div className="auth-signup-bottom-sheet__body">{children}</div>
        </motion.section>
    );
}
