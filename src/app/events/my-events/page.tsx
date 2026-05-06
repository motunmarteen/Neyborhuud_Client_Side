"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import EventCard from "@/components/events/EventCard";
import { useMyEvents, useMyOrganizedEvents, useAttendEvent } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";

type Tab = "attending" | "organizing";

export default function MyEventsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("attending");
  const attendEvent = useAttendEvent();

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

  if (authLoading || !user) return null;

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
                  <h1 className="text-xl font-bold">My Events</h1>
                </div>
                <Link
                  href="/events/create"
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-semibold"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Create
                </Link>
              </div>

              {/* Tabs */}
              <div className="flex bg-gray-800/50 rounded-xl p-1">
                {(["attending", "organizing"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                      tab === t
                        ? "bg-[#1a1a2e] text-white"
                        : "text-gray-400 hover:text-white"
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
          </div>

          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Loading */}
            {activeQuery.isLoading && (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden">
                    <div className="h-40 bg-gray-800" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-800 rounded w-3/4" />
                      <div className="h-3 bg-gray-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Events */}
            {!activeQuery.isLoading && activeList.length > 0 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeList.map((event: any) => (
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

                {activeQuery.hasNextPage && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => activeQuery.fetchNextPage()}
                      disabled={activeQuery.isFetchingNextPage}
                      className="px-8 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg font-semibold transition-colors"
                    >
                      {activeQuery.isFetchingNextPage ? "Loading…" : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty */}
            {!activeQuery.isLoading && activeList.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-gray-600 text-6xl">
                  {tab === "attending" ? "event_busy" : "calendar_add_on"}
                </span>
                <h3 className="text-xl font-semibold text-gray-400 mt-4 mb-2">
                  {tab === "attending" ? "No events RSVPed" : "No events organised"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {tab === "attending"
                    ? "Browse events and RSVP to ones you're interested in"
                    : "Host your first event for the community"}
                </p>
                <Link
                  href={tab === "attending" ? "/events" : "/events/create"}
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
                >
                  {tab === "attending" ? "Browse Events" : "Create Event"}
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
