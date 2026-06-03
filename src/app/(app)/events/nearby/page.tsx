"use client";

import { useEffect, useState } from "react";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";
import EventCard from "@/components/events/EventCard";
import { useNearbyEvents, useAttendEvent } from "@/hooks/useEvents";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useInView } from "react-intersection-observer";

const RADIUS_OPTIONS = [5, 10, 20, 50];

export default function NearbyEventsPage() {
  const { location, isLoading: geoLoading, error: geoError } = useGeolocation();
  const [radius, setRadius] = useState(10);
  const attendEvent = useAttendEvent();

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNearbyEvents(location?.latitude ?? null, location?.longitude ?? null, radius);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "400px",
  });

  const events = data?.pages.flatMap((page) => (page as any)?.data?.events ?? []) ?? [];

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <LocalHuudSubpageShell hubId="events">
      <div className="mod-card rounded-2xl p-4 space-y-4">
        {location && (
          <p className="text-xs" style={{ color: "var(--neu-text-muted)" }}>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </p>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold shrink-0" style={{ color: "var(--neu-text-muted)" }}>
            Radius:
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`shrink-0 text-sm px-4 py-1.5 rounded-xl font-semibold transition-all ${
                  radius === r ? "mod-chip mod-chip-active text-primary" : "mod-chip"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {geoLoading && (
        <div className="mod-card rounded-2xl flex flex-col items-center justify-center py-16 gap-4">
          <span className="material-symbols-outlined text-primary text-5xl animate-pulse">my_location</span>
          <p className="font-semibold" style={{ color: "var(--neu-text-muted)" }}>Acquiring your location…</p>
        </div>
      )}

      {geoError && !geoLoading && (
        <div className="mod-card rounded-2xl text-center py-16 px-5">
          <span className="material-symbols-outlined text-brand-red text-5xl">location_off</span>
          <p className="text-brand-red mt-4 mb-2 font-semibold">Location access denied</p>
          <p className="text-sm" style={{ color: "var(--neu-text-muted)" }}>
            Please enable location permissions to see nearby events.
          </p>
        </div>
      )}

      {isLoading && location && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mod-card rounded-2xl h-48 animate-pulse" style={{ background: "var(--neu-shadow-dark)" }} />
          ))}
        </div>
      )}

      {error && location && !isLoading && (
        <div className="mod-card rounded-2xl text-center py-12">
          <p className="text-brand-red font-semibold">Failed to load nearby events</p>
        </div>
      )}

      {!isLoading && !geoLoading && events.length > 0 && (
        <div className="space-y-3">
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
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingNextPage && (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          )}
        </div>
      )}

      {!isLoading && !geoLoading && !geoError && location && events.length === 0 && (
        <div className="mod-card rounded-2xl px-5 py-14 text-center">
          <span className="material-symbols-outlined text-6xl" style={{ color: "var(--neu-text-muted)" }}>
            event_busy
          </span>
          <h3 className="text-xl font-bold mt-4 mb-2" style={{ color: "var(--neu-text)" }}>
            No events within {radius} km
          </h3>
          <p className="mb-4" style={{ color: "var(--neu-text-muted)" }}>Try increasing the radius</p>
          {radius < 50 && (
            <button
              onClick={() => setRadius((r) => Math.min(r * 2, 50))}
              className="px-6 py-2.5 rounded-xl mod-chip mod-chip-active text-primary font-semibold transition-colors"
            >
              Expand to {Math.min(radius * 2, 50)} km
            </button>
          )}
        </div>
      )}
    </LocalHuudSubpageShell>
  );
}
