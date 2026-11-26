"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";
import { LocalHuudHubPrimaryAction } from "@/components/local-huud/LocalHuudHubHeader";
import { ChipRow, FilterChip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import EventCard from "@/components/events/EventCard";
import { useMyEvents, useMyOrganizedEvents, useAttendEvent, useBoostEvent } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { useStarted } from "@/hooks/useStarted";
import { BoostModal } from "@/components/gamification/BoostModal";
import { useInView } from "react-intersection-observer";

type Tab = "attending" | "organizing";

export default function MyEventsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const started = useStarted();
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

  // Who you are is known only on the phone: wait, so the first draw matches the pre-built page.
  if (!started || authLoading || !user) return null;

  return (
    <>
      <LocalHuudSubpageShell hubId="events" action={<LocalHuudHubPrimaryAction href="/events/create" label="Create event" />}>
        <ChipRow label="My events">
          {(["attending", "organizing"] as Tab[]).map((x) => (
            <FilterChip
              key={x}
              active={tab === x}
              onClick={() => setTab(x)}
              count={x === "attending" ? attendingList.length : organizingList.length}
            >
              {x === "attending" ? "Going" : "Hosting"}
            </FilterChip>
          ))}
        </ChipRow>

        {activeQuery.isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mod-card rounded-2xl h-48 animate-pulse" style={{ background: "var(--neu-shadow-dark)" }} />
            ))}
          </div>
        )}

        {!activeQuery.isLoading && activeList.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {activeList.map((event: any) => (
              <div key={event.id ?? event._id} className="flex flex-col gap-2">
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
                    className="tap-target inline-flex min-h-10 items-center justify-center gap-1 rounded-full bg-amber-soft px-3 text-[13px] font-bold text-amber-ink transition-colors hover:bg-amber-soft/70"
                  >
                    🚀 Boost
                    {event.isBoosted && event.boostedUntil && (
                      <span className="ml-1 opacity-80">· active</span>
                    )}
                  </button>
                )}
              </div>
            ))}

            {activeQuery.hasNextPage && (
              <div ref={loadMoreRef} className="col-span-full flex justify-center py-4">
                {activeQuery.isFetchingNextPage && (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            )}
          </div>
        )}

        {!activeQuery.isLoading && activeList.length === 0 && (
          <EmptyState
            icon={tab === "attending" ? "🎉" : "📅"}
            title={tab === "attending" ? "You are not going to anything yet" : "You have not hosted an event yet"}
            description={tab === "attending" ? "Find something happening near you and tap I'm going." : "Host a meeting, a party or a clean-up for your area."}
            action={{ label: tab === "attending" ? "See events" : "Create event", href: tab === "attending" ? "/events" : "/events/create" }}
          />
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
