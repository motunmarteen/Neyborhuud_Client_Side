"use client";

/**
 * Marketplace product comments sheet — same doodle + wash + ambient as feed comments.
 */

import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragStartTs, setDragStartTs] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setDragY(0);
      setDragging(false);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 240);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !productId) return null;

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    setDragging(true);
    setDragStartY(e.clientY);
    setDragStartTs(performance.now());
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragging || dragStartY === null) return;
    setDragY(Math.max(0, e.clientY - dragStartY));
  };

  const onPointerEnd = () => {
    if (!dragging) return;
    const elapsed = dragStartTs ? Math.max(1, performance.now() - dragStartTs) : 1;
    const velocity = dragY / elapsed;
    const dismiss = dragY > 120 || velocity > 1.1;
    setDragging(false);
    setDragStartY(null);
    setDragStartTs(null);
    if (dismiss) {
      onClose();
      setDragY(0);
      return;
    }
    setDragY(0);
  };

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
        style={{
          transform: `translate3d(0, ${(visible ? 0 : 520) + dragY}px, 0)`,
          opacity: visible ? 1 : 0,
          transitionProperty: dragging ? "none" : "transform, opacity",
          transitionDuration: dragging ? "0ms" : "300ms",
          transitionTimingFunction: dragging ? "linear" : "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Product comments"
      >
        <div className="doodle-modal-panel-wash z-0" aria-hidden />
        <div className="doodle-modal-ambient z-0 motion-safe:animate-soft-float" aria-hidden>
          <div className="doodle-modal-ambient-float" />
        </div>

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div
            className="flex cursor-grab touch-none justify-center pb-1 pt-2.5 active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            <div className="h-1 w-12 rounded-full bg-[var(--neu-text-muted)]/40" />
          </div>

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
