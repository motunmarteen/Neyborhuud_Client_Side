"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Event } from "@/types/api";
import { prefetchEventDetail } from "@/hooks/useEvents";

const TYPE_COLORS: Record<Event["type"], string> = {
  community: "bg-brand-blue/20 text-brand-blue",
  social: "bg-brand-blue/20 text-pink-400",
  sports: "bg-brand-red/20 text-brand-red",
  cultural: "bg-brand-blue/20 text-brand-blue",
  educational: "bg-brand-green-dark/20 text-brand-green-dark",
  business: "bg-primary/20 text-primary",
  other: "bg-brand-surface/20 text-[var(--neu-text-muted)]",
};

function formatEventDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  event: Event;
  onAttend: (eventId: string) => void;
  attendPending?: boolean;
  /** Immersive 90vh card (events index) vs shorter card for mixed main feed */
  variant?: "immersive" | "feed";
}

export default function EventCard({ event, onAttend, attendPending, variant = "immersive" }: Props) {
  const queryClient = useQueryClient();
  const isCancelled = event.status === "cancelled";
  const isCompleted = event.status === "completed";
  const attendeeCount = event.attendeesCount ?? event.attendees;
  const eventId = event.id ?? (event as any)._id;
  const startDate = event.startDate;

  const prefetchDetail = useCallback(() => {
    if (eventId) void prefetchEventDetail(queryClient, String(eventId));
  }, [eventId, queryClient]);

  const moodGlow = event.type === "sports"
    ? "radial-gradient(circle at 20% 22%, rgba(56,189,248,0.25), transparent 36%), radial-gradient(circle at 82% 82%, rgba(14,165,233,0.20), transparent 40%)"
    : event.type === "social"
      ? "radial-gradient(circle at 20% 22%, rgba(236,72,153,0.24), transparent 36%), radial-gradient(circle at 82% 82%, rgba(168,85,247,0.20), transparent 40%)"
      : event.type === "cultural"
        ? "radial-gradient(circle at 20% 22%, rgba(245,158,11,0.24), transparent 36%), radial-gradient(circle at 82% 82%, rgba(217,70,239,0.20), transparent 40%)"
        : "radial-gradient(circle at 20% 22%, rgba(0,212,49,0.24), transparent 36%), radial-gradient(circle at 82% 82%, rgba(59,130,246,0.20), transparent 40%)";

  const isFeedVariant = variant === "feed";

  return (
    <article
      className={`feed-post-card group relative mx-auto w-full overflow-hidden rounded-none border-y border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.50)] sm:max-w-[480px] sm:rounded-[32px] sm:border ${
        isCancelled ? "ring-2 ring-brand-red/40" : ""
      } ${isFeedVariant ? "min-h-[260px] h-[min(52vh,420px)] max-h-[420px] sm:max-h-[440px]" : ""}`}
      style={isFeedVariant ? undefined : { height: "90vh", minHeight: "90vh" }}
    >
      {event.coverImage ? (
        <div className="absolute inset-0">
          <Image src={event.coverImage} alt={event.title} fill sizes="(max-width: 480px) 100vw, 480px" className="object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.10) 28%, rgba(0,0,0,0.12) 52%, rgba(0,0,0,0.92) 100%)",
            }}
          />
          <div aria-hidden className="absolute inset-0 opacity-75" style={{ background: moodGlow }} />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[#050911]">
          <div aria-hidden className="absolute inset-0" style={{ background: moodGlow }} />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 38%, transparent 26%, rgba(0,0,0,0.62) 100%), linear-gradient(180deg, rgba(0,0,0,0.60), transparent 30%, rgba(0,0,0,0.86))",
            }}
          />
        </div>
      )}

      <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 px-4 pt-4 pb-16 bg-gradient-to-b from-black/60 via-black/18 to-transparent">
        <div className="pointer-events-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[9px] px-2 py-[3px] rounded-full font-bold uppercase tracking-wider ${TYPE_COLORS[event.type]}`}>
              {event.type}
            </span>
            {event.isFree ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/25 text-primary font-bold">Free</span>
            ) : event.ticketPrice != null ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/25 text-white/90 font-bold">₦{event.ticketPrice.toLocaleString()}</span>
            ) : null}
            {(event as any).isBoosted && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/90 text-black font-black uppercase tracking-wide">Boosted</span>
            )}
            {isCancelled && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-danger/25 text-status-danger font-bold uppercase tracking-wide">Cancelled</span>
            )}
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/75 transition-all hover:scale-105 hover:text-white active:scale-95"
            style={{
              background: "rgba(255,255,255,0.11)",
              backdropFilter: "blur(16px) saturate(170%)",
              border: "1px solid rgba(255,255,255,0.16)",
            }}
            aria-label="Event options"
            type="button"
          >
            <span className="material-symbols-outlined text-[19px]">more_horiz</span>
          </button>
        </div>
      </div>

      <div
        className={`absolute right-3 z-30 flex flex-col items-center gap-3 sm:right-4 ${isFeedVariant ? "bottom-4 sm:bottom-5" : "bottom-5 sm:bottom-6"}`}
      >
        <Link
          href={`/events/${eventId}`}
          onMouseEnter={prefetchDetail}
          onFocus={prefetchDetail}
          className="group flex flex-col items-center gap-1 rounded-full p-1 transition-transform duration-200 ease-out hover:scale-110 active:scale-90"
          aria-label="Open event"
        >
          <span className="material-symbols-outlined text-[22px] text-white" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.85))" }}>
            open_in_new
          </span>
        </Link>
        {!isCancelled && !isCompleted && (
          <button
            onClick={() => onAttend(eventId)}
            disabled={attendPending}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold border backdrop-blur-md transition-all disabled:opacity-50 ${
              event.isAttending
                ? "bg-primary/30 border-brand-green-dark/40 text-status-success"
                : "bg-white/10 border-white/20 text-white/85 hover:bg-white/15"
            }`}
          >
            {event.isAttending ? "Going" : "Attend"}
          </button>
        )}
        {typeof attendeeCount === "number" && (
          <div className="flex flex-col items-center gap-0.5">
            <span className="material-symbols-outlined text-[18px] text-white/35">group</span>
            <span className="text-[10px] font-medium text-white/60">
              {attendeeCount}
              {event.capacity ? `/${event.capacity}` : ""}
            </span>
          </div>
        )}
      </div>

      <div
        className={`absolute left-4 right-[76px] z-20 sm:left-5 sm:right-24 ${isFeedVariant ? "bottom-4 sm:bottom-5" : "bottom-5 sm:bottom-6"}`}
      >
        <div className={`flex max-w-[560px] flex-col ${isFeedVariant ? "gap-2" : "gap-3"}`}>
          <Link
            href={`/events/${eventId}`}
            onMouseEnter={prefetchDetail}
            onFocus={prefetchDetail}
            className={`leading-tight font-black text-white hover:underline ${isFeedVariant ? "text-[17px] sm:text-lg" : "text-[22px]"}`}
            style={{ textShadow: "0 2px 18px rgba(0,0,0,0.92)" }}
          >
            {event.title}
          </Link>
          <div
            className={`flex flex-wrap items-center gap-2 rounded-2xl ${isFeedVariant ? "p-2.5" : "p-3"}`}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="text-[12px] font-bold text-white/95">
              {formatEventDate(startDate)} · {formatTime(startDate)}
            </span>
            {event.venue && <span className="text-[11px] text-white/75">📍 {event.venue}</span>}
            {typeof attendeeCount === "number" && (
              <span className="text-[11px] text-white/75">
                👥 {attendeeCount}
                {event.capacity ? `/${event.capacity}` : ""} going
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

