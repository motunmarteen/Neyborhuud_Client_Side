'use client';

import type { CSSProperties, ReactNode } from 'react';
import { BottomSheetOverlay } from '@/components/ui/BottomSheetOverlay';

export type AppBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
  /** Extra classes on the panel (width, colors, etc.). */
  panelClassName?: string;
  panelStyle?: CSSProperties;
  zIndexClass?: string;
  hiddenOffset?: number;
};

export function AppBottomSheet({
  open,
  onClose,
  ariaLabel,
  children,
  panelClassName = '',
  panelStyle,
  zIndexClass = 'z-[200]',
  hiddenOffset = 480,
}: AppBottomSheetProps) {
  return (
    <BottomSheetOverlay
      open={open}
      onClose={onClose}
      ariaLabel={ariaLabel}
      zIndexClass={zIndexClass}
      hiddenOffset={hiddenOffset}
      panelClassName={`flex w-full flex-col overflow-hidden rounded-t-[1.25rem] border border-[var(--neu-shadow-dark)] bg-[var(--neu-bg)] shadow-[0_-12px_40px_rgba(0,0,0,0.18)] ${panelClassName}`.trim()}
      panelStyle={panelStyle}
    >
      {children}
    </BottomSheetOverlay>
  );
}
