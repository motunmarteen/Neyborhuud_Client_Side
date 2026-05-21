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

const STATUS_COLORS: Record<ServiceBooking["status"], string> = {
  pending: "var(--neu-text-muted)",
  confirmed: "var(--primary)",
  completed: "var(--primary)",
  cancelled: "var(--brand-red)",
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
    data?.pages.flatMap((page) => {
      const inner = (page as any)?.data;
      return Array.isArray(inner) ? inner : (inner?.data ?? []);
    }) ?? [];

  if (authLoading || !user) return null;

  return (
    <div className="relative flex h-screen w-full overflow-hidden neu-base">
      <LeftSidebar />
      <main className="flex flex-col flex-1 overflow-y-auto">
        <TopNav />
        <div className="flex flex-col pb-20">
          {/* Header */}
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full mod-chip transition-all"
                style={{ color: "var(--neu-text-muted)" }}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--neu-text)" }}>My Bookings</h1>
                <p className="text-xs" style={{ color: "var(--neu-text-muted)" }}>{bookings.length} bookings</p>
              </div>
            </div>
          </div>

          <div className="px-4 space-y-3">
            {/* Loading */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mod-card rounded-xl p-4 animate-pulse">
                    <div className="h-5 rounded w-2/3 mb-2" style={{ background: "var(--neu-shadow-dark)" }} />
                    <div className="h-3 rounded w-1/3" style={{ background: "var(--neu-shadow-dark)" }} />
                  </div>
                ))}
              </div>
            )}

            {/* List */}
            {!isLoading && bookings.map((booking) => (
              <div key={booking.id} className="mod-card rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/services/${booking.serviceId}`}
                      className="text-base font-semibold line-clamp-1 hover:underline transition-colors"
                      style={{ color: "var(--neu-text)" }}
                    >
                      {booking.service?.title ?? "Service"}
                    </Link>
                    <p className="text-sm mt-0.5" style={{ color: "var(--neu-text-muted)" }}>
                      {formatDateTime(booking.date)}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 mod-inset"
                    style={{ color: STATUS_COLORS[booking.status] }}
                  >
                    {STATUS_LABELS[booking.status]}
                  </span>
                </div>

                {booking.notes && (
                  <p className="text-sm mt-3 line-clamp-2" style={{ color: "var(--neu-text-muted)" }}>{booking.notes}</p>
                )}

                {(booking.status === "pending" || booking.status === "confirmed") && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--neu-shadow-dark)" }}>
                    <button
                      onClick={() => cancelBooking.mutate({ bookingId: booking.id })}
                      disabled={cancelBooking.isPending}
                      className="text-sm font-semibold transition-all disabled:opacity-50"
                      style={{ color: "var(--brand-red)" }}
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Load more */}
            {hasNextPage && (
              <div className="text-center pt-2 pb-4">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-3 mod-chip disabled:opacity-50 rounded-xl font-semibold transition-all text-sm"
                  style={{ color: "var(--neu-text)" }}
                >
                  {isFetchingNextPage ? "Loading…" : "Load More"}
                </button>
              </div>
            )}

            {/* Empty */}
            {!isLoading && bookings.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "var(--neu-text-muted)" }}>calendar_month</span>
                <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--neu-text)" }}>No bookings yet</h3>
                <p className="mb-6" style={{ color: "var(--neu-text-muted)" }}>Find local services and book them</p>
                <Link
                  href="/services"
                  className="inline-block px-6 py-3 mod-chip mod-chip-active text-primary rounded-xl font-semibold transition-all"
                >
                  Browse Services
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <RightSidebar />
      <BottomNav />
    </div>
  );
}
