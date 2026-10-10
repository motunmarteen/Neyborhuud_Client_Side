"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Share2,
  Trophy,
  Sparkles,
  Palette,
  GraduationCap,
  Briefcase,
  Layers,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Event } from "@/types/api";
import { prefetchEventDetail } from "@/hooks/useEvents";
import { formatNaira } from "@/lib/currency";

interface EventTypeConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  gradient: string;
}

const TYPE_CONFIG: Record<Event["type"], EventTypeConfig> = {
  community: {
    label: "Community",
    badgeBg: "bg-emerald-50 ",
    badgeText: "text-emerald-700 ",
    borderColor: "border-emerald-200/80 ",
    icon: Users,
    gradient: "from-emerald-500/15 via-teal-500/10 to-transparent",
  },
  social: {
    label: "Social",
    badgeBg: "bg-pink-50 ",
    badgeText: "text-pink-700 ",
    borderColor: "border-pink-200/80 ",
    icon: Sparkles,
    gradient: "from-pink-500/15 via-purple-500/10 to-transparent",
  },
  sports: {
    label: "Sports",
    badgeBg: "bg-blue-50 ",
    badgeText: "text-blue-700 ",
    borderColor: "border-blue-200/80 ",
    icon: Trophy,
    gradient: "from-blue-500/15 via-cyan-500/10 to-transparent",
  },
  cultural: {
    label: "Cultural",
    badgeBg: "bg-purple-50 ",
    badgeText: "text-purple-700 ",
    borderColor: "border-purple-200/80 ",
    icon: Palette,
    gradient: "from-purple-500/15 via-amber-500/10 to-transparent",
  },
  educational: {
    label: "Educational",
    badgeBg: "bg-teal-50 ",
    badgeText: "text-teal-700 ",
    borderColor: "border-teal-200/80 ",
    icon: GraduationCap,
    gradient: "from-teal-500/15 via-emerald-500/10 to-transparent",
  },
  business: {
    label: "Business",
    badgeBg: "bg-amber-50 ",
    badgeText: "text-amber-700 ",
    borderColor: "border-amber-200/80 ",
    icon: Briefcase,
    gradient: "from-amber-500/15 via-orange-500/10 to-transparent",
  },
  other: {
    label: "General",
    badgeBg: "bg-slate-50 ",
    badgeText: "text-slate-700 ",
    borderColor: "border-slate-200 ",
    icon: Layers,
    gradient: "from-slate-500/15 via-slate-600/10 to-transparent",
  },
};

function formatEventDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "TBD";
  }
}

