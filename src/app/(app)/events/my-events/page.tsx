"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";
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

  if (authLoading || !user) return null;

  return (
    <>
      <LocalHuudSubpageShell hubId="events">
        <div className="mod-card rounded-2xl p-4 space-y-4">
          <div className="flex justify-end">
            <Link
              href="/events/create"
              className="shrink-0 flex items-center gap-1 text-xs px-3 py-2 rounded-xl mod-chip mod-chip-active text-primary font-semibold"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Create
            </Link>
          </div>

          <div className="flex gap-2 rounded-2xl p-1 mod-inset">
            {(["attending", "organizing"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                  tab === t ? "mod-chip mod-chip-active text-primary" : "mod-chip"
                }`}
              >
                {t}
                {t === "attending" && attendingList.length > 0 && (
                  <span className="ml-1.5 bg-brand-blue text-white text-xs px-1.5 py-0.5 rounded-full">
                    {attendingList.length}
                  </span>
                )}
                {t === "organizing" && organizingList.length > 0 && (
                  <span className="ml-1.5 bg-brand-blue text-white text-xs px-1.5 py-0.5 rounded-full">
                    {organizingList.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeQuery.isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mod-card rounded-2xl h-48 animate-pulse" style={{ background: "var(--neu-shadow-dark)" }} />
            ))}
          </div>
        )}

        {!activeQuery.isLoading && activeList.length > 0 && (
          <div className="space-y-3">
            {activeList.map((event: any) => (
              <div key={event.id ?? event._id} className="relative">
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
                    className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 rounded-full border border-status-warning/30 bg-primary/25 px-3 py-1.5 text-xs font-bold text-status-warning/90 shadow-lg backdrop-blur-md transition-all hover:bg-primary/35"
                  >
                    Boost
                    {event.isBoosted && event.boostedUntil && (
                      <span className="ml-1 opacity-80">· active</span>
                    )}
                  </button>
                )}
              </div>
            ))}

            {activeQuery.hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {activeQuery.isFetchingNextPage && (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            )}
          </div>
        )}

        {!activeQuery.isLoading && activeList.length === 0 && (
          <div className="mod-card rounded-2xl px-5 py-14 text-center">
            <span className="material-symbols-outlined text-6xl" style={{ color: "var(--neu-text-muted)" }}>
              {tab === "attending" ? "event_busy" : "calendar_add_on"}
            </span>
            <h3 className="text-xl font-bold mt-4 mb-2" style={{ color: "var(--neu-text)" }}>
              {tab === "attending" ? "No events RSVPed" : "No events organised"}
            </h3>
            <p className="mb-6" style={{ color: "var(--neu-text-muted)" }}>
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
      </LocalHuudSubpageShell>

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
    </>
  );
}
