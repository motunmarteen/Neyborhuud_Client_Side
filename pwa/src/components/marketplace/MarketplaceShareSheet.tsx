"use client";

import { toast } from "sonner";
import { BottomSheetOverlay } from "@/components/ui/BottomSheetOverlay";
import { marketplaceService } from "@/services/marketplace.service";
import { getErrorMessage } from "@/lib/error-handler";
import { useState } from "react";

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
  const [recording, setRecording] = useState(false);

  const url = buildShareUrl(productId);
  const text = `${title} — NeyborHuud Marketplace`;

  const recordShare = async () => {
    if (recording) return;
    setRecording(true);
    try {
      await marketplaceService.shareItem(productId, text);
    } catch (e) {
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
      } catch (e: unknown) {
        const name = e && typeof e === "object" && "name" in e ? (e as { name: string }).name : "";
        if (name !== "AbortError") {
          toast.error("Share cancelled or unavailable");
        }
      }
    } else {
      await copyLink();
    }
  };

  return (
    <BottomSheetOverlay
      open={open}
      onClose={onClose}
      ariaLabel="Share listing"
      zIndexClass="z-[75]"
      alignClass="items-end justify-center sm:items-center"
      backdropClassName="doodle-modal-backdrop"
      panelClassName="doodle-modal-panel relative m-4 w-full max-w-sm overflow-hidden rounded-[28px] border border-[var(--border-light)] p-5 shadow-[0_24px_60px_rgba(0,111,53,0.16)] dark:border-[var(--neu-shadow-dark)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
      handleClassName="pt-2 pb-0"
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
    </BottomSheetOverlay>
  );
}
