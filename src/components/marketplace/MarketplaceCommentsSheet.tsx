"use client";

/**
 * Marketplace product comments sheet — same doodle + wash + ambient as feed comments.
 */

import { useEffect } from "react";
import { BottomSheetDragHandle } from "@/components/ui/BottomSheetDragHandle";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";
import { useBottomSheetMount } from "@/hooks/useBottomSheetMount";
import { ProductComments } from "@/components/marketplace/ProductComments";

type MarketplaceCommentsSheetProps = {
  open: boolean;
  onClose: () => void;
  productId: string | null;
  commentsCount?: number;
  currentUserId?: string;
};

export function MarketplaceCommentsSheet({
  open,
  onClose,
  productId,
  commentsCount = 0,
  currentUserId,
}: MarketplaceCommentsSheetProps) {
  const { mounted, visible } = useBottomSheetMount({ open, onClose });
  const { handleProps, getPanelStyle, reset } = useBottomSheetDrag({ onDismiss: onClose });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  if (!mounted || !productId) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center">
      <button
        type="button"
        className={`doodle-modal-backdrop absolute inset-0 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-label="Close comments"
      />

      <section
        className="doodle-modal-panel relative flex max-h-[86vh] w-full flex-col overflow-hidden rounded-t-[32px] border border-[var(--neu-shadow-dark)] shadow-[0_-12px_40px_var(--neu-shadow-dark)] md:max-w-[560px] md:shadow-[0_20px_50px_var(--neu-shadow-dark)]"
        style={getPanelStyle(visible, 520)}
        role="dialog"
        aria-modal="true"
        aria-label="Product comments"
      >
        <div className="doodle-modal-panel-wash z-0" aria-hidden />
        <div className="doodle-modal-ambient z-0 motion-safe:animate-soft-float" aria-hidden>
          <div className="doodle-modal-ambient-float" />
        </div>

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <BottomSheetDragHandle handleProps={handleProps} className="pt-2.5 pb-1" />

          <div
            className="flex items-center justify-between border-b border-[var(--neu-shadow-dark)] px-4 py-2.5"
            style={{ boxShadow: "0 1px 0 var(--neu-shadow-light)" }}
          >
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--neu-text)]">Comments</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[var(--neu-text-secondary)]">{commentsCount}</span>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost grid h-8 w-8 place-items-center rounded-full transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--neu-text-secondary)" }}>
                  close
                </span>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
            <ProductComments productId={productId} currentUserId={currentUserId} embedded />
          </div>
        </div>
      </section>
    </div>
  );
}
