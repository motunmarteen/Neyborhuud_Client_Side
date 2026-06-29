"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppBrowseLayout } from "@/components/layout/AppBrowseLayout";
import { BrowseTabStrip } from "@/components/layout/BrowseTabStrip";
import {
  HuudEconomyHero,
  HuudEconomySectionNav,
} from "@/components/huud-economy/HuudEconomySectionNav";
import { HuudCoinTierPanel } from "@/components/gamification/HuudCoinTierPanel";
import { useWallet, useTransactions } from "@/hooks/useGamification";
import { usePaymentHistory, usePaymentStats } from "@/hooks/usePayments";
import { PaymentReceiptSheet } from "@/components/payments/PaymentReceiptSheet";
import { Payment } from "@/types/api";

type WalletTab = "overview" | "transactions" | "spends" | "tier";
type TxType = "all" | "earned" | "spent";

const WALLET_TABS: { id: WalletTab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "transactions", label: "History", icon: "receipt_long" },
  { id: "spends", label: "Spends", icon: "shopping_cart" },
  { id: "tier", label: "Activity tier", icon: "military_tech" },
];

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

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  listing_boost: "Listing Boost",
  job_boost: "Job Boost",
  service_boost: "Service Boost",
  event_boost: "Event Boost",
  tip_user: "Tip to Neighbour",
  event_ticket: "Event Ticket",
  marketplace_pledge: "Marketplace Pledge",
  service_payment: "Service Payment",
};

const PAYMENT_TYPE_ICONS: Record<string, string> = {
  listing_boost: "🏷️",
  job_boost: "💼",
  service_boost: "🔧",
  event_boost: "🎉",
  tip_user: "💸",
  event_ticket: "🎟️",
  marketplace_pledge: "🤝",
  service_payment: "💳",
};

function parseWalletTab(value: string | null): WalletTab {
  if (value === "transactions" || value === "spends" || value === "tier") return value;
  return "overview";
}

function txIcon(type: string) {
  return TX_ICONS[type] ?? "paid";
}

function txColor(amount: number) {
  return amount >= 0 ? "text-primary" : "text-brand-red";
}

function txBg(amount: number) {
  return amount >= 0 ? "bg-primary/15 text-primary" : "bg-brand-red/15 text-brand-red";
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
    <div className="mod-inset flex items-center gap-2 rounded-lg px-3 py-2">
      <span
        className="material-symbols-outlined shrink-0 text-[16px] text-brand-blue"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <p className="flex-1 truncate text-xs text-[var(--neu-text-muted)]">{label}</p>
      <span className="shrink-0 text-xs font-bold text-primary">{amount}</span>
    </div>
  );
}

