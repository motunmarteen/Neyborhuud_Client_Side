"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import { FeedSkyHero } from "@/components/feed/FeedSkyHero";
import EventCard from "@/components/events/EventCard";
import { useNearbyEvents, useAttendEvent } from "@/hooks/useEvents";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useInView } from "react-intersection-observer";

const RADIUS_OPTIONS = [5, 10, 20, 50];

export default function NearbyEventsPage() {
  const router = useRouter();
  const { location, isLoading: geoLoading, error: geoError } = useGeolocation();
  const [radius, setRadius] = useState(10);
  const attendEvent = useAttendEvent();
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const [navHidden, setNavHidden] = useState(false);

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

  return (
    <div className="relative flex h-screen w-full overflow-hidden text-white neu-base">
      <Suspense fallback={<div className="w-64" />}>
        <LeftSidebar />
      </Suspense>

      <main ref={mainRef} className="flex flex-1 flex-col overflow-y-auto scroll-smooth md:snap-y md:snap-proximity">
        <TopNav />

        <div className="flex flex-col pb-20">
          <div className="-mt-[60px]">
            <FeedSkyHero />
          </div>

          <div className="px-4 flex flex-col gap-4 pt-3">
            <div className="mod-card rounded-2xl p-4 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full mod-chip text-slate-700 hover:text-slate-950 transition-colors"
                    aria-label="Go back"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-950">Nearby Events</h1>
                    {location && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Radius selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 shrink-0">Radius:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      className={`shrink-0 text-sm px-4 py-1.5 rounded-xl font-semibold transition-all ${
                        radius === r
                          ? "mod-chip mod-chip-active text-primary"
                          : "mod-chip text-slate-700 hover:text-slate-950"
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Acquiring location */}
            {geoLoading && (
              <div className="mod-card rounded-2xl flex flex-col items-center justify-center py-16 gap-4">
                <span className="material-symbols-outlined text-primary text-5xl animate-pulse">
                  my_location
                </span>
                <p className="text-slate-700 font-semibold">Acquiring your location…</p>
              </div>
            )}

            {/* Geo error */}
            {geoError && !geoLoading && (
              <div className="mod-card rounded-2xl text-center py-16 px-5">
                <span className="material-symbols-outlined text-brand-red text-5xl">location_off</span>
                <p className="text-brand-red mt-4 mb-2 font-semibold">Location access denied</p>
                <p className="text-slate-600 text-sm">
                  Please enable location permissions to see nearby events.
                </p>
              </div>
            )}

            {/* Loading events */}
            {isLoading && location && (
              <div className="flex flex-col gap-5 md:items-center">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-full sm:max-w-[480px] h-[90vh] rounded-none border-y border-white/10 bg-white/5 animate-pulse sm:rounded-[32px] sm:border"
                  >
                    <div className="h-full w-full bg-gradient-to-b from-white/10 to-white/0 sm:rounded-[32px]" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && location && !isLoading && (
              <div className="mod-card rounded-2xl text-center py-12">
                <p className="text-brand-red mb-4 font-semibold">Failed to load nearby events</p>
              </div>
            )}
          </div>

            {/* Events */}
            {!isLoading && !geoLoading && events.length > 0 && (
              <>
                <div
                  className="mt-3 flex flex-col gap-5 pb-4 md:items-center"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015)), radial-gradient(circle at 50% 0%, rgba(0,111,53,0.12), transparent 34%)",
                    backdropFilter: "blur(18px) saturate(150%)",
                    WebkitBackdropFilter: "blur(18px) saturate(150%)",
                  }}
                >
                  {events.map((event: any) => (
                    <div key={event.id ?? event._id} className="w-full md:snap-center">
                      <EventCard
                        event={event}
                        onAttend={(eventId) =>
                          attendEvent.mutate({
                            eventId,
                            attending: !!event.isAttending,
                          })
                        }
                        attendPending={attendEvent.isPending}
                      />
                    </div>
                  ))}
                </div>

                {hasNextPage && (
                  <div ref={loadMoreRef} className="flex justify-center py-4">
                    {isFetchingNextPage && (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                )}
              </>
            )}

            {/* Empty */}
            {!isLoading && !geoLoading && !geoError && location && events.length === 0 && (
              <div className="mx-4 mod-card rounded-2xl px-5 py-14 text-center">
                <span className="material-symbols-outlined text-white/35 text-6xl">
                  event_busy
                </span>
                <h3 className="text-xl font-bold text-white/90 mt-4 mb-2">
                  No events within {radius} km
                </h3>
                <p className="text-white/60 mb-4">Try increasing the radius</p>
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
        </div>
      </main>

      <RightSidebar />

      <div className="md:hidden">
        <Suspense fallback={<div className="h-16" />}>
          <BottomNav hidden={navHidden} />
        </Suspense>
      </div>
    </div>
  );
}
