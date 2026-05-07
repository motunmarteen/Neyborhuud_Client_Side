"use client";

import { useState } from "react";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import { useWallet, useTransactions } from "@/hooks/useGamification";

type TxType = "all" | "earned" | "spent";

const TX_ICONS: Record<string, string> = {
  check_in: "today",
  badge_earned: "military_tech",
  achievement_claimed: "emoji_events",
  post_created: "edit_note",
  comment_posted: "comment",
  help_given: "volunteer_activism",
  marketplace_sale: "storefront",
  referral: "group_add",
  spent: "shopping_cart",
  redeemed: "redeem",
  bonus: "star",
};

function txIcon(type: string) {
  return TX_ICONS[type] ?? "paid";
}

function txColor(amount: number) {
  return amount >= 0 ? "text-yellow-400" : "text-red-400";
}

function txBg(amount: number) {
  return amount >= 0
    ? "bg-yellow-500/15 text-yellow-400"
    : "bg-red-500/15 text-red-400";
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function EarnRow({ icon, label, amount }: { icon: string; label: string; amount: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2">
      <span
        className="material-symbols-outlined text-[16px] text-purple-400 shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <p className="flex-1 text-xs text-gray-300 truncate">{label}</p>
      <span className="text-xs font-bold text-yellow-400 shrink-0">{amount}</span>
    </div>
  );
}

export default function WalletPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<TxType>("all");

  const wallet = useWallet();
  const txQuery = useTransactions(page);

  const walletData = (wallet.data as any) ?? null;
  const balance: number = walletData?.balance ?? walletData?.huudCoins ?? walletData?.totalHuudCoins ?? 0;
  const totalEarned: number = walletData?.totalEarned ?? 0;
  const totalSpent: number = walletData?.totalSpent ?? 0;

  const allTxs: any[] = txQuery.data?.transactions ?? [];
  const totalPages: number = txQuery.data?.totalPages ?? 1;

  const displayedTxs =
    filter === "earned"
      ? allTxs.filter((t) => (t.amount ?? 0) > 0)
      : filter === "spent"
      ? allTxs.filter((t) => (t.amount ?? 0) < 0)
      : allTxs;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />

        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#1a1a2e] border-b border-gray-800 backdrop-blur-md bg-opacity-95">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/gamification"
                  className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  aria-label="Back to Gamification"
                >
                  <span className="material-symbols-outlined text-[20px] text-gray-400">arrow_back</span>
                </Link>
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <span>🪙</span> HuudCoins Wallet
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">Your coin balance &amp; history</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {/* Balance card */}
            <div className="bg-gradient-to-br from-yellow-500/20 via-yellow-400/10 to-transparent border border-yellow-500/30 rounded-2xl p-6">
              {wallet.isLoading ? (
                <div className="h-16 animate-pulse bg-gray-800 rounded-xl" />
              ) : wallet.isError ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Balance unavailable — backend coming soon
                </p>
              ) : (
                <>
                  <p className="text-sm text-yellow-400/80 font-semibold uppercase tracking-widest mb-1">
                    Current Balance
                  </p>
                  <p className="text-5xl font-extrabold text-yellow-300 tabular-nums">
                    {balance.toLocaleString()}
                    <span className="text-2xl ml-2 text-yellow-500/60">HC</span>
                  </p>
                  <div className="flex gap-6 mt-4 pt-4 border-t border-yellow-500/20">
                    <div>
                      <p className="text-xs text-gray-500">Total Earned</p>
                      <p className="text-base font-bold text-green-400 tabular-nums">
                        +{totalEarned.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Spent</p>
                      <p className="text-base font-bold text-red-400 tabular-nums">
                        -{totalSpent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* How to earn */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-purple-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                  tips_and_updates
                </span>
                Ways to Earn HuudCoins
              </h2>

              {/* Category: Daily & Social */}
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Daily &amp; Social</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: "today", label: "Daily check-in", amount: "+10 HC" },
                  { icon: "edit_note", label: "Create a post", amount: "+5 HC" },
                  { icon: "campaign", label: "Post an FYI", amount: "+8 HC" },
                  { icon: "forum", label: "Start a discussion", amount: "+3 HC" },
                  { icon: "comment", label: "Comment on post", amount: "+2 HC" },
                  { icon: "record_voice_over", label: "Comment on gossip", amount: "+2 HC" },
                  { icon: "share", label: "Share a post", amount: "+3 HC" },
                  { icon: "group_add", label: "Follow a neighbor", amount: "+2 HC" },
                ].map((item) => (
                  <EarnRow key={item.label} {...item} />
                ))}
              </div>

              {/* Category: Marketplace */}
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Marketplace</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: "storefront", label: "List an item", amount: "+10 HC" },
                  { icon: "local_offer", label: "Make an offer", amount: "+2 HC" },
                  { icon: "shopping_bag", label: "Complete a purchase", amount: "+20 HC" },
                ].map((item) => (
                  <EarnRow key={item.label} {...item} />
                ))}
              </div>

              {/* Category: Events & Jobs */}
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Events &amp; Jobs</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: "event", label: "Create an event", amount: "+15 HC" },
                  { icon: "event_available", label: "RSVP to event", amount: "+5 HC" },
                  { icon: "work", label: "Post a job", amount: "+10 HC" },
                  { icon: "send", label: "Apply for a job", amount: "+5 HC" },
                ].map((item) => (
                  <EarnRow key={item.label} {...item} />
                ))}
              </div>

              {/* Category: Services */}
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Services</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: "handyman", label: "Book a service", amount: "+10 HC" },
                  { icon: "star", label: "Rate a service", amount: "+8 HC" },
                ].map((item) => (
                  <EarnRow key={item.label} {...item} />
                ))}
              </div>

              {/* Category: Achievements */}
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Achievements</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "military_tech", label: "Earn a badge", amount: "+50 HC" },
                  { icon: "emoji_events", label: "Claim achievement", amount: "+100 HC" },
                  { icon: "volunteer_activism", label: "Help a neighbor", amount: "+20 HC" },
                  { icon: "verified_user", label: "Verify identity", amount: "+30 HC" },
                  { icon: "manage_accounts", label: "Complete profile", amount: "+50 HC" },
                ].map((item) => (
                  <EarnRow key={item.label} {...item} />
                ))}
              </div>
            </div>

            {/* Ways to Spend */}
            <div className="bg-[#1a1a2e] border border-amber-500/20 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-lg">🪙</span>
                Ways to Spend HuudCoins
              </h2>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Boost &amp; Visibility</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: "storefront",   label: "Boost marketplace listing",  amount: "300–1,500 HC" },
                  { icon: "work",         label: "Boost a job posting",         amount: "200–400 HC"   },
                  { icon: "handyman",     label: "Boost a service listing",     amount: "200–400 HC"   },
                  { icon: "event",        label: "Boost an event",              amount: "150–300 HC"   },
                  { icon: "push_pin",     label: "Pin a post to your feed",     amount: "100–300 HC"   },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-2">
                    <span className="material-symbols-outlined text-[18px] text-amber-400 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-300 leading-tight">{item.label}</p>
                      <p className="text-[11px] font-bold text-amber-400">{item.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Community</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-2">
                  <span className="text-[18px]">🎁</span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-300 leading-tight">Tip a neighbour</p>
                    <p className="text-[11px] font-bold text-amber-400">50 / 100 / 200 / 500 HC</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction history */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Transaction History</h2>
                <div className="flex gap-1">
                  {(["all", "earned", "spent"] as TxType[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFilter(f); setPage(1); }}
                      className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors capitalize ${
                        filter === f
                          ? "bg-purple-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {txQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse bg-gray-800 rounded-xl" />
                  ))}
                </div>
              ) : txQuery.isError || displayedTxs.length === 0 ? (
                <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-10 text-center">
                  <span
                    className="material-symbols-outlined text-[40px] text-gray-700 mb-3 block"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    receipt_long
                  </span>
                  <p className="text-gray-500 text-sm">
                    {txQuery.isError
                      ? "Transaction history unavailable — backend coming soon"
                      : "No transactions yet. Start earning HuudCoins!"}
                  </p>
                  {txQuery.isError ? null : (
                    <Link
                      href="/gamification"
                      className="mt-4 inline-block text-xs text-purple-400 hover:underline"
                    >
                      View your achievements →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedTxs.map((tx: any, i: number) => (
                    <div
                      key={tx.id ?? tx._id ?? i}
                      className="bg-[#1a1a2e] border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${txBg(tx.amount ?? 0)}`}>
                        <span
                          className="material-symbols-outlined text-[18px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {txIcon(tx.type ?? "")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {tx.description ?? tx.type ?? "Transaction"}
                        </p>
                        {tx.createdAt && (
                          <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                        )}
                      </div>
                      <span className={`text-sm font-extrabold tabular-nums shrink-0 ${txColor(tx.amount ?? 0)}`}>
                        {(tx.amount ?? 0) >= 0 ? "+" : ""}
                        {(tx.amount ?? 0).toLocaleString()} HC
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-400 disabled:opacity-40 hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-400 disabled:opacity-40 hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom nav spacer */}
          <div className="h-20 md:hidden" />
        </div>

        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
