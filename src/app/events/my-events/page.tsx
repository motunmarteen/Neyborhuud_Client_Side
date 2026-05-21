"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import { FeedSkyHero } from "@/components/feed/FeedSkyHero";
import EventCard from "@/components/events/EventCard";
import { useMyEvents, useMyOrganizedEvents, useAttendEvent, useBoostEvent } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { BoostModal } from "@/components/gamification/BoostModal";
import { useInView } from "react-intersection-observer";

type Tab = "attending" | "organizing";

export default function MyEventsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("attending");
  const attendEvent = useAttendEvent();
  const boostEvent = useBoostEvent();
  const [boostingEventId, setBoostingEventId] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const [navHidden, setNavHidden] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const attending = useMyEvents();
  const organizing = useMyOrganizedEvents();

  const attendingList =
    attending.data?.pages.flatMap((page) => (page as any)?.data?.events ?? []) ?? [];
  const organizingList =
    organizing.data?.pages.flatMap((page) => (page as any)?.data?.events ?? []) ?? [];

  const activeQuery = tab === "attending" ? attending : organizing;
  const activeList = tab === "attending" ? attendingList : organizingList;
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "400px",
  });

  useEffect(() => {
    if (inView && activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      activeQuery.fetchNextPage();
    }
  }, [inView, activeQuery]);

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

  if (authLoading || !user) return null;

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
                  <h1 className="text-2xl font-black tracking-tight text-slate-950">My Events</h1>
                </div>
                <Link
                  href="/events/create"
                  className="shrink-0 flex items-center gap-1 text-xs px-3 py-2 rounded-xl mod-chip mod-chip-active text-primary font-semibold"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Create
                </Link>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 rounded-2xl p-1 mod-inset">
                {(["attending", "organizing"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                      tab === t
                        ? "mod-chip mod-chip-active text-primary"
                        : "mod-chip text-slate-700 hover:text-slate-950"
                    }`}
                  >
                    {t}
                    {t === "attending" && attendingList.length > 0 && (
                      <span className="ml-1.5 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {attendingList.length}
                      </span>
                    )}
                    {t === "organizing" && organizingList.length > 0 && (
                      <span className="ml-1.5 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {organizingList.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {activeQuery.isLoading && (
              <div className="flex flex-col gap-5 md:items-center">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-full sm:max-w-[480px] h-[90vh] rounded-none border-y border-white/10 bg-white/5 animate-pulse sm:rounded-[32px] sm:border"
                  >
                    <div className="h-full w-full bg-gradient-to-b from-white/10 to-white/0 sm:rounded-[32px]" />
                  </div>
                ))}
              </div>
            )}
          </div>

            {/* Events */}
            {!activeQuery.isLoading && activeList.length > 0 && (
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
                  {activeList.map((event: any) => (
                    <div key={event.id ?? event._id} className="relative w-full md:snap-center">
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
                      {tab === "organizing" && (
                        <button
                          onClick={() => setBoostingEventId(event._id ?? event.id)}
                          className="absolute bottom-[88px] left-5 z-40 flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-primary/25 px-3 py-1.5 text-xs font-bold text-amber-100 shadow-lg backdrop-blur-md transition-all hover:bg-primary/35"
                        >
                          Boost
                          {event.isBoosted && event.boostedUntil && (
                            <span className="ml-1 opacity-80">· active</span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {activeQuery.hasNextPage && (
                  <div ref={loadMoreRef} className="flex justify-center py-4">
                    {activeQuery.isFetchingNextPage && (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                )}
              </>
            )}

            {/* Empty */}
            {!activeQuery.isLoading && activeList.length === 0 && (
              <div className="mx-4 mod-card rounded-2xl px-5 py-14 text-center">
                <span className="material-symbols-outlined text-white/35 text-6xl">
                  {tab === "attending" ? "event_busy" : "calendar_add_on"}
                </span>
                <h3 className="text-xl font-bold text-white/90 mt-4 mb-2">
                  {tab === "attending" ? "No events RSVPed" : "No events organised"}
                </h3>
                <p className="text-white/60 mb-6">
                  {tab === "attending"
                    ? "Browse events and RSVP to ones you're interested in"
                    : "Host your first event for the community"}
                </p>
                <Link
                  href={tab === "attending" ? "/events" : "/events/create"}
                  className="inline-block px-6 py-2.5 rounded-xl mod-chip mod-chip-active text-primary font-semibold"
                >
                  {tab === "attending" ? "Browse Events" : "Create Event"}
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

      {/* Boost event modal */}
      {boostingEventId && (
        <BoostModal
          type="event"
          itemTitle={
            organizingList.find((e: any) => (e._id ?? e.id) === boostingEventId)?.title ?? "Event"
          }
          options={[
            { days: 3, coins: 150, label: "3 Days" },
            { days: 7, coins: 300, label: "7 Days", badge: "Best Value" },
          ]}
          defaultDays={7}
          isPending={boostEvent.isPending}
          alreadyActive={
            organizingList.find((e: any) => (e._id ?? e.id) === boostingEventId)?.isBoosted
          }
          activeUntil={
            organizingList.find((e: any) => (e._id ?? e.id) === boostingEventId)?.boostedUntil
          }
          onConfirm={(days) =>
            boostEvent.mutate({ eventId: boostingEventId, days: days as 3 | 7 })
          }
          onClose={() => setBoostingEventId(null)}
        />
      )}
    </div>
  );
}
