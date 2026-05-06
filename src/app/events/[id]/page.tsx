"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import {
  useEvent,
  useAttendEvent,
  useCancelEvent,
  useDeleteEvent,
  useShareEvent,
  useReportEvent,
  useEventAttendees,
} from "@/hooks/useEvents";
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

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4">
      <div className="bg-[#1a1a2e] border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-white">Cancel Event</h3>
        <p className="text-gray-400 text-sm">
          Please provide a reason so attendees are informed.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Reason for cancellation (min 5 characters)…"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 resize-none text-sm"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 text-sm transition-colors"
          >
            Keep Event
          </button>
          <button
            onClick={() => reason.trim().length >= 5 && onConfirm(reason.trim())}
            disabled={isPending || reason.trim().length < 5}
            className="flex-1 py-2.5 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 rounded-xl text-white text-sm font-semibold transition-colors"
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4">
      <div className="bg-[#1a1a2e] border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-white">Report Event</h3>
        <div className="space-y-1">
          {REPORT_REASONS.map((r) => (
            <label
              key={r.value}
              className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <input
                type="radio"
                name="report-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-red-500"
              />
              <span className="text-gray-300 text-sm">{r.label}</span>
            </label>
          ))}
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Additional details (optional)…"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none text-sm"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(reason, description.trim() || undefined)}
            disabled={isPending}
            className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-xl text-white text-sm font-semibold transition-colors"
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4">
      <div className="bg-[#1a1a2e] border border-gray-700 rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">Attendees</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 transition-colors"
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
            <p className="text-gray-500 text-sm text-center py-8">No attendees yet.</p>
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
                  className="flex items-center gap-3 hover:bg-gray-800 rounded-xl p-2 transition-colors"
                >
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                      {name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">{name}</p>
                    {u.username && (
                      <p className="text-gray-500 text-xs">@{u.username}</p>
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
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const { data, isLoading, error } = useEvent(id);
  const attendEvent = useAttendEvent();
  const cancelEvent = useCancelEvent();
  const deleteEvent = useDeleteEvent();
  const shareEvent = useShareEvent();
  const reportEvent = useReportEvent();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);

  const event = (data as any)?.data?.event ?? (data as any)?.data ?? data;

  if (isLoading) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <TopNav />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 min-h-0 overflow-y-auto bg-[#0f0f1e] animate-pulse">
            <div className="h-56 bg-gray-800" />
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
              <div className="h-7 bg-gray-800 rounded w-2/3" />
              <div className="h-4 bg-gray-800 rounded w-1/3" />
              <div className="h-32 bg-gray-800 rounded-xl" />
            </div>
          </div>
          <RightSidebar />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <TopNav />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 min-h-0 overflow-y-auto bg-[#0f0f1e] flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-red-400 mb-4">Event not found</p>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
          <RightSidebar />
        </div>
        <BottomNav />
      </div>
    );
  }

  const isOrganizer = user?.id === event.organizerId;
  const isCancelled = event.status === "cancelled";
  const isCompleted = event.status === "completed";
  const attendeeCount = event.attendeesCount ?? event.attendees;
  const eventId = event.id ?? event._id;

  const organizerName = event.organizer
    ? [event.organizer.firstName, event.organizer.lastName]
        .filter(Boolean)
        .join(" ") || event.organizer.username
    : null;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 min-h-0 overflow-y-auto pb-20 bg-[#0f0f1e] text-white">
          {/* Cover image */}
          {event.coverImage && (
            <div className="relative h-56 w-full overflow-hidden">
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#0f0f1e]/90" />
              <button
                onClick={() => router.back()}
                className="absolute top-4 left-4 p-2 bg-black/50 rounded-full backdrop-blur-sm text-white"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
            </div>
          )}

          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {!event.coverImage && (
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Events
              </button>
            )}

            {/* Title & badges */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`text-xs px-3 py-1 rounded-full capitalize ${TYPE_COLORS[event.type] ?? "bg-gray-700 text-gray-300"}`}
                >
                  {event.type}
                </span>
                {event.status && (
                  <span
                    className={`text-xs px-3 py-1 rounded-full capitalize ${STATUS_COLORS[event.status] ?? "bg-gray-700 text-gray-300"}`}
                  >
                    {event.status}
                  </span>
                )}
                {event.isFree ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                    Free
                  </span>
                ) : (
                  event.ticketPrice != null && (
                    <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                      ₦{event.ticketPrice.toLocaleString()}
                    </span>
                  )
                )}
              </div>

              <h1 className="text-2xl font-bold text-white mb-1">{event.title}</h1>

              {organizerName && (
                <p className="text-gray-400 text-sm">
                  Organized by{" "}
                  {event.organizer?.username ? (
                    <Link
                      href={`/profile/${event.organizer.username}`}
                      className="text-blue-400 hover:underline"
                    >
                      {organizerName}
                    </Link>
                  ) : (
                    organizerName
                  )}
                </p>
              )}

              {/* Cancellation reason */}
              {isCancelled && event.cancelReason && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800/40 rounded-xl">
                  <p className="text-xs text-red-400 font-semibold mb-1">Cancellation reason</p>
                  <p className="text-sm text-red-300">{event.cancelReason}</p>
                </div>
              )}

              {/* Date/time & venue card */}
              <div className="grid sm:grid-cols-2 gap-4 mt-5 p-4 bg-gray-800/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-400 text-[18px] mt-0.5">calendar_month</span>
                  <div>
                    <p className="text-xs text-gray-500">Start</p>
                    <p className="text-sm text-white">{formatDateTime(event.startDate)}</p>
                  </div>
                </div>
                {event.endDate && (
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-purple-400 text-[18px] mt-0.5">event_available</span>
                    <div>
                      <p className="text-xs text-gray-500">End</p>
                      <p className="text-sm text-white">{formatDateTime(event.endDate)}</p>
                    </div>
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <span className="material-symbols-outlined text-orange-400 text-[18px] mt-0.5">location_on</span>
                    <div>
                      <p className="text-xs text-gray-500">Venue</p>
                      <p className="text-sm text-white">{event.venue}</p>
                    </div>
                  </div>
                )}
                {typeof attendeeCount === "number" && (
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-[18px] mt-0.5">group</span>
                    <div>
                      <p className="text-xs text-gray-500">Attendees</p>
                      <button
                        onClick={() => setShowAttendees(true)}
                        className="text-sm text-blue-400 hover:underline"
                      >
                        {attendeeCount}
                        {event.capacity ? ` / ${event.capacity}` : ""} going — View list
                      </button>
                    </div>
                  </div>
                )}
                {typeof event.sharesCount === "number" && event.sharesCount > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-[18px] mt-0.5">share</span>
                    <div>
                      <p className="text-xs text-gray-500">Shares</p>
                      <p className="text-sm text-white">{event.sharesCount}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* RSVP button */}
              {!isOrganizer && !isCancelled && !isCompleted && (
                <button
                  onClick={() =>
                    attendEvent.mutate({ eventId, attending: !!event.isAttending })
                  }
                  disabled={attendEvent.isPending}
                  className={`w-full mt-5 py-3 rounded-xl font-bold text-base transition-colors disabled:opacity-50 ${
                    event.isAttending
                      ? "bg-green-700 hover:bg-green-600 text-white"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  {event.isAttending ? "✓ Going — Cancel RSVP" : "RSVP — I'm Going!"}
                </button>
              )}

              {/* Share + Report row */}
              <div className="flex gap-3 mt-4">
                {!isCancelled && (
                  <button
                    onClick={() => shareEvent.mutate(eventId)}
                    disabled={shareEvent.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                    Share
                  </button>
                )}
                {!isOrganizer && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 text-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">flag</span>
                    Report
                  </button>
                )}
              </div>

              {/* Organizer controls */}
              {isOrganizer && (
                <div className="flex gap-3 mt-4">
                  <Link
                    href={`/events/${eventId}/edit`}
                    className="flex-1 py-3 text-center bg-blue-900/40 hover:bg-blue-900/60 border border-blue-700 text-blue-400 rounded-xl font-semibold transition-colors text-sm"
                  >
                    Edit Event
                  </Link>
                  {!isCancelled && !isCompleted && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="flex-1 py-3 bg-yellow-900/40 hover:bg-yellow-900/60 border border-yellow-700 text-yellow-400 rounded-xl font-semibold transition-colors text-sm"
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
                    className="flex-1 py-3 bg-red-900/40 hover:bg-red-900/60 border border-red-700 text-red-400 rounded-xl font-semibold transition-colors text-sm disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">About</h2>
              <p className="text-gray-300 whitespace-pre-line leading-relaxed text-sm">
                {event.description}
              </p>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="bg-gray-800 text-gray-300 rounded-full px-3 py-1.5 text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <RightSidebar />
      </div>
      <BottomNav />

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
    </div>
  );
}

