"use client";

import Link from "next/link";
import { Event } from "@/types/api";

const TYPE_COLORS: Record<Event["type"], string> = {
  community: "bg-blue-500/20 text-blue-400",
  social: "bg-pink-500/20 text-pink-400",
  sports: "bg-orange-500/20 text-orange-400",
  cultural: "bg-purple-500/20 text-purple-400",
  educational: "bg-teal-500/20 text-teal-400",
  business: "bg-green-500/20 text-green-400",
  other: "bg-gray-500/20 text-gray-400",
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
}

export default function EventCard({ event, onAttend, attendPending }: Props) {
  const isCancelled = event.status === "cancelled";
  const isCompleted = event.status === "completed";
  const attendeeCount = event.attendeesCount ?? event.attendees;
  const eventId = event.id ?? (event as any)._id;

  return (
    <div
      className={`relative bg-[#1a1a2e] border rounded-xl overflow-hidden ${
        isCancelled ? "border-red-900/60 opacity-70" : "border-gray-800"
      }`}
    >
      {/* Cover image */}
      {event.coverImage && (
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {/* Boosted badge */}
          {(event as any).isBoosted && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 shadow z-10">
              <span className="text-[11px]">🚀</span>
              <span className="text-black text-[9px] font-black uppercase tracking-wide">Boosted</span>
            </div>
          )}
          {isCancelled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Cancelled
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Type + status + pricing */}
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full capitalize ${TYPE_COLORS[event.type]}`}
          >
            {event.type}
          </span>
          {!event.isFree && event.ticketPrice != null && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
              ₦{event.ticketPrice.toLocaleString()}
            </span>
          )}
          {event.isFree && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
              Free
            </span>
          )}
        </div>

        {/* Title */}
        <Link
          href={`/events/${eventId}`}
          className="text-base font-semibold text-white hover:text-blue-400 transition-colors line-clamp-2"
        >
          {event.title}
        </Link>

        {/* Date & time */}
        <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-400">
          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
          <span>
            {formatEventDate(event.startDate)} · {formatTime(event.startDate)}
          </span>
        </div>

        {/* Venue */}
        {event.venue && (
          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-400">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            <span className="line-clamp-1">{event.venue}</span>
          </div>
        )}

        {/* Footer: attendees + RSVP */}
        <div className="flex items-center justify-between mt-3">
          {typeof attendeeCount === "number" && (
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <span className="material-symbols-outlined text-[16px]">group</span>
              <span>
                {attendeeCount}
                {event.capacity ? ` / ${event.capacity}` : ""} going
              </span>
            </div>
          )}
          {!isCancelled && !isCompleted && (
            <button
              onClick={() => onAttend(eventId)}
              disabled={attendPending}
              className={`ml-auto px-4 py-1.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${
                event.isAttending
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "border border-gray-600 hover:border-blue-500 hover:text-blue-400 text-gray-300"
              }`}
            >
              {event.isAttending ? "Going ✓" : "Attend"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