function formatTime(d: string) {
  try {
    return new Date(d).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

interface Props {
  event: Event;
  onAttend: (eventId: string) => void;
  attendPending?: boolean;
  /** Immersive full card vs compact feed card */
  variant?: "immersive" | "feed";
}

export default function EventCard({
  event,
  onAttend,
  attendPending,
  variant = "immersive",
}: Props) {
  const queryClient = useQueryClient();
  const [showEli5, setShowEli5] = useState(false);

  const isCancelled = event.status === "cancelled";
  const isCompleted = event.status === "completed";
  const attendeeCount = event.attendeesCount ?? event.attendees;
  const eventId = event.id ?? (event as any)._id;
  const startDate = event.startDate;

  const prefetchDetail = useCallback(() => {
    if (eventId) void prefetchEventDetail(queryClient, String(eventId));
  }, [eventId, queryClient]);

  const typeConfig = TYPE_CONFIG[event.type] || TYPE_CONFIG.other;
  const TypeIcon = typeConfig.icon;

  return (
    <article
      className={`group relative mx-auto w-full overflow-hidden rounded-3xl border border-black/[0.08]  bg-white  shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex flex-col ${
        isCancelled ? "ring-2 ring-rose-500/50" : ""
      }`}
    >
      {/* ── Top Media Banner ── */}
      <div className="relative w-full h-48 sm:h-56 bg-slate-900 overflow-hidden">
        {event.coverImage ? (
          <>
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 100vw, 640px"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/40" />
          </>
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${typeConfig.gradient} bg-slate-900 flex items-center justify-center`}
          >
            <div className="h-24 w-24 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
              <TypeIcon size={40} className="text-white/60" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
        )}

        {/* Top Badges Floating Bar */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Pill */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.borderColor}`}
            >
              <TypeIcon size={12} strokeWidth={2.5} />
              <span>{typeConfig.label}</span>
            </span>

            {/* Price Pill */}
            {event.isFree ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
                Free
              </span>
            ) : event.ticketPrice != null ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm">
                {formatNaira(event.ticketPrice)}
              </span>
            ) : null}

            {/* Boosted Chip */}
            {(event as any).isBoosted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-900 shadow-sm uppercase tracking-wider">
                <Zap size={10} className="fill-current" /> Boosted
              </span>
            )}

            {/* Cancelled Chip */}
            {isCancelled && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-sm">
                <AlertTriangle size={12} /> Cancelled
              </span>
            )}
          </div>

          {/* ELI5 Info Button */}
          <button
            type="button"
            onClick={() => setShowEli5(!showEli5)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white transition-transform active:scale-90"
            title="Explain Like I'm 5"
            aria-label="Explain this event"
          >
            <HelpCircle size={15} />
          </button>
        </div>

        {/* Floating Date Badge on Cover Bottom */}
        <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/90 text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
            <Calendar size={13} className="text-[#00B82E]" />
            <span>{formatEventDate(startDate)}</span>
            <span className="text-white/40">·</span>
            <Clock size={13} className="text-white/70" />
            <span>{formatTime(startDate)}</span>
          </div>

          {typeof attendeeCount === "number" && (
            <div className="flex items-center gap-1.5 text-white/90 text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Users size={13} className="text-[#00B82E]" />
              <span>
                {attendeeCount}
                {event.capacity ? `/${event.capacity}` : ""} going
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── ELI5 Explanation Banner (Collapsible) ── */}
      {showEli5 && (
        <div className="bg-emerald-50  border-b border-emerald-100  p-3.5 flex items-start gap-2.5 text-xs text-emerald-900 ">
          <HelpCircle size={16} className="text-[#00B82E] shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">What is this? </span>
            This is an organized neighborhood event. Tapping{" "}
            <strong>"Attend"</strong> informs the host you are coming so they
            can reserve seating, refreshments, or materials for you.
          </div>
          <button
            type="button"
            onClick={() => setShowEli5(false)}
            className="text-xs font-bold text-emerald-700 hover:underline shrink-0"
          >
            Got it
          </button>
        </div>
      )}

      {/* ── Card Body & Details ── */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-2">
          <Link
            href={`/events/${eventId}`}
            onMouseEnter={prefetchDetail}
            onFocus={prefetchDetail}
            className="block text-slate-900  font-black text-lg sm:text-xl leading-snug line-clamp-2 hover:text-[#00B82E]  transition-colors"
          >
            {event.title}
          </Link>

          {/* Venue Location Chip */}
          {event.venue && (
            <div className="flex items-center gap-1.5 text-slate-600  text-xs font-semibold">
              <MapPin size={14} className="text-rose-500 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}

          {event.description && (
            <p className="text-slate-600  text-xs leading-relaxed line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        {/* ── BC.Game Tactile Action Footer ── */}
        <div className="pt-2 border-t border-black/[0.06]  flex items-center justify-between gap-3">
          {/* Details Link */}
          <Link
            href={`/events/${eventId}`}
            onMouseEnter={prefetchDetail}
            onFocus={prefetchDetail}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700  hover:text-[#00B82E] transition-colors px-2 py-1.5 rounded-xl hover:bg-slate-100 "
          >
            <span>View Details</span>
            <ArrowRight size={14} />
          </Link>

          {/* RSVP Tactile Button */}
          {!isCancelled && !isCompleted && (
            <button
              type="button"
              onClick={() => onAttend(eventId)}
              disabled={attendPending}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
                event.isAttending
                  ? "bg-emerald-100  text-emerald-800  border border-emerald-300  hover:bg-emerald-200"
                  : "bg-[#00B82E] hover:bg-[#00B82E] text-white shadow-md shadow-[#00B82E]/20 font-black"
              }`}
            >
              {event.isAttending ? (
                <>
                  <CheckCircle2 size={14} className="text-[#00B82E]" />
                  <span>Going</span>
                </>
              ) : (
                <>
                  <span>Attend</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
