"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { marketplaceService } from "@/services/marketplace.service";
import { getErrorMessage } from "@/lib/error-handler";

type MarketplaceShareSheetProps = {
  open: boolean;
  onClose: () => void;
  productId: string;
  title: string;
};

function buildShareUrl(productId: string) {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams({ product: productId });
  return `${window.location.origin}/marketplace?${q}`;
}

export function MarketplaceShareSheet({ open, onClose, productId, title }: MarketplaceShareSheetProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 200);
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

  if (!mounted) return null;

  const url = buildShareUrl(productId);
  const text = `${title} — NeyborHuud Marketplace`;

  const recordShare = async () => {
    if (recording) return;
    setRecording(true);
    try {
      await marketplaceService.shareItem(productId, text);
    } catch (e) {
      // Non-blocking: sharing still works if analytics endpoint fails
      console.warn(getErrorMessage(e));
    } finally {
      setRecording(false);
    }
  };

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
      void recordShare();
    } catch {
      toast.error("Could not copy");
    }
  };

  const nativeShare = async () => {
    if (!url) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        void recordShare();
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          toast.error("Share cancelled or unavailable");
        }
      }
    } else {
      await copyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className={`doodle-modal-backdrop absolute inset-0 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-label="Close share"
      />

      <div
        className={`doodle-modal-panel relative m-4 w-full max-w-sm overflow-hidden rounded-[28px] border border-[var(--border-light)] p-5 shadow-[0_24px_60px_rgba(0,111,53,0.16)] transition-all duration-300 dark:border-[var(--neu-shadow-dark)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Share listing"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="doodle-modal-panel-wash z-0" aria-hidden />
        <div className="doodle-modal-ambient z-0 motion-safe:animate-soft-float" aria-hidden>
          <div className="doodle-modal-ambient-float" />
        </div>

        <div className="relative z-[1]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--neu-text)" }}>
                Share listing
              </h2>
              <p className="mt-1 line-clamp-2 text-xs leading-snug" style={{ color: "var(--neu-text-muted)" }}>
                {title}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mod-chip grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--neu-text-secondary)" }}>
                close
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                type="button"
                onClick={() => void nativeShare()}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/35 bg-gradient-to-r from-primary/15 to-[#006F35]/12 py-3 text-sm font-bold text-[#006F35] shadow-[0_8px_24px_rgba(0,212,49,0.2)] transition-transform active:scale-[0.98] dark:border-primary/30 dark:from-emerald-500/20 dark:to-teal-600/15 dark:text-white/90"
              >
                <span className="material-symbols-outlined text-[20px]">ios_share</span>
                Share…
              </button>
            )}
            <button
              type="button"
              onClick={() => void copyLink()}
              className="btn-ghost flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-transform active:scale-[0.98]"
              style={{ color: "var(--neu-text)" }}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--neu-text-secondary)" }}>
                link
              </span>
              Copy link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
