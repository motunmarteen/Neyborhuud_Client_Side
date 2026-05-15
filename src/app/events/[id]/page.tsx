"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import { FeedSkyHero } from "@/components/feed/FeedSkyHero";
import {
  useEvent,
  useCancelEvent,
  useDeleteEvent,
  useReportEvent,
  useEventAttendees,
} from "@/hooks/useEvents";
import EventShareSheet from "@/components/events/EventShareSheet";
import { useAuth } from "@/hooks/useAuth";

const TYPE_COLORS: Record<string, string> = {
  community: "bg-blue-500/20 text-blue-400",
  social: "bg-pink-500/20 text-pink-400",
  sports: "bg-orange-500/20 text-orange-400",
  cultural: "bg-purple-500/20 text-purple-400",
  educational: "bg-teal-500/20 text-teal-400",
  business: "bg-green-500/20 text-green-400",
  other: "bg-gray-500/20 text-gray-400",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  completed: "bg-gray-500/20 text-gray-300",
  cancelled: "bg-red-500/20 text-red-400",
};

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misleading", label: "Misleading information" },
  { value: "violence", label: "Violence or threats" },
  { value: "other", label: "Other" },
];

function formatDateTime(d: string | undefined) {
  if (!d) return "—";
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return "—";
  return new Date(d).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Normalize single-event API payloads (shape varies by backend). */
function extractEventFromApiPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const d = p.data;
  if (d != null && typeof d === "object") {
    const inner = d as Record<string, unknown>;
    if (inner.event && typeof inner.event === "object") return inner.event as Record<string, unknown>;
    const nested = inner.data;
    if (nested && typeof nested === "object" && ("title" in nested || "id" in nested || "_id" in nested)) {
      return nested as Record<string, unknown>;
    }
    if ("title" in inner || "id" in inner || "_id" in inner) return inner;
  }
  if ("title" in p || "id" in p || "_id" in p) return p;
  return null;
}

function organizerDisplayName(organizer: unknown): { name: string | null; username: string | null } {
  if (!organizer || typeof organizer !== "object") return { name: null, username: null };
  const o = organizer as Record<string, unknown>;
  const first = typeof o.firstName === "string" ? o.firstName : "";
  const last = typeof o.lastName === "string" ? o.lastName : "";
  const joined = [first, last].filter(Boolean).join(" ").trim();
  const username = typeof o.username === "string" ? o.username : null;
  const name = joined || username || null;
  return { name, username };
}

