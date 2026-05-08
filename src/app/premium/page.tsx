"use client";

import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import { PremiumCards } from "@/components/PremiumCards";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentHistory, usePaymentStats } from "@/hooks/usePayments";
import { Payment } from "@/types/api";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  listing_boost: "Listing Boost",
  job_boost: "Job Boost",
  service_boost: "Service Boost",
  event_boost: "Event Boost",
  tip_user: "Tip to Neighbour",
  event_ticket: "Event Ticket",
  marketplace_pledge: "Marketplace Pledge",
  service_payment: "Service Payment",
};

const TYPE_ICONS: Record<string, string> = {
  listing_boost: "🏷️",
  job_boost: "💼",
  service_boost: "🔧",
  event_boost: "🎉",
  tip_user: "💸",
  event_ticket: "🎟️",
  marketplace_pledge: "🤝",
  service_payment: "💳",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "text-green-400",
  failed: "text-red-400",
  refunded: "text-amber-400",
};

const TIER_META: Record<string, { icon: string; color: string; label: string }> = {
  bronze:   { icon: "🥉", color: "text-amber-700", label: "Bronze" },
  silver:   { icon: "🥈", color: "text-slate-400", label: "Silver" },
  gold:     { icon: "🥇", color: "text-yellow-400", label: "Gold" },
  platinum: { icon: "💎", color: "text-purple-400", label: "Platinum" },
  free:     { icon: "⭐", color: "text-gray-400",   label: "Starter" },
};

export default function PremiumPage() {
  const { user } = useAuth();
  const currentTier = (user?.gamification?.tier as string | undefined) ?? "free";
  const tierMeta = TIER_META[currentTier] ?? TIER_META.free;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    usePaymentHistory();
  const payments = data?.pages.flatMap((p) => p.payments) ?? [];

  const { data: statsData } = usePaymentStats();
  const stats = statsData as any;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          {/* Page header */}
          <div className="sticky top-0 z-10 bg-[#1a1a2e] border-b border-gray-800 px-4 py-4">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-2xl font-bold">Your Activity Tier</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Earn HuudCoins to level up automatically — no subscription needed.
              </p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
            {/* Tier cards */}
            <PremiumCards currentTier={currentTier} />

            {/* Current tier + stats summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current tier */}
              <div className="rounded-2xl border border-gray-700 bg-[#1a1a2e] px-5 py-4 flex items-center gap-4 col-span-1">
                <span className="text-4xl">{tierMeta.icon}</span>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Current Tier</p>
                  <p className={`text-xl font-black capitalize ${tierMeta.color}`}>
                    {tierMeta.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Upgrades as you earn coins
                  </p>
                </div>
              </div>

              {/* Total coins spent */}
              <div className="rounded-2xl border border-amber-800/40 bg-amber-950/30 px-5 py-4 col-span-1">
                <p className="text-xs text-amber-400 uppercase tracking-wide mb-1">Total Coins Spent</p>
                <p className="text-3xl font-black text-amber-300">
                  🪙 {(stats?.totalSpent ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-amber-600 mt-1">{stats?.totalTransactions ?? 0} transactions</p>
              </div>

              {/* Quick links */}
              <div className="rounded-2xl border border-gray-700 bg-[#1a1a2e] px-5 py-4 col-span-1 flex flex-col gap-2 justify-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Quick Actions</p>
                <Link
                  href="/gamification/wallet"
                  className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                  View Wallet
                </Link>
                <Link
                  href="/gamification/leaderboard"
                  className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">leaderboard</span>
                  Leaderboard
                </Link>
              </div>
            </div>

            {/* Per-type breakdown */}
            {stats?.byType && Object.keys(stats.byType).length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Spend Breakdown</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(stats.byType as Record<string, { coins: number; count: number }>).map(
                    ([type, data]) => (
                      <div
                        key={type}
                        className="rounded-xl border border-gray-800 bg-[#1a1a2e] px-4 py-3 text-center"
                      >
                        <span className="text-2xl">{TYPE_ICONS[type] ?? "🪙"}</span>
                        <p className="text-xs text-gray-400 mt-1 leading-tight">
                          {TYPE_LABELS[type] ?? type}
                        </p>
                        <p className="font-black text-amber-400 mt-1">
                          🪙 {data.coins.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">{data.count}×</p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* HuudCoin spend history */}
            <div>
              <h2 className="text-lg font-bold mb-4">HuudCoin Spend History</h2>

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
                  No HuudCoin spends yet.
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
                          HuudCoins
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
                          <td className="px-4 py-3 font-semibold text-amber-400">
                            🪙 {p.coinsSpent.toLocaleString()}
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
