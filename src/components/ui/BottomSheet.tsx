'use client';

import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { useCallback, useEffect } from 'react';

interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    snapPoints?: number[];
}

export function BottomSheet({
    open,
    onClose,
    children,
    title,
    snapPoints = [0.55, 0.92],
}: BottomSheetProps) {
    const dragControls = useDragControls();
    const maxHeight = `${Math.round(snapPoints[snapPoints.length - 1] * 100)}vh`;

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const handleDragEnd = useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (info.offset.y > 120 || info.velocity.y > 500) {
                onClose();
            }
        },
        [onClose]
    );

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close sheet"
                        className="fixed inset-0 z-[200] bg-brand-black/40 backdrop-blur-sm border-0 cursor-default"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        drag="y"
                        dragControls={dragControls}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0.05, bottom: 0.35 }}
                        onDragEnd={handleDragEnd}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="fixed bottom-0 left-0 right-0 z-[201] mx-auto max-w-lg rounded-t-3xl border border-white/20 bg-white/90 shadow-[0_-12px_48px_rgba(0,0,0,0.18)] backdrop-blur-2xl dark:bg-[rgba(12,18,24,0.92)]"
                        style={{ maxHeight }}
                    >
                        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                            <div className="h-1 w-10 rounded-full bg-brand-black/15" />
                        </div>
                        {title && (
                            <h2 className="px-5 pb-3 text-lg font-semibold text-brand-black">{title}</h2>
                        )}
                        <div className="overflow-y-auto px-5 pb-8 safe-area-bottom" style={{ maxHeight: `calc(${maxHeight} - 4rem)` }}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
