"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import EventCard from "@/components/events/EventCard";
import { useNearbyEvents, useAttendEvent } from "@/hooks/useEvents";
import { useGeolocation } from "@/hooks/useGeolocation";

const RADIUS_OPTIONS = [5, 10, 20, 50];

export default function NearbyEventsPage() {
  const router = useRouter();
  const { location, isLoading: geoLoading, error: geoError } = useGeolocation();
  const [radius, setRadius] = useState(10);
  const attendEvent = useAttendEvent();

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNearbyEvents(location?.latitude ?? null, location?.longitude ?? null, radius);

  const events = data?.pages.flatMap((page) => (page as any)?.data?.events ?? []) ?? [];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 min-h-0 overflow-y-auto pb-20 bg-[#0f0f1e] text-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#1a1a2e] border-b border-gray-800">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                  <div>
                    <h1 className="text-xl font-bold">Nearby Events</h1>
                    {location && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Radius selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 shrink-0">Radius:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      className={`shrink-0 text-sm px-3 py-1 rounded-full transition-colors ${
                        radius === r
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Acquiring location */}
            {geoLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <span className="material-symbols-outlined text-blue-400 text-5xl animate-pulse">
                  my_location
                </span>
                <p className="text-gray-400">Acquiring your location…</p>
              </div>
            )}

            {/* Geo error */}
            {geoError && !geoLoading && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-red-400 text-5xl">location_off</span>
                <p className="text-red-400 mt-4 mb-2">Location access denied</p>
                <p className="text-gray-500 text-sm">
                  Please enable location permissions to see nearby events.
                </p>
              </div>
            )}

            {/* Loading events */}
            {isLoading && location && (
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
            {error && location && !isLoading && (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">Failed to load nearby events</p>
              </div>
            )}

            {/* Events */}
            {!isLoading && !geoLoading && events.length > 0 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
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

            {/* Empty */}
            {!isLoading && !geoLoading && !geoError && location && events.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-gray-600 text-6xl">
                  event_busy
                </span>
                <h3 className="text-xl font-semibold text-gray-400 mt-4 mb-2">
                  No events within {radius} km
                </h3>
                <p className="text-gray-500 mb-4">Try increasing the radius</p>
                {radius < 50 && (
                  <button
                    onClick={() => setRadius((r) => Math.min(r * 2, 50))}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                  >
                    Expand to {Math.min(radius * 2, 50)} km
                  </button>
                )}
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
