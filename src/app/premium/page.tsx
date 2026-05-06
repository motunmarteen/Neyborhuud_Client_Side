"use client";

import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import { PremiumCards } from "@/components/PremiumCards";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentHistory } from "@/hooks/usePayments";
import { Payment } from "@/types/api";

const TYPE_LABELS: Record<string, string> = {
  listing_boost: "Listing Boost",
  premium_subscription: "Premium Subscription",
  event_ticket: "Event Ticket",
  marketplace_purchase: "Marketplace Purchase",
  service_payment: "Service Payment",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400",
  processing: "text-blue-400",
  completed: "text-green-400",
  failed: "text-red-400",
  refunded: "text-gray-400",
};

export default function PremiumPage() {
  const { user } = useAuth();
  const currentTier = (user?.gamification?.tier as string | undefined) ?? "free";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    usePaymentHistory();
  const payments = data?.pages.flatMap((p) => p.payments) ?? [];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          {/* Page header */}
          <div className="sticky top-0 z-10 bg-[#1a1a2e] border-b border-gray-800 px-4 py-4">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-2xl font-bold">Go Premium</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Unlock the full power of NeyborHuud
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
            {/* Tier cards */}
            <PremiumCards currentTier={currentTier} />

            {/* Current plan card — shown below tier grid per spec */}
            <div className="rounded-2xl border border-gray-700 bg-[#1a1a2e] px-6 py-4 flex items-center gap-4">
              <span className="material-symbols-outlined text-3xl text-yellow-400">
                workspace_premium
              </span>
              <div>
                <p className="text-sm text-gray-400">Your current plan</p>
                <p className="text-lg font-bold capitalize text-white">
                  {currentTier}
                </p>
              </div>
              <div className="ml-auto text-sm text-gray-500">
                Tier updates after successful payment
              </div>
            </div>

            {/* Payment history */}
            <div>
              <h2 className="text-lg font-bold mb-4">Payment History</h2>

              {isLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 bg-[#1a1a2e] rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              )}

              {!isLoading && payments.length === 0 && (
                <p className="text-gray-500 py-8 text-center">
                  No payments yet.
                </p>
              )}

              {!isLoading && payments.length > 0 && (
                <div className="rounded-2xl border border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#1a1a2e] border-b border-gray-700">
                      <tr>
                        <th className="text-left px-4 py-3 text-gray-400 font-semibold">
                          Type
                        </th>
                        <th className="text-left px-4 py-3 text-gray-400 font-semibold">
                          Amount
                        </th>
                        <th className="text-left px-4 py-3 text-gray-400 font-semibold">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-gray-400 font-semibold">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {payments.map((p: Payment) => (
                        <tr
                          key={p.id ?? p.reference}
                          className="bg-[#0f0f1e] hover:bg-[#1a1a2e] transition-colors"
                        >
                          <td className="px-4 py-3 text-white">
                            {TYPE_LABELS[p.type] ?? p.type}
                          </td>
                          <td className="px-4 py-3 font-semibold text-white">
                            {p.currency} {p.amount.toLocaleString()}
                          </td>
                          <td
                            className={`px-4 py-3 font-semibold capitalize ${STATUS_COLORS[p.status] ?? "text-gray-300"}`}
                          >
                            {p.status}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {hasNextPage && (
                    <div className="p-4 text-center bg-[#1a1a2e]">
                      <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-60 rounded-lg text-sm transition-colors"
                      >
                        {isFetchingNextPage ? "Loading…" : "Load More"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
