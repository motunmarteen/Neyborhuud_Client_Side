"use client";

/**
 * EventCard — an event as a BrowseTile: cover photo, date and time, venue, price,
 * how many are going, and "I'm going".
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Event } from "@/types/api";
import { prefetchEventDetail } from "@/hooks/useEvents";
import { formatNaira } from "@/lib/currency";
import { BrowseTile } from "@/components/feed/BrowseTile";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";

const TYPE: Record<Event["type"], { label: string; icon: string }> = {
  community: { label: "Community", icon: "🤝" },
  social: { label: "Social", icon: "🎉" },
  sports: { label: "Sports", icon: "⚽" },
  cultural: { label: "Cultural", icon: "🥁" },
  educational: { label: "Learning", icon: "📚" },
  business: { label: "Business", icon: "💼" },
  other: { label: "Event", icon: "📅" },
};

function formatWhen(d: string) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  const day = date.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
  const time = date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}

interface Props {
  event: Event;
  onAttend: (eventId: string) => void;
  attendPending?: boolean;
}

export default function EventCard({ event, onAttend, attendPending }: Props) {
  const queryClient = useQueryClient();
  const isCancelled = event.status === "cancelled";
  const isCompleted = event.status === "completed";
  const attendeeCount = event.attendeesCount ?? event.attendees;
  const eventId = event.id ?? (event as any)._id;
  const type = TYPE[event.type] || TYPE.other;

  const prefetchDetail = useCallback(() => {
    if (eventId) void prefetchEventDetail(queryClient, String(eventId));
  }, [eventId, queryClient]);

  const going =
    typeof attendeeCount === "number"
      ? `${attendeeCount}${event.capacity ? ` of ${event.capacity}` : ""} going`
      : undefined;

  return (
    <BrowseTile
      href={`/events/${eventId}`}
      kind="event"
      title={event.title}
      images={event.coverImage ? [event.coverImage] : []}
      placeholder={type.icon}
      status={isCancelled ? "Cancelled" : isCompleted ? "Ended" : undefined}
      highlight={<span className="text-[15px] text-[#5E3BB8]">{formatWhen(event.startDate)}</span>}
      byline={event.venue || undefined}
      chips={
        <>
          {event.isFree ? (
            <Chip tone="green">Free</Chip>
          ) : event.ticketPrice != null ? (
            <Chip tone="purple">{formatNaira(event.ticketPrice)}</Chip>
          ) : null}
          {(event as any).isBoosted ? <Chip tone="amber" icon="🚀">Boosted</Chip> : null}
          <Chip>{type.label}</Chip>
        </>
      }
      meta={going}
      onOpenIntent={prefetchDetail}
      footer={
        !isCancelled && !isCompleted ? (
          <Button
            size="sm"
            fullWidth
            variant={event.isAttending ? "soft" : "primary"}
            disabled={attendPending}
            onClick={() => onAttend(eventId)}
            aria-pressed={!!event.isAttending}
          >
            {event.isAttending ? "✓ Going" : "I'm going"}
          </Button>
        ) : undefined
      }
    />
  );
}
