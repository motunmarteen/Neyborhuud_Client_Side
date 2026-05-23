'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SignupBottomSheet } from '@/components/auth/SignupBottomSheet';

type AuthOverlaySheetProps = {
    open: boolean;
    ariaLabel: string;
    stageKey: string;
    onDismiss: () => void;
    peek?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
};

/**
 * Modal bottom sheet with auth signup drag physics — collapse to peek, expand back up.
 * Portals to document.body so fixed positioning is never broken by feed layout ancestors.
 */
export function AuthOverlaySheet({
    open,
    ariaLabel,
    stageKey,
    onDismiss,
    peek,
    footer,
    children,
}: AuthOverlaySheetProps) {
    const [mounted, setMounted] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) {
            setCollapsed(false);
            return;
        }

        if (collapsed) {
            document.body.style.overflow = '';
            return;
        }

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [open, collapsed]);

    if (!open || !mounted) return null;

    return createPortal(
        <div className="auth-overlay-sheet-host" role="presentation">
            <button
                type="button"
                className={[
                    'auth-overlay-sheet-host__backdrop',
                    collapsed ? 'auth-overlay-sheet-host__backdrop--collapsed' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
                aria-label="Dismiss"
                onClick={onDismiss}
            />

            <SignupBottomSheet
                overlay
                ariaLabel={ariaLabel}
                stageKey={stageKey}
                peek={peek}
                footer={footer}
                onCollapsedChange={setCollapsed}
            >
                {children}
            </SignupBottomSheet>
        </div>,
        document.body,
    );
}
