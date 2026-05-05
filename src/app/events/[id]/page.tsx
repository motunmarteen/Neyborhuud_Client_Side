"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import { useEvent, useAttendEvent, useCancelEvent, useDeleteEvent } from "@/hooks/useEvents";
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
  upcoming: "bg-blue-500/20 text-blue-400",
  ongoing: "bg-green-500/20 text-green-400",
  completed: "bg-gray-500/20 text-gray-400",
  cancelled: "bg-red-500/20 text-red-400",
};

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

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const { data, isLoading, error } = useEvent(id);
  const attendEvent = useAttendEvent();
  const cancelEvent = useCancelEvent();
  const deleteEvent = useDeleteEvent();

  const event = (data as any)?.data ?? data;

  if (isLoading) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 overflow-y-auto bg-[#0f0f1e] animate-pulse">
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
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 overflow-y-auto bg-[#0f0f1e] flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 mb-4">Event not found</p>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
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
  const organizerName = event.organizer
    ? [event.organizer.firstName, event.organizer.lastName].filter(Boolean).join(" ") ||
      event.organizer.username
    : null;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          {/* Cover image */}
          {event.coverImage && (
            <div className="relative h-56 w-full overflow-hidden">
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f0f1e]/90" />
              <button
                onClick={() => router.back()}
                className="absolute top-4 left-4 p-2 bg-black/50 rounded-full backdrop-blur-sm text-white"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
            </div>
          )}

          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {/* Back button if no cover */}
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
                    className={`text-xs px-3 py-1 rounded-full capitalize ${STATUS_COLORS[event.status] ?? ""}`}
                  >
                    {event.status}
                  </span>
                )}
                {event.isFree ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                    Free
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                    ₦{event.ticketPrice?.toLocaleString()}
                  </span>
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

              {/* Date/time & venue card */}
              <div className="grid sm:grid-cols-2 gap-4 mt-5 p-4 bg-gray-800/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-400 text-[18px] mt-0.5">calendar_month</span>
                  <div>
                    <p className="text-xs text-gray-500">Start</p>
                    <p className="text-sm text-white">{formatDateTime(event.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-purple-400 text-[18px] mt-0.5">event_available</span>
                  <div>
                    <p className="text-xs text-gray-500">End</p>
                    <p className="text-sm text-white">{formatDateTime(event.endDate)}</p>
                  </div>
                </div>
                {event.venue && (
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <span className="material-symbols-outlined text-orange-400 text-[18px] mt-0.5">location_on</span>
                    <div>
                      <p className="text-xs text-gray-500">Venue</p>
                      <p className="text-sm text-white">{event.venue}</p>
                    </div>
                  </div>
                )}
                {typeof event.attendees === "number" && (
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-[18px] mt-0.5">group</span>
                    <div>
                      <p className="text-xs text-gray-500">Attendees</p>
                      <p className="text-sm text-white">
                        {event.attendees}
                        {event.capacity ? ` / ${event.capacity}` : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* RSVP button */}
              {!isOrganizer && !isCancelled && (
                <button
                  onClick={() =>
                    attendEvent.mutate({
                      eventId: event.id,
                      attending: !!event.isAttending,
                    })
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

              {/* Organizer controls */}
              {isOrganizer && (
                <div className="flex gap-3 mt-5">
                  {event.status !== "cancelled" && (
                    <button
                      onClick={() => cancelEvent.mutate({ eventId: event.id })}
                      disabled={cancelEvent.isPending}
                      className="flex-1 py-3 bg-yellow-900/40 hover:bg-yellow-900/60 border border-yellow-700 text-yellow-400 rounded-xl font-semibold transition-colors text-sm"
                    >
                      Cancel Event
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Delete this event? This cannot be undone."))
                        deleteEvent.mutate(event.id);
                    }}
                    disabled={deleteEvent.isPending}
                    className="flex-1 py-3 bg-red-900/40 hover:bg-red-900/60 border border-red-700 text-red-400 rounded-xl font-semibold transition-colors text-sm"
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
    </div>
  );
}
