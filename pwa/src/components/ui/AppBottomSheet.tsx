'use client';

import type { CSSProperties, ReactNode } from 'react';
import { X } from 'lucide-react';
import { BottomSheetOverlay } from '@/components/ui/BottomSheetOverlay';

/**
 * Design foundation F-05: the standard bottom sheet (slide-up panel).
 *
 * - White panel, 24px top corners, drag handle; drag down, flick, tap the handle,
 *   tap outside or press Escape to close
 * - Optional title (+ description) with a close button, and a footer that stays
 *   visible while the body scrolls (put the main action there)
 * - Never taller than 90% of the screen; keeps clear of the iPhone home bar
 * - Fades instead of sliding when the phone asks for reduced motion
 *
 * New sheets should use this. Existing custom sheets move to it screen by screen.
 */

/** Panel classes for sheets that use BottomSheetOverlay directly but want the standard look. */
export const SHEET_PANEL_CLASS =
  'mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-t-[24px] bg-white text-navy ' +
  'shadow-[0_-12px_40px_rgba(29,36,51,0.18)]';

export type AppBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Screen-reader name for the sheet; defaults to the title. */
  ariaLabel?: string;
  title?: string;
  description?: string;
  /** Show an X button next to the title (default true when there is a title). */
  showClose?: boolean;
  /** Pinned under the scrolling body, e.g. the main action button. */
  footer?: ReactNode;
  children: ReactNode;
  /** Extra classes on the panel (width, etc.). */
  panelClassName?: string;
  panelStyle?: CSSProperties;
  zIndexClass?: string;
  hiddenOffset?: number;
};

export function AppBottomSheet({
  open,
  onClose,
  ariaLabel,
  title,
  description,
  showClose,
  footer,
  children,
  panelClassName = '',
  panelStyle,
  zIndexClass = 'z-[200]',
  hiddenOffset = 480,
}: AppBottomSheetProps) {
  const withClose = showClose ?? Boolean(title);

  return (
    <BottomSheetOverlay
      open={open}
      onClose={onClose}
      ariaLabel={ariaLabel ?? title ?? 'Sheet'}
      zIndexClass={zIndexClass}
      hiddenOffset={hiddenOffset}
      panelClassName={`${SHEET_PANEL_CLASS} ${panelClassName}`.trim()}
      panelStyle={{ maxHeight: '90svh', ...panelStyle }}
    >
      {title ? (
        <header className="flex shrink-0 items-start gap-3 px-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-extrabold leading-tight text-navy">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
          </div>
          {withClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="tap-target grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-[18px] w-[18px]" aria-hidden />
            </button>
          ) : null}
        </header>
      ) : null}

      <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${title ? 'px-5' : ''} ${footer ? '' : 'pb-[max(16px,env(safe-area-inset-bottom))]'}`.trim()}>
        {children}
      </div>

      {footer ? (
        <footer className="shrink-0 border-t border-line bg-white px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
          {footer}
        </footer>
      ) : null}
    </BottomSheetOverlay>
  );
}
