'use client';

import {
    animate,
    motion,
    useDragControls,
    useMotionValue,
    type PanInfo,
} from 'framer-motion';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type PointerEvent,
    type ReactNode,
} from 'react';
import { resolveSignupSheetSnap, signupSheetTranslateY } from '@/lib/signupSheetSnap';

const SHEET_SPRING = {
    type: 'spring' as const,
    damping: 44,
    stiffness: 360,
    mass: 0.8,
};

type SignupBottomSheetProps = {
    ariaLabel: string;
    /** @deprecated Height is content-driven; kept for API compatibility. */
    tall?: boolean;
    /** Changes reset the sheet to expanded and re-measure height. */
    stageKey: string;
    /** Shown in the always-visible peek area when collapsed. */
    peek?: ReactNode;
    /** Sticky footer (CTAs) kept above the keyboard on mobile. */
    footer?: ReactNode;
    /** Adjust available height when the on-screen keyboard opens. */
    keyboardAware?: boolean;
    /** Pin to viewport bottom (feed overlays) instead of auth-page flex layout. */
    overlay?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
    children: ReactNode;
};

export function SignupBottomSheet({
    ariaLabel,
    stageKey,
    peek,
    footer,
    keyboardAware = false,
    overlay = false,
    onCollapsedChange,
    children,
}: SignupBottomSheetProps) {
    const sheetRef = useRef<HTMLElement>(null);
    const peekZoneRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();
    const dragMovedRef = useRef(false);
    const isDraggingRef = useRef(false);
    const measureRafRef = useRef<number | null>(null);
    const skipSnapRef = useRef(true);

    const y = useMotionValue(0);
    const [collapsed, setCollapsed] = useState(false);
    const [collapseOffset, setCollapseOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [keyboardInset, setKeyboardInset] = useState(0);
    const pointerStartYRef = useRef(0);

    const measureSheet = useCallback(() => {
        const el = sheetRef.current;
        const peekEl = peekZoneRef.current;
        if (!el) return;

        const height = el.getBoundingClientRect().height;
        let peekHeight = peekEl?.getBoundingClientRect().height ?? 108;
        if (peekHeight >= height - 12) {
            peekHeight = Math.min(108, Math.max(72, height * 0.34));
        }
        const nextOffset = Math.max(0, Math.round(height - peekHeight));
        setCollapseOffset((prev) => (prev === nextOffset ? prev : nextOffset));
    }, []);

    const scheduleMeasure = useCallback(() => {
        if (measureRafRef.current !== null) {
            cancelAnimationFrame(measureRafRef.current);
        }
        measureRafRef.current = requestAnimationFrame(() => {
            measureRafRef.current = null;
            if (isDraggingRef.current) return;
            measureSheet();
        });
    }, [measureSheet]);

    const setCollapsedState = useCallback(
        (next: boolean) => {
            setCollapsed(next);
            onCollapsedChange?.(next);
        },
        [onCollapsedChange],
    );

    const snapTo = useCallback(
        (nextCollapsed: boolean, nextOffset = collapseOffset) => {
            if (isDraggingRef.current || skipSnapRef.current) return;
            animate(y, signupSheetTranslateY(nextCollapsed, nextOffset), SHEET_SPRING);
        },
        [collapseOffset, y],
    );

    useEffect(() => {
        skipSnapRef.current = true;
        setCollapsedState(false);

        let entryAnimation: ReturnType<typeof animate> | null = null;

        const startEntry = () => {
            const sheetHeight = sheetRef.current?.getBoundingClientRect().height ?? 0;
            const entryY = overlay
                ? Math.max(sheetHeight, 280)
                : typeof window !== 'undefined'
                  ? window.innerHeight
                  : 480;
            y.set(entryY);
            entryAnimation?.stop();
            entryAnimation = animate(y, 0, {
                ...SHEET_SPRING,
                onComplete: () => {
                    skipSnapRef.current = false;
                    scheduleMeasure();
                },
            });
        };

        startEntry();
        const remeasureRaf = overlay ? requestAnimationFrame(startEntry) : null;

        return () => {
            if (remeasureRaf !== null) cancelAnimationFrame(remeasureRaf);
            entryAnimation?.stop();
        };
    }, [stageKey, overlay, setCollapsedState, y, scheduleMeasure]);

    useEffect(() => {
        snapTo(collapsed);
    }, [collapsed, collapseOffset, snapTo]);

    useLayoutEffect(() => {
        measureSheet();
    }, [stageKey, measureSheet]);

    useEffect(() => {
        const el = sheetRef.current;
        const bodyEl = bodyRef.current;
        if (!el) return;

        scheduleMeasure();
        const observer = new ResizeObserver(scheduleMeasure);
        observer.observe(el);
        if (peekZoneRef.current) observer.observe(peekZoneRef.current);
        if (bodyEl) observer.observe(bodyEl);
        window.addEventListener('resize', scheduleMeasure);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', scheduleMeasure);
            if (measureRafRef.current !== null) {
                cancelAnimationFrame(measureRafRef.current);
            }
        };
    }, [stageKey, scheduleMeasure]);

    useEffect(() => {
        if (!overlay || typeof window === 'undefined') return;

        const viewport = window.visualViewport;
        const onViewportChange = () => scheduleMeasure();
        viewport?.addEventListener('resize', onViewportChange);
        viewport?.addEventListener('scroll', onViewportChange);
        window.addEventListener('resize', onViewportChange);

        return () => {
            viewport?.removeEventListener('resize', onViewportChange);
            viewport?.removeEventListener('scroll', onViewportChange);
            window.removeEventListener('resize', onViewportChange);
        };
    }, [overlay, stageKey, scheduleMeasure]);

    useEffect(() => {
        if (!keyboardAware || typeof window === 'undefined') return;

        const viewport = window.visualViewport;
        if (!viewport) return;

        const syncKeyboardInset = () => {
            const inset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
            setKeyboardInset((prev) => (prev === inset ? prev : inset));
            scheduleMeasure();
        };

        syncKeyboardInset();
        viewport.addEventListener('resize', syncKeyboardInset);
        viewport.addEventListener('scroll', syncKeyboardInset);

        return () => {
            viewport.removeEventListener('resize', syncKeyboardInset);
            viewport.removeEventListener('scroll', syncKeyboardInset);
        };
    }, [keyboardAware, stageKey, scheduleMeasure]);

    const handleDragEnd = useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            isDraggingRef.current = false;
            setIsDragging(false);

            const next = resolveSignupSheetSnap({
                offsetY: info.offset.y,
                velocityY: info.velocity.y,
                collapseOffset,
                currentlyCollapsed: collapsed,
            });
            const nextCollapsed = next === 'collapsed';
            setCollapsedState(nextCollapsed);
            animate(y, signupSheetTranslateY(nextCollapsed, collapseOffset), SHEET_SPRING);
            dragMovedRef.current = false;
        },
        [collapseOffset, collapsed, setCollapsedState, y],
    );

    const handleHandlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
        if (collapseOffset <= 0) return;

        const movedPx = Math.abs(event.clientY - pointerStartYRef.current);
        if (movedPx < 8 && !dragMovedRef.current) {
            const nextCollapsed = !collapsed;
            setCollapsedState(nextCollapsed);
            animate(y, signupSheetTranslateY(nextCollapsed, collapseOffset), SHEET_SPRING);
        }

        dragMovedRef.current = false;
    };

    const canCollapse = collapseOffset > 0;

    return (
        <motion.section
            key={stageKey}
            ref={sheetRef}
            className={[
                'auth-signup-bottom-sheet',
                overlay ? 'auth-signup-bottom-sheet--overlay' : '',
                collapsed ? 'auth-signup-bottom-sheet--collapsed' : '',
                isDragging ? 'auth-signup-bottom-sheet--dragging' : '',
                peek ? 'auth-signup-bottom-sheet--with-peek' : '',
                footer ? 'auth-signup-bottom-sheet--with-footer' : '',
                keyboardAware && keyboardInset > 0 ? 'auth-signup-bottom-sheet--keyboard-open' : '',
            ]
                .filter(Boolean)
                .join(' ')}
            aria-label={ariaLabel}
            aria-expanded={!collapsed}
            role="dialog"
            style={{
                y,
                ['--signup-keyboard-inset' as string]: `${keyboardInset}px`,
            }}
            drag={canCollapse ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: Math.max(collapseOffset, 0) }}
            dragElastic={{ top: 0.04, bottom: 0.1 }}
            dragMomentum={false}
            onDragStart={() => {
                dragMovedRef.current = false;
                isDraggingRef.current = true;
                setIsDragging(true);
            }}
            onDrag={() => {
                dragMovedRef.current = true;
            }}
            onDragEnd={handleDragEnd}
        >
            <div className="auth-signup-bottom-sheet__shine" aria-hidden />
            <div ref={peekZoneRef} className="auth-signup-bottom-sheet__peek-zone">
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
            </div>
            <div ref={bodyRef} className="auth-signup-bottom-sheet__body">
                {children}
            </div>
            {footer ? <div className="auth-signup-bottom-sheet__footer">{footer}</div> : null}
        </motion.section>
    );
}
