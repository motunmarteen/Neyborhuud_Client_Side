"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import { useMyBookings, useCancelBooking } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { ServiceBooking } from "@/types/api";

const STATUS_STYLES: Record<ServiceBooking["status"], string> = {
  pending: "bg-gray-500/20 text-gray-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const STATUS_LABELS: Record<ServiceBooking["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyBookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyBookings();
  const cancelBooking = useCancelBooking();

  const bookings: ServiceBooking[] =
    data?.pages.flatMap((page) => (page as any).data ?? []) ?? [];

  if (authLoading || !user) return null;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#1a1a2e] border-b border-gray-800">
            <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">My Bookings</h1>
                <p className="text-xs text-gray-400">{bookings.length} bookings</p>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {/* Loading */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-[#1a1a2e] border border-gray-800 rounded-xl p-4">
                    <div className="h-5 bg-gray-800 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-800 rounded w-1/3" />
                  </div>
                ))}
              </div>
            )}

            {/* List */}
            {!isLoading && bookings.length > 0 && (
              <>
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/services/${booking.serviceId}`}
                          className="text-base font-semibold text-white hover:text-blue-400 transition-colors line-clamp-1"
                        >
                          {booking.service?.title ?? "Service"}
                        </Link>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {formatDateTime(booking.date)}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_STYLES[booking.status]}`}
                      >
                        {STATUS_LABELS[booking.status]}
                      </span>
                    </div>

                    {booking.notes && (
                      <p className="text-sm text-gray-400 mt-3 line-clamp-2">{booking.notes}</p>
                    )}

                    {(booking.status === "pending" || booking.status === "confirmed") && (
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <button
                          onClick={() => cancelBooking.mutate({ bookingId: booking.id })}
                          disabled={cancelBooking.isPending}
                          className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {hasNextPage && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-8 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg font-semibold transition-colors text-sm"
                    >
                      {isFetchingNextPage ? "Loading…" : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty */}
            {!isLoading && bookings.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-gray-600 text-6xl">calendar_month</span>
                <h3 className="text-xl font-semibold text-gray-400 mt-4 mb-2">No bookings yet</h3>
                <p className="text-gray-500 mb-6">Find local services and book them</p>
                <Link
                  href="/services"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
                >
                  Browse Services
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
