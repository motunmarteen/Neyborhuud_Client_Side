"use client";

import { useEffect } from "react";
import { useEventSharePayload, useRecordEventShare } from "@/hooks/useEvents";
import { getErrorMessage } from "@/lib/error-handler";
import type { EventShareFallbackInput, EventSharePayload, EventSharePlatforms } from "@/services/events.service";
import { toast } from "sonner";

function openExternalUrl(url: string) {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

type EventShareSheetProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  /** Used when GET /events/:id/share returns 404/503 so share still works against local API. */
  fallback?: EventShareFallbackInput | null;
};

function ShareActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="neu-btn flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all disabled:opacity-50 active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
      style={{ color: "var(--neu-text)" }}
    >
      <span
        className="neu-socket flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ color: "var(--neu-text-muted)" }}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

function PlatformChips({
  platforms,
  disabled,
  payload,
  onOpen,
}: {
  platforms: EventSharePlatforms;
  disabled: boolean;
  payload: EventSharePayload;
  onOpen: (url: string, payload: EventSharePayload) => void;
}) {
  const items: { key: keyof EventSharePlatforms; label: string }[] = [
    { key: "twitter", label: "X / Twitter" },
    { key: "facebook", label: "Facebook" },
    { key: "telegram", label: "Telegram" },
    { key: "linkedin", label: "LinkedIn" },
  ];
  const visible = items.filter((i) => platforms[i.key]);
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {visible.map(({ key, label }) => (
        <button
          key={String(key)}
          type="button"
          disabled={disabled}
          onClick={() => {
            const url = platforms[key];
            if (url) onOpen(url, payload);
          }}
          className="neu-btn rounded-full px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50"
          style={{ color: "var(--neu-text)" }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function EventShareSheet({ open, onClose, eventId, fallback }: EventShareSheetProps) {
  const { data: share, isLoading, isError, error, refetch, isFetching } = useEventSharePayload(
    open ? eventId : null,
    open,
    { fallback: fallback ?? undefined },
  );
  const recordShare = useRecordEventShare();

  useEffect(() => {
    if (!open || !isError) return;
    const msg = getErrorMessage(error) || "Could not load share options.";
    toast.error(msg, { id: "event-share-fetch" });
  }, [open, isError, error]);

  const record = (payload: EventSharePayload) => {
    if (payload.clientFallback) return;
    recordShare.mutate(eventId);
  };

  const handleCopyLink = async (payload: EventSharePayload) => {
    const text = payload.webUrl || payload.message;
    if (!text) {
      toast.error("No link available");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied");
      record(payload);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleCopyInviteText = async (payload: EventSharePayload) => {
    const text = payload.message || payload.webUrl;
    if (!text) {
      toast.error("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
      record(payload);
    } catch {
      toast.error("Could not copy");
    }
  };

  const handleNativeShare = async (payload: EventSharePayload) => {
    if (!navigator.share) {
      await handleCopyLink(payload);
      return;
    }
    try {
      await navigator.share({
        title: payload.title || "Event",
        text: payload.message,
        url: payload.webUrl || undefined,
      });
      record(payload);
    } catch (e: unknown) {
      const name = e && typeof e === "object" && "name" in e ? (e as { name: string }).name : "";
      if (name === "AbortError") return;
      toast.error(getErrorMessage(e) || "Share was not completed");
    }
  };

  const handleOpenPlatform = (url: string, payload: EventSharePayload) => {
    openExternalUrl(url);
    record(payload);
  };

  if (!open) return null;

  const busy = recordShare.isPending;
  const loading = isLoading || isFetching;
  const hasNative = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Share event"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div
        className="neu-modal relative mx-auto mb-0 max-h-[85vh] w-full max-w-md overflow-hidden rounded-t-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.08] px-4 pb-3 pt-4 dark:border-white/10">
          <div className="min-w-0 pr-2">
            <h3 className="text-lg font-bold" style={{ color: "var(--neu-text)" }}>
              Share event
            </h3>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--neu-text-muted)" }}>
              Invite neighbors via link or apps. Shared links open your public event page in the browser.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl neu-btn transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl" style={{ color: "var(--neu-text-muted)" }}>
              close
            </span>
          </button>
        </div>

        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-4 pb-5 pt-4 sm:max-h-[min(75vh,560px)]">
          {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            <p className="text-sm" style={{ color: "var(--neu-text-muted)" }}>
              Loading share options…
            </p>
          </div>
        ) : isError ? (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Something went wrong while loading share data.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => refetch()}
                className="neu-btn rounded-xl px-4 py-2 text-sm font-semibold text-primary transition-all"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm transition-colors"
                style={{ color: "var(--neu-text-muted)" }}
              >
                Close
              </button>
            </div>
          </div>
        ) : share ? (
          <>
            {share.clientFallback ? (
              <p className="mb-3 rounded-xl border border-amber-400/35 bg-amber-500/[0.12] px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
                Share service is unavailable (404/503). Showing links built from this page until the API is ready.
              </p>
            ) : null}
            <p className="mb-3 line-clamp-2 text-sm font-semibold" style={{ color: "var(--neu-text)" }}>
              {share.title}
            </p>
            <div className="space-y-2">
              <ShareActionButton
                icon={<span className="material-symbols-outlined text-[20px]">link</span>}
                label="Copy link"
                disabled={busy}
                onClick={() => handleCopyLink(share)}
              />
              {share.platforms.whatsapp ? (
                <ShareActionButton
                  icon={<span className="material-symbols-outlined text-[20px]">chat</span>}
                  label="WhatsApp"
                  disabled={busy}
                  onClick={() => handleOpenPlatform(share.platforms.whatsapp!, share)}
                />
              ) : null}
              {hasNative ? (
                <ShareActionButton
                  icon={<span className="material-symbols-outlined text-[20px]">ios_share</span>}
                  label="System share (Messages, SMS, Mail…)"
                  disabled={busy}
                  onClick={() => handleNativeShare(share)}
                />
              ) : null}
              {!hasNative ? (
                <ShareActionButton
                  icon={<span className="material-symbols-outlined text-[20px]">content_copy</span>}
                  label="Copy invite text"
                  disabled={busy}
                  onClick={() => handleCopyInviteText(share)}
                />
              ) : null}
              <PlatformChips platforms={share.platforms} disabled={busy} payload={share} onOpen={handleOpenPlatform} />
              {share.platforms.email ? (
                <ShareActionButton
                  icon={<span className="material-symbols-outlined text-[20px]">mail</span>}
                  label="Email"
                  disabled={busy}
                  onClick={() => handleOpenPlatform(share.platforms.email!, share)}
                />
              ) : null}
            </div>
          </>
        ) : null}
        </div>
      </div>
    </div>
  );
}
