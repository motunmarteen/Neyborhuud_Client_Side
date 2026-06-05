'use client';

import { createPortal } from 'react-dom';
import { useRef, useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { BottomSheetDragHandle } from '@/components/ui/BottomSheetDragHandle';
import { useBottomSheetDrag } from '@/hooks/useBottomSheetDrag';
import { useBottomSheetMount } from '@/hooks/useBottomSheetMount';

export type BottomSheetOverlayProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
  zIndexClass?: string;
  alignClass?: string;
  backdropClassName?: string;
  panelClassName?: string;
  panelStyle?: CSSProperties;
  hiddenOffset?: number;
  showHandle?: boolean;
  handleClassName?: string;
  closeOnBackdrop?: boolean;
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function BottomSheetOverlay({
  open,
  onClose,
  ariaLabel,
  children,
  zIndexClass = 'z-[200]',
  alignClass = 'items-end justify-center',
  backdropClassName = 'bg-black/50 backdrop-blur-[2px]',
  panelClassName = '',
  panelStyle,
  hiddenOffset = 480,
  showHandle = true,
  handleClassName,
  closeOnBackdrop = true,
}: BottomSheetOverlayProps) {
  const { mounted, visible } = useBottomSheetMount({ open, onClose });
  const { handleProps, getPanelStyle } = useBottomSheetDrag({ onDismiss: onClose });
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save previously focused element and restore on close
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open]);

  // Focus first focusable element when sheet opens
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const first = panelRef.current.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
  }, [open]);

  // Escape key to dismiss + focus trap
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => !el.closest('[aria-hidden="true"]'));

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClass} flex ${alignClass}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={`absolute inset-0 border-0 transition-opacity duration-200 ${backdropClassName} ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Close"
        tabIndex={-1}
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <section
        ref={panelRef}
        className={`relative z-[1] ${panelClassName}`.trim()}
        style={{
          ...getPanelStyle(visible, hiddenOffset),
          ...panelStyle,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {showHandle ? <BottomSheetDragHandle handleProps={handleProps} className={handleClassName} /> : null}
        {children}
      </section>
    </div>,
    document.body,
  );
}
