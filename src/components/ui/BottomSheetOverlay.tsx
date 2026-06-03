'use client';

import { createPortal } from 'react-dom';
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
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <section
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
