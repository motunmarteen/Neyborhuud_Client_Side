"use client";

import { useState } from "react";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import EventCard from "@/components/events/EventCard";
import EventFilters, { EventsFilterState } from "@/components/events/EventFilters";
import { useEvents, useAttendEvent } from "@/hooks/useEvents";

const DEFAULT_FILTERS: EventsFilterState = { type: "All", date: "All" };

export default function EventsPage() {
  const [filters, setFilters] = useState<EventsFilterState>(DEFAULT_FILTERS);
  const attendEvent = useAttendEvent();

  // Strip "All" before API call
  const apiFilter: Record<string, string> = {};
  if (filters.type !== "All") apiFilter.type = filters.type;
  if (filters.date !== "All") apiFilter.date = filters.date;

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useEvents(apiFilter);

  const events = data?.pages.flatMap((page) => (page as any).data ?? []) ?? [];

  function handleFilterChange(key: keyof EventsFilterState, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#1a1a2e] border-b border-gray-800 backdrop-blur-md bg-opacity-95">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl font-bold">Events</h1>
                <div className="flex gap-2">
                  <Link
                    href="/events/my-events"
                    className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
                  >
                    My Events
                  </Link>
                  <Link
                    href="/events/create"
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-semibold"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Create Event
                  </Link>
                </div>
              </div>
              <EventFilters filters={filters} onChange={handleFilterChange} />
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Loading skeletons */}
            {isLoading && (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden"
                  >
                    <div className="h-40 bg-gray-800" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-800 rounded w-3/4" />
                      <div className="h-3 bg-gray-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">Failed to load events</p>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Event grid */}
            {!isLoading && events.length > 0 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  {events.map((event: any) => (
                    <EventCard
                      key={event.id}
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

                {hasNextPage && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-8 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg font-semibold transition-colors"
                    >
                      {isFetchingNextPage ? "Loading…" : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {!isLoading && !error && events.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-gray-600 text-6xl">event</span>
                <h3 className="text-xl font-semibold text-gray-400 mt-4 mb-2">No events found</h3>
                <p className="text-gray-500 mb-6">Be the first to create one in your area</p>
                <Link
                  href="/events/create"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
                >
                  Create Event
                </Link>
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