// ─── Cancel Modal ────────────────────────────────────────────────
function CancelModal({
  onCancel,
  onConfirm,
  isPending,
}: {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 backdrop-blur-md sm:items-center">
      <div className="mod-modal w-full max-w-md space-y-4 rounded-t-[28px] border border-white/10 p-6 sm:rounded-[28px]">
        <h3 className="text-lg font-bold text-white">Cancel Event</h3>
        <p className="text-sm text-white/65">
          Please provide a reason so attendees are informed.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Reason for cancellation (min 5 characters)…"
          className="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-amber-300/50 focus:outline-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 bg-white/10 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/15 hover:text-white"
          >
            Keep Event
          </button>
          <button
            onClick={() => reason.trim().length >= 5 && onConfirm(reason.trim())}
            disabled={isPending || reason.trim().length < 5}
            className="flex-1 rounded-xl border border-amber-300/25 bg-amber-500/20 py-2.5 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-500/30 disabled:opacity-50"
          >
            {isPending ? "Cancelling…" : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────
function ReportModal({
  onClose,
  onSubmit,
  isPending,
}: {
  onClose: () => void;
  onSubmit: (reason: string, description?: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("spam");
  const [description, setDescription] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 backdrop-blur-md sm:items-center">
      <div className="mod-modal w-full max-w-md space-y-4 rounded-t-[28px] border border-white/10 p-6 sm:rounded-[28px]">
        <h3 className="text-lg font-bold text-white">Report Event</h3>
        <div className="space-y-1">
          {REPORT_REASONS.map((r) => (
            <label
              key={r.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/10"
            >
              <input
                type="radio"
                name="report-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-red-500"
              />
              <span className="text-sm text-white/80">{r.label}</span>
            </label>
          ))}
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Additional details (optional)…"
          className="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-red-300/50 focus:outline-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/10 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/15 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(reason, description.trim() || undefined)}
            disabled={isPending}
            className="flex-1 rounded-xl border border-red-300/25 bg-red-500/20 py-2.5 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/30 disabled:opacity-50"
          >
            {isPending ? "Reporting…" : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Attendees Modal ──────────────────────────────────────────────
function AttendeesModal({
  eventId,
  onClose,
}: {
  eventId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useEventAttendees(eventId);
  const attendees: any[] = (data as any)?.data?.attendees ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 backdrop-blur-md sm:items-center">
      <div className="mod-modal flex max-h-[70vh] w-full max-w-md flex-col rounded-t-[28px] border border-white/10 sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <h3 className="text-lg font-bold text-white">Attendees</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-800" />
                  <div className="h-4 bg-gray-800 rounded w-32" />
                </div>
              ))}
            </div>
          )}
          {!isLoading && attendees.length === 0 && (
            <p className="py-8 text-center text-sm text-white/55">No attendees yet.</p>
          )}
          {!isLoading &&
            attendees.map((a: any) => {
              const u = a.userId ?? a;
              const name =
                [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                u.username ||
                "User";
              return (
                <Link
                  key={a._id ?? u._id}
                  href={u.username ? `/profile/${u.username}` : "#"}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/10"
                >
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-bold text-white">
                      {name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">{name}</p>
                    {u.username && (
                      <p className="text-xs text-white/50">@{u.username}</p>
                    )}
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();
  const { user } = useAuth();
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const [navHidden, setNavHidden] = useState(false);

  const { data, isLoading, error } = useEvent(id ?? null);
  const cancelEvent = useCancelEvent();
  const deleteEvent = useDeleteEvent();
  const [showShareSheet, setShowShareSheet] = useState(false);
  const reportEvent = useReportEvent();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);

  const event = extractEventFromApiPayload(data) as Record<string, any> | null;

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const threshold = 10;
    const handleScroll = () => {
      const y = el.scrollTop;
      if (y - lastScrollY.current > threshold) {
        setNavHidden(true);
      } else if (lastScrollY.current - y > threshold) {
        setNavHidden(false);
      }
      lastScrollY.current = y;
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  if (id === undefined || id === "") {
    return (
      <div className="relative flex h-screen w-full overflow-hidden text-white neu-base">
        <Suspense fallback={<div className="w-64" />}>
          <LeftSidebar />
        </Suspense>
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <TopNav />
          <div className="flex flex-1 items-center justify-center px-4 pb-20">
            <div className="mod-card max-w-md rounded-2xl px-6 py-10 text-center">
              <p className="mb-4 text-red-300">Invalid event link</p>
              <button
                type="button"
                onClick={() => router.push("/events")}
                className="rounded-xl mod-btn px-6 py-2.5 font-semibold text-slate-700 hover:text-slate-950"
              >
                Back to Events
              </button>
            </div>
          </div>
        </main>
        <RightSidebar />
        <div className="md:hidden">
          <Suspense fallback={<div className="h-16" />}>
            <BottomNav />
          </Suspense>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative flex h-screen w-full overflow-hidden text-white neu-base">
        <Suspense fallback={<div className="w-64" />}>
          <LeftSidebar />
        </Suspense>
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <TopNav />
          <div className="flex flex-col pb-20">
            <div className="-mt-[60px]">
              <FeedSkyHero />
            </div>
            <div className="px-4 pt-3 md:flex md:justify-center">
              <div className="h-[90vh] w-full animate-pulse rounded-none border-y border-white/10 bg-white/5 sm:max-w-[680px] sm:rounded-[32px] sm:border" />
            </div>
          </div>
        </main>
        <RightSidebar />
        <div className="md:hidden">
          <Suspense fallback={<div className="h-16" />}>
            <BottomNav />
          </Suspense>
        </div>
      </div>
    );
  }

  if (error || !event || !String(event.id ?? event._id ?? "").trim()) {
    return (
      <div className="relative flex h-screen w-full overflow-hidden text-white neu-base">
        <Suspense fallback={<div className="w-64" />}>
          <LeftSidebar />
        </Suspense>
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <TopNav />
          <div className="flex flex-1 items-center justify-center px-4 pb-20">
            <div className="mod-card max-w-md rounded-2xl px-6 py-10 text-center">
              <p className="mb-2 text-red-300">Event not found</p>
              {error ? (
                <p className="mb-4 text-sm text-slate-600">
                  {error instanceof Error ? error.message : "Unable to load this event."}
                </p>
              ) : null}
              <button
                onClick={() => router.back()}
                className="rounded-xl mod-btn px-6 py-2.5 font-semibold text-slate-700 hover:text-slate-950"
              >
                Go Back
              </button>
            </div>
          </div>
        </main>
        <RightSidebar />
        <div className="md:hidden">
          <Suspense fallback={<div className="h-16" />}>
            <BottomNav />
          </Suspense>
        </div>
      </div>
    );
  }

  const isOrganizer = user?.id === String(event.organizerId ?? "");
  const isCancelled = event.status === "cancelled";
  const isCompleted = event.status === "completed";
  const attendeeCount = event.attendeesCount ?? event.attendees;
  const eventId = String(event.id ?? event._id ?? "");

  const { name: organizerName, username: organizerUsername } = organizerDisplayName(event.organizer);
  const eventType = typeof event.type === "string" ? event.type : "community";
  const moodGlow = eventType === "sports"
    ? "radial-gradient(circle at 20% 22%, rgba(56,189,248,0.25), transparent 36%), radial-gradient(circle at 82% 82%, rgba(14,165,233,0.20), transparent 40%)"
    : eventType === "social"
      ? "radial-gradient(circle at 20% 22%, rgba(236,72,153,0.24), transparent 36%), radial-gradient(circle at 82% 82%, rgba(168,85,247,0.20), transparent 40%)"
      : eventType === "cultural"
        ? "radial-gradient(circle at 20% 22%, rgba(245,158,11,0.24), transparent 36%), radial-gradient(circle at 82% 82%, rgba(217,70,239,0.20), transparent 40%)"
        : "radial-gradient(circle at 20% 22%, rgba(16,185,129,0.24), transparent 36%), radial-gradient(circle at 82% 82%, rgba(59,130,246,0.20), transparent 40%)";

  const eventTitle = typeof event.title === "string" ? event.title : "Event";

  return (
    <div className="relative flex h-screen w-full overflow-hidden text-white neu-base">
      <Suspense fallback={<div className="w-64" />}>
        <LeftSidebar />
      </Suspense>

      <main ref={mainRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth">
        <TopNav />

        <div className="flex flex-col pb-20">
          <div className="-mt-[60px]">
            <FeedSkyHero />
          </div>

          <div
            className="mt-3 flex flex-col gap-5 pb-6 md:items-center"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015)), radial-gradient(circle at 50% 0%, rgba(0,135,81,0.12), transparent 34%)",
              backdropFilter: "blur(18px) saturate(150%)",
              WebkitBackdropFilter: "blur(18px) saturate(150%)",
            }}
          >
            <div className="w-full min-w-0 px-4 pt-3 sm:mx-auto sm:max-w-[680px]">
            <article
              className={`feed-post-card relative w-full overflow-hidden rounded-none border-y border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.50)] sm:rounded-[32px] sm:border ${
                isCancelled ? "ring-2 ring-red-500/40" : ""
              }`}
            >
              <div className="relative min-h-[90vh] overflow-hidden">
                {event.coverImage ? (
                  <div className="absolute inset-0">
                    <img src={event.coverImage} alt={eventTitle} className="h-full w-full object-cover" />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.16) 26%, rgba(0,0,0,0.42) 55%, rgba(0,0,0,0.95) 100%)",
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
                          "radial-gradient(ellipse at 50% 38%, transparent 26%, rgba(0,0,0,0.62) 100%), linear-gradient(180deg, rgba(0,0,0,0.60), transparent 30%, rgba(0,0,0,0.92))",
                      }}
                    />
                  </div>
                )}

                <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 px-4 pt-4 pb-20 bg-gradient-to-b from-black/65 via-black/20 to-transparent">
                  <div className="pointer-events-auto flex items-center justify-between gap-3">
                    <button
                      onClick={() => router.back()}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-all hover:scale-105 hover:text-white active:scale-95"
                      style={{
                        background: "rgba(255,255,255,0.11)",
                        backdropFilter: "blur(16px) saturate(170%)",
                        border: "1px solid rgba(255,255,255,0.16)",
                      }}
                      aria-label="Go back"
                    >
                      <span className="material-symbols-outlined text-[21px]">arrow_back</span>
                    </button>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span
                        className={`text-[9px] px-2 py-[3px] rounded-full font-bold uppercase tracking-wider ${TYPE_COLORS[eventType] ?? "bg-gray-500/20 text-gray-200"}`}
                      >
                        {eventType}
                      </span>
                      {event.status && (
                        <span
                          className={`text-[9px] px-2 py-[3px] rounded-full font-bold uppercase tracking-wider ${STATUS_COLORS[event.status] ?? "bg-gray-500/20 text-gray-200"}`}
                        >
                          {event.status}
                        </span>
                      )}
                      {event.isFree ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/25 text-green-200 font-bold">Free</span>
                      ) : (
                        event.ticketPrice != null && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-200 font-bold">
                            ₦{event.ticketPrice.toLocaleString()}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative z-20 flex min-h-[90vh] flex-col justify-end px-5 pb-6 pt-24 sm:px-6 sm:pb-7">
                  <div className="flex max-w-[560px] flex-col gap-4">
                    <div>
                      <h1
                        className="text-[32px] leading-tight font-black text-white sm:text-[40px]"
                        style={{ textShadow: "0 2px 18px rgba(0,0,0,0.92)" }}
                      >
                        {eventTitle}
                      </h1>

                      {organizerName && (
                        <p className="mt-2 text-sm text-white/75">
                          Organized by{" "}
                          {organizerUsername ? (
                            <Link href={`/profile/${organizerUsername}`} className="font-semibold text-white hover:underline">
                              {organizerName}
                            </Link>
                          ) : (
                            organizerName
                          )}
                        </p>
                      )}
                    </div>

                    {isCancelled && event.cancelReason && (
                      <div className="rounded-2xl border border-red-400/25 bg-red-500/15 p-3 backdrop-blur-md">
                        <p className="mb-1 text-xs font-bold text-red-200">Cancellation reason</p>
                        <p className="text-sm text-red-100">{event.cancelReason}</p>
                      </div>
                    )}

                    <div
                      className="grid gap-3 rounded-3xl p-4 sm:grid-cols-2"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        backdropFilter: "blur(16px) saturate(160%)",
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined mt-0.5 text-[19px] text-blue-300">calendar_month</span>
                        <div>
                          <p className="text-[11px] font-semibold text-white/45">Start</p>
                          <p className="text-sm font-semibold text-white">{formatDateTime(event.startDate)}</p>
                        </div>
                      </div>
                      {event.endDate && (
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined mt-0.5 text-[19px] text-purple-300">event_available</span>
                          <div>
                            <p className="text-[11px] font-semibold text-white/45">End</p>
                            <p className="text-sm font-semibold text-white">{formatDateTime(event.endDate)}</p>
                          </div>
                        </div>
                      )}
                      {event.venue && (
                        <div className="flex items-start gap-2 sm:col-span-2">
                          <span className="material-symbols-outlined mt-0.5 text-[19px] text-orange-300">location_on</span>
                          <div>
                            <p className="text-[11px] font-semibold text-white/45">Venue</p>
                            <p className="text-sm font-semibold text-white">{event.venue}</p>
                          </div>
                        </div>
                      )}
                      {typeof attendeeCount === "number" && (
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined mt-0.5 text-[19px] text-white/60">group</span>
                          <div>
                            <p className="text-[11px] font-semibold text-white/45">Attendees</p>
                            <button onClick={() => setShowAttendees(true)} className="text-sm font-semibold text-blue-200 hover:underline">
                              {attendeeCount}
                              {event.capacity ? ` / ${event.capacity}` : ""} going - View list
                            </button>
                          </div>
                        </div>
                      )}
                      {typeof event.sharesCount === "number" && event.sharesCount > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined mt-0.5 text-[19px] text-white/60">share</span>
                          <div>
                            <p className="text-[11px] font-semibold text-white/45">Shares</p>
                            <p className="text-sm font-semibold text-white">{event.sharesCount}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => setShowShareSheet(true)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 py-3 text-sm font-bold text-white/90 backdrop-blur-md transition-all hover:bg-white/15 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">share</span>
                          Share
                        </button>
                      )}
                      {!isOrganizer && (
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 py-3 text-sm font-bold text-white/70 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white"
                        >
                          <span className="material-symbols-outlined text-[18px]">flag</span>
                          Report
                        </button>
                      )}
                    </div>

                    {isOrganizer && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Link
                          href={`/events/${eventId}/edit`}
                          className="rounded-2xl border border-blue-300/25 bg-blue-500/15 py-3 text-center text-sm font-bold text-blue-100 backdrop-blur-md transition-all hover:bg-blue-500/25"
                        >
                          Edit Event
                        </Link>
                        {!isCancelled && !isCompleted && (
                          <button
                            onClick={() => setShowCancelModal(true)}
                            className="rounded-2xl border border-amber-300/25 bg-amber-500/15 py-3 text-sm font-bold text-amber-100 backdrop-blur-md transition-all hover:bg-amber-500/25"
                          >
                            Cancel Event
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm("Delete this event? This cannot be undone."))
                              deleteEvent.mutate(eventId);
                          }}
                          disabled={deleteEvent.isPending}
                          className="rounded-2xl border border-red-300/25 bg-red-500/15 py-3 text-sm font-bold text-red-100 backdrop-blur-md transition-all hover:bg-red-500/25 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>

            {/* Long-form content lives outside the 90vh hero so layout matches the Events feed */}
            <div className="mt-5 space-y-4 pb-2">
              <div className="mod-card rounded-2xl border border-white/10 p-5 backdrop-blur-xl">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">About</h2>
                <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-700">
                  {event.description || "No description provided."}
                </p>
              </div>

              {Array.isArray(event.tags) && event.tags.length > 0 && (
                <div className="mod-card rounded-2xl border border-white/10 p-5 backdrop-blur-xl">
                  <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Tags</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {event.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/40 bg-white/60 px-3 py-1.5 text-xs font-bold text-slate-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </main>

      <RightSidebar />

      <div className="md:hidden">
        <Suspense fallback={<div className="h-16" />}>
          <BottomNav hidden={navHidden} />
        </Suspense>
      </div>

      {showCancelModal && (
        <CancelModal
          onCancel={() => setShowCancelModal(false)}
          onConfirm={(reason) =>
            cancelEvent.mutate(
              { eventId, reason },
              { onSuccess: () => setShowCancelModal(false) },
            )
          }
          isPending={cancelEvent.isPending}
        />
      )}

      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          onSubmit={(reason, description) =>
            reportEvent.mutate(
              { eventId, reason, description },
              { onSuccess: () => setShowReportModal(false) },
            )
          }
          isPending={reportEvent.isPending}
        />
      )}

      {showAttendees && (
        <AttendeesModal eventId={eventId} onClose={() => setShowAttendees(false)} />
      )}

      <EventShareSheet
        open={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        eventId={eventId}
        fallback={{
          title: eventTitle,
          startDate: typeof event.startDate === "string" ? event.startDate : undefined,
          venue: typeof event.venue === "string" ? event.venue : undefined,
        }}
      />
    </div>
  );
}