function BalanceCard({
  balance,
  totalEarned,
  totalSpent,
  isLoading,
  isError,
}: {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <div className="mod-card rounded-2xl p-5">
      {isLoading ? (
        <div className="h-20 animate-pulse mod-inset rounded-xl" />
      ) : isError ? (
        <p className="py-4 text-center text-sm text-[var(--neu-text-muted)]">
          Balance unavailable — try again shortly
        </p>
      ) : (
        <>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
            HuudCoins wallet
          </p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums text-primary">
            {balance.toLocaleString()}
            <span className="ml-2 text-xl font-bold text-primary/50">HC</span>
          </p>
          <div className="mt-4 flex gap-6 border-t pt-4" style={{ borderColor: "var(--neu-shadow-dark)" }}>
            <div>
              <p className="text-xs text-[var(--neu-text-muted)]">Total earned</p>
              <p className="text-base font-bold tabular-nums text-primary">
                +{totalEarned.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--neu-text-muted)]">Total spent</p>
              <p className="text-base font-bold tabular-nums text-brand-red">
                -{totalSpent.toLocaleString()}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function WalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<WalletTab>("overview");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<TxType>("all");
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);

  useEffect(() => {
    setTab(parseWalletTab(searchParams.get("tab")));
  }, [searchParams]);

  const changeTab = (id: string) => {
    const next = id as WalletTab;
    setTab(next);
    const params = new URLSearchParams();
    if (next !== "overview") params.set("tab", next);
    const qs = params.toString();
    router.replace(`/huud-economy/wallet${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const wallet = useWallet();
  const txQuery = useTransactions(page);
  const paymentsQuery = usePaymentHistory();
  const { data: statsData } = usePaymentStats();

  const walletData = (wallet.data as Record<string, number> | null) ?? null;
  const balance =
    walletData?.balance ?? walletData?.huudCoins ?? walletData?.totalHuudCoins ?? 0;
  const totalEarned = walletData?.totalEarned ?? 0;
  const totalSpent = walletData?.totalSpent ?? 0;

  const allTxs: Record<string, unknown>[] = txQuery.data?.transactions ?? [];
  const totalPages = txQuery.data?.totalPages ?? 1;
  const allPayments: Payment[] =
    paymentsQuery.data?.pages.flatMap((p: { payments: Payment[] }) => p.payments) ?? [];
  const stats = statsData as {
    totalSpent?: number;
    totalTransactions?: number;
    byType?: Record<string, { coins: number; count: number }>;
  } | null;

  const displayedTxs =
    filter === "earned"
      ? allTxs.filter((t) => Number(t.amount ?? 0) > 0)
      : filter === "spent"
        ? allTxs.filter((t) => Number(t.amount ?? 0) < 0)
        : allTxs;

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <div className="space-y-3">
          <HuudEconomyHero />
          <HuudEconomySectionNav />
          <BrowseTabStrip tabs={WALLET_TABS} activeId={tab} onChange={changeTab} />
        </div>
      }
    >
      <div className="space-y-4">
        {(tab === "overview" || tab === "transactions" || tab === "spends") && (
          <BalanceCard
            balance={balance}
            totalEarned={totalEarned}
            totalSpent={totalSpent}
            isLoading={wallet.isLoading}
            isError={wallet.isError}
          />
        )}

        {tab === "overview" && (
          <>
            <div className="mod-card rounded-2xl p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: "var(--neu-text)" }}>
                <span className="material-symbols-outlined text-[18px] text-primary">bolt</span>
                Quick actions
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/huud-economy/score"
                  className="mod-inset flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center no-underline"
                >
                  <span className="material-symbols-outlined text-[22px] text-brand-blue" style={{ fontVariationSettings: "'FILL' 1" }}>
                    today
                  </span>
                  <span className="text-xs font-bold text-primary">Daily check-in</span>
                </Link>
                <Link
                  href="/neighborhood"
                  className="mod-inset flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center no-underline"
                >
                  <span className="material-symbols-outlined text-[22px] text-brand-blue" style={{ fontVariationSettings: "'FILL' 1" }}>
                    volunteer_activism
                  </span>
                  <span className="text-xs font-bold" style={{ color: "var(--neu-text)" }}>Tip a neighbour</span>
                  <span className="text-[10px] text-[var(--neu-text-muted)]">Open their profile</span>
                </Link>
                <Link
                  href="/feed"
                  className="mod-inset flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center no-underline"
                >
                  <span className="material-symbols-outlined text-[22px] text-brand-blue" style={{ fontVariationSettings: "'FILL' 1" }}>
                    rocket_launch
                  </span>
                  <span className="text-xs font-bold" style={{ color: "var(--neu-text)" }}>Boost on feed</span>
                </Link>
                <Link
                  href="/jobs"
                  className="mod-inset flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center no-underline"
                >
                  <span className="material-symbols-outlined text-[22px] text-brand-blue" style={{ fontVariationSettings: "'FILL' 1" }}>
                    work
                  </span>
                  <span className="text-xs font-bold" style={{ color: "var(--neu-text)" }}>Boost a job</span>
                </Link>
              </div>
            </div>

            <div className="mod-card rounded-2xl p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: "var(--neu-text)" }}>
                <span className="material-symbols-outlined text-[18px] text-brand-blue">tips_and_updates</span>
                Ways to earn HuudCoins
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "today", label: "Daily check-in", amount: "+10 HC" },
                  { icon: "edit_note", label: "Create a post", amount: "+5 HC" },
                  { icon: "campaign", label: "Post an FYI", amount: "+8 HC" },
                  { icon: "comment", label: "Comment", amount: "+2 HC" },
                  { icon: "storefront", label: "List an item", amount: "+10 HC" },
                  { icon: "military_tech", label: "Earn a badge", amount: "+50 HC" },
                ].map((item) => (
                  <EarnRow key={item.label} {...item} />
                ))}
              </div>
            </div>

            <div className="mod-card rounded-2xl p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: "var(--neu-text)" }}>
                <span aria-hidden>🪙</span>
                Ways to spend HuudCoins
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "storefront", label: "Boost listing", amount: "300+ HC" },
                  { icon: "work", label: "Boost job", amount: "200+ HC" },
                  { icon: "event", label: "Boost event", amount: "150+ HC" },
                  { icon: "push_pin", label: "Pin a post", amount: "100+ HC" },
                ].map((item) => (
                  <EarnRow key={item.label} {...item} />
                ))}
              </div>
              <button
                type="button"
                onClick={() => changeTab("spends")}
                className="mod-chip mod-chip-active mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-primary"
              >
                View spend history
              </button>
            </div>
          </>
        )}

        {tab === "transactions" && (
          <div className="mod-card rounded-2xl p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold" style={{ color: "var(--neu-text)" }}>
                Transaction history
              </h2>
              <div className="flex gap-1">
                {(["all", "earned", "spent"] as TxType[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setFilter(f);
                      setPage(1);
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      filter === f ? "mod-chip mod-chip-active text-primary" : "mod-chip"
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
                  <div key={i} className="h-14 animate-pulse mod-inset rounded-xl" />
                ))}
              </div>
            ) : txQuery.isError || displayedTxs.length === 0 ? (
              <div className="mod-inset rounded-xl p-8 text-center">
                <span className="material-symbols-outlined mb-2 block text-[36px] text-[var(--neu-text-muted)]">
                  receipt_long
                </span>
                <p className="text-sm text-[var(--neu-text-muted)]">
                  {txQuery.isError
                    ? "Transaction history unavailable"
                    : "No transactions yet. Start earning HuudCoins!"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedTxs.map((tx, i) => {
                  const amount = Number(tx.amount ?? 0);
                  return (
                    <div
                      key={String(tx.id ?? tx._id ?? i)}
                      className="mod-inset flex items-center gap-3 rounded-xl px-3 py-2.5"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${txBg(amount)}`}
                      >
                        <span
                          className="material-symbols-outlined text-[18px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {txIcon(String(tx.type ?? ""))}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: "var(--neu-text)" }}>
                          {String(tx.description ?? tx.type ?? "Transaction")}
                        </p>
                        {tx.createdAt ? (
                          <p className="text-xs text-[var(--neu-text-muted)]">
                            {formatDate(String(tx.createdAt))}
                          </p>
                        ) : null}
                      </div>
                      <span className={`shrink-0 text-sm font-extrabold tabular-nums ${txColor(amount)}`}>
                        {amount >= 0 ? "+" : ""}
                        {amount.toLocaleString()} HC
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="mod-chip rounded-lg px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-[var(--neu-text-muted)]">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="mod-chip rounded-lg px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "spends" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="mod-card rounded-xl p-4">
                <p className="text-xs text-[var(--neu-text-muted)]">Total coins spent</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-brand-red">
                  {totalSpent.toLocaleString()} HC
                </p>
                <p className="mt-1 text-[10px] text-[var(--neu-text-muted)]">From your wallet ledger</p>
              </div>
              <div className="mod-card rounded-xl p-4">
                <p className="text-xs text-[var(--neu-text-muted)]">Boost &amp; payment records</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: "var(--neu-text)" }}>
                  {stats?.totalTransactions ?? allPayments.length}
                </p>
                <p className="mt-1 text-[10px] text-[var(--neu-text-muted)]">Payment API only</p>
              </div>
            </div>

            {stats?.byType && Object.keys(stats.byType).length > 0 && (
              <div className="mod-card rounded-2xl p-4">
                <h2 className="mb-3 text-sm font-bold" style={{ color: "var(--neu-text)" }}>
                  Spend breakdown
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(stats.byType).map(([type, data]) => (
                    <div key={type} className="mod-inset rounded-xl p-3 text-center">
                      <span className="text-xl">{PAYMENT_TYPE_ICONS[type] ?? "🪙"}</span>
                      <p className="mt-1 text-[11px] text-[var(--neu-text-muted)]">
                        {PAYMENT_TYPE_LABELS[type] ?? type}
                      </p>
                      <p className="text-sm font-bold text-brand-red">
                        -{data.coins.toLocaleString()} HC
                      </p>
                      <p className="text-[10px] text-[var(--neu-text-muted)]">{data.count}×</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mod-card rounded-2xl p-4">
              <h2 className="mb-3 text-sm font-bold" style={{ color: "var(--neu-text)" }}>
                Boost &amp; payment history
              </h2>

              {paymentsQuery.isLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse mod-inset rounded-xl" />
                  ))}
                </div>
              )}

              {!paymentsQuery.isLoading && allPayments.length === 0 && (
                <div className="mod-inset rounded-xl p-8 text-center">
                  <span className="mb-2 block text-3xl" aria-hidden>
                    🚀
                  </span>
                  <p className="text-sm text-[var(--neu-text-muted)]">No boosts or payments yet.</p>
                  <p className="mt-1 text-xs text-[var(--neu-text-muted)]">
                    Spend HuudCoins to boost jobs, services, or events.
                  </p>
                </div>
              )}

              {!paymentsQuery.isLoading && allPayments.length > 0 && (
                <div className="space-y-2">
                  {allPayments.map((p) => (
                    <button
                      key={p.id ?? p.reference}
                      type="button"
                      onClick={() => setReceiptPaymentId(p.id ?? p.reference)}
                      className="mod-inset w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left active:scale-[0.98] transition-transform"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg">
                        {PAYMENT_TYPE_ICONS[p.type] ?? "🪙"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ color: "var(--neu-text)" }}>
                          {PAYMENT_TYPE_LABELS[p.type] ?? p.type}
                        </p>
                        {p.description ? (
                          <p className="truncate text-xs text-[var(--neu-text-muted)]">{p.description}</p>
                        ) : null}
                        <p className="text-xs text-[var(--neu-text-muted)]">
                          {new Date(p.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-black text-brand-red tabular-nums">
                          -{p.coinsSpent.toLocaleString()} HC
                        </span>
                        {p.status === "completed" ? (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            Confirmed
                          </span>
                        ) : (
                          <span className={`text-xs capitalize ${p.status === "refunded" ? "text-primary" : "text-brand-red"}`}>
                            {p.status}
                          </span>
                        )}
                        <span className="material-symbols-outlined text-[14px] neu-text-muted">chevron_right</span>
                      </div>
                    </button>
                  ))}

                  {paymentsQuery.hasNextPage && (
                    <button
                      type="button"
                      onClick={() => paymentsQuery.fetchNextPage()}
                      disabled={paymentsQuery.isFetchingNextPage}
                      className="mod-chip w-full rounded-xl py-2 text-xs font-semibold"
                    >
                      {paymentsQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "tier" && <HuudCoinTierPanel />}
      </div>

      <PaymentReceiptSheet
        paymentId={receiptPaymentId}
        onClose={() => setReceiptPaymentId(null)}
      />
    </AppBrowseLayout>
  );
}
