"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { AppBrowseLayout } from "@/components/layout/AppBrowseLayout";
import { BrowseEmptyState } from "@/components/layout/BrowseEmptyState";
import {
  LocalHuudHubHeader,
  LocalHuudHubPrimaryAction,
} from "@/components/local-huud/LocalHuudHubHeader";
import EventCard from "@/components/events/EventCard";
import EventFilters, { EventsFilterState } from "@/components/events/EventFilters";
import { useEvents, useAttendEvent } from "@/hooks/useEvents";

const DEFAULT_FILTERS: EventsFilterState = { type: "All", date: "All" };

export default function EventsPage() {
  const [filters, setFilters] = useState<EventsFilterState>(DEFAULT_FILTERS);
  const attendEvent = useAttendEvent();

  const apiFilter: Record<string, string> = {};
  if (filters.type !== "All") apiFilter.type = filters.type;
  if (filters.date !== "All") apiFilter.date = filters.date;

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useEvents(apiFilter);

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0, rootMargin: "400px" });

  const events = data?.pages.flatMap((page) => (page as any)?.data?.events ?? []) ?? [];

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <LocalHuudHubHeader
          hubId="events"
          toolbar={
            <div className="space-y-3">
              <div className="flex justify-end">
                <LocalHuudHubPrimaryAction href="/events/create" label="Create event" />
              </div>
              <EventFilters
                filters={filters}
                onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
              />
            </div>
          }
        />
      }
    >
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="mod-card h-80 animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <BrowseEmptyState
          icon="event_busy"
          title="Failed to load events"
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="mod-chip rounded-xl px-5 py-2.5 text-sm font-bold"
              style={{ color: "var(--neu-text)" }}
            >
              Try again
            </button>
          }
        />
      )}

      {!isLoading && events.length > 0 && (
        <div className="space-y-4">
          {events.map((event: any) => (
            <EventCard
              key={event.id ?? event._id}
              event={event}
              onAttend={(eventId) =>
                attendEvent.mutate({
                  eventId,
                  attending: !!event.isAttending,
                })
              }
              attendPending={attendEvent.isPending}
            />
          ))}
        </div>
      )}

      {hasNextPage ? (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isFetchingNextPage ? (
            <span className="text-sm text-[var(--neu-text-muted)]">Loading more…</span>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !error && events.length === 0 && (
        <BrowseEmptyState
          icon="event"
          title="No events found"
          description="Be the first to create a gathering in your Huud."
          action={
            <Link
              href="/events/create"
              className="mod-chip mod-chip-active inline-flex rounded-xl px-5 py-2.5 text-sm font-bold text-primary no-underline"
            >
              Create event
            </Link>
          }
        />
      )}
    </AppBrowseLayout>
  );
}
