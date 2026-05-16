"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import { FeedSkyHero } from "@/components/feed/FeedSkyHero";
import EventCard from "@/components/events/EventCard";
import EventFilters, { EventsFilterState } from "@/components/events/EventFilters";
import { useEvents, useAttendEvent } from "@/hooks/useEvents";
import { useInView } from "react-intersection-observer";

const DEFAULT_FILTERS: EventsFilterState = { type: "All", date: "All" };

export default function EventsPage() {
  const [filters, setFilters] = useState<EventsFilterState>(DEFAULT_FILTERS);
  const attendEvent = useAttendEvent();
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const [navHidden, setNavHidden] = useState(false);

  // Strip "All" before API call
  const apiFilter: Record<string, string> = {};
  if (filters.type !== "All") apiFilter.type = filters.type;
  if (filters.date !== "All") apiFilter.date = filters.date;

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useEvents(apiFilter);

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

  function handleFilterChange(key: keyof EventsFilterState, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

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
              <div className="flex items-center justify-between mb-3 gap-3">
                <h1 className="text-2xl font-black tracking-tight">Events</h1>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <Link
                    href="/events/nearby"
                    className="shrink-0 text-xs px-3 py-2 rounded-xl mod-btn text-slate-700 hover:text-slate-950 transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">near_me</span>
                      Nearby
                    </span>
                  </Link>
                  <Link
                    href="/events/my-events"
                    className="shrink-0 text-xs px-3 py-2 rounded-xl mod-btn text-slate-700 hover:text-slate-950 transition-colors"
                  >
                    My Events
                  </Link>
                  <Link
                    href="/events/create"
                    className="shrink-0 flex items-center gap-1 text-xs px-3 py-2 rounded-xl mod-btn-active text-primary font-semibold"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Create Event
                  </Link>
                </div>
              </div>
              <EventFilters filters={filters} onChange={handleFilterChange} />
            </div>

            {/* Loading skeletons */}
            {isLoading && (
              <div className="flex flex-col gap-5 md:items-center">
                {[1, 2].map((i) => (
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
            {error && !isLoading && (
              <div className="mod-card rounded-2xl px-5 py-12 text-center">
                <p className="text-red-300 mb-4">Failed to load events</p>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-2.5 rounded-xl mod-btn text-white/90 hover:text-white transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Event immersive feed */}
          {!isLoading && events.length > 0 && (
            <div
              className="mt-3 flex flex-col gap-5 pb-4 md:items-center"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015)), radial-gradient(circle at 50% 0%, rgba(0,135,81,0.12), transparent 34%)",
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
          )}

          {/* Infinite trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingNextPage && (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && events.length === 0 && (
            <div className="mx-4 mod-card rounded-2xl px-5 py-14 text-center">
              <span className="material-symbols-outlined text-5xl text-white/35">event</span>
              <h3 className="text-xl font-bold mt-4 mb-2 text-white/90">No events found</h3>
              <p className="text-white/60 mb-6">Be the first to create one in your area</p>
              <Link
                href="/events/create"
                className="inline-block px-6 py-2.5 rounded-xl mod-btn-active text-primary font-semibold"
              >
                Create Event
              </Link>
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
