"use client";

/**
 * My Deals — the unified P2P deal list.
 *
 * Binance-P2P-style: one product = one deal = one chat. Every offer and order
 * the user is buyer OR seller on shows here as a single row with a live
 * lifecycle status. Tapping a row opens that deal's chat directly — the chat
 * IS the deal detail, there is no separate detail page.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMyDeals } from "@/hooks/useMarketplace";
import type { DealStatus, MyDeal } from "@/services/marketplace.service";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";

type Filter = "all" | "buying" | "selling";

const STATUS_META: Record<
  DealStatus,
  { label: string; pill: string; icon: string }
> = {
  offer_pending: { label: "OFFER PENDING", pill: "bg-status-pending", icon: "schedule" },
  offer_countered: { label: "COUNTERED", pill: "bg-status-pending", icon: "sync_alt" },
  committed: { label: "DEAL STARTED", pill: "bg-brand-blue", icon: "handshake" },
  payment_sent: { label: "PAYMENT SENT", pill: "bg-status-warning", icon: "payments" },
  completed: { label: "COMPLETED", pill: "bg-primary", icon: "task_alt" },
  disputed: { label: "DISPUTED", pill: "bg-status-danger", icon: "gavel" },
  expired: { label: "EXPIRED", pill: "bg-status-neutral", icon: "block" },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function DealCard({ deal, onOpen }: { deal: MyDeal; onOpen: () => void }) {
  const meta = STATUS_META[deal.dealStatus];
  const counterpartyName =
    deal.counterparty?.username ||
    [deal.counterparty?.firstName, deal.counterparty?.lastName].filter(Boolean).join(" ") ||
    "Neighbour";
  const roleLabel = deal.role === "buying" ? "Buying from" : "Selling to";

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="flex items-center gap-4 rounded-2xl border border-black/[0.08] bg-brand-black p-4 transition-transform cursor-pointer active:scale-[0.99] hover:bg-brand-black"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-black/50">
        {deal.product?.images?.[0] ? (
          <img
            src={deal.product.images[0]}
            alt={deal.product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-[28px] text-[var(--neu-text-secondary)]">
              inventory_2
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-white">
            {deal.product?.title ?? "Deal"}
          </h3>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold text-white ${meta.pill}`}
          >
            <span className="material-symbols-outlined text-[11px]">{meta.icon}</span>
            {meta.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-white/60">
          ₦{deal.amount.toLocaleString()} · {roleLabel} @{counterpartyName}
        </p>
        <p className="mt-1 text-[10px] text-white/40">{timeAgo(deal.updatedAt)}</p>
      </div>

      <span className="material-symbols-outlined shrink-0 text-[18px] text-white/40">
        chat
      </span>
    </div>
  );
}

export default function MyDealsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const { data: deals, isLoading } = useMyDeals(filter === "all" ? undefined : filter);

  const openDeal = (deal: MyDeal) => {
    if (deal.conversationId) {
      router.push(`/chat/${deal.conversationId}`);
    }
  };

  if (isLoading) {
    return (
      <LocalHuudSubpageShell hubId="marketplace">
        <div className="mod-card space-y-4 rounded-2xl p-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl"
                style={{ background: "var(--neu-shadow-dark)" }}
              />
            ))}
          </div>
        </div>
      </LocalHuudSubpageShell>
    );
  }

  const list = deals ?? [];

  return (
    <LocalHuudSubpageShell hubId="marketplace">
      <div className="mod-card space-y-5 rounded-2xl p-4">
        {/* Filter chips */}
        <div
          role="tablist"
          aria-label="My Deals filter"
          className="flex gap-1 rounded-full border border-black/[0.05] bg-brand-surface/60 p-1"
        >
          {(
            [
              ["all", "All"],
              ["buying", "Buying"],
              ["selling", "Selling"],
            ] as [Filter, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={`segmented-tab px-5 py-2.5 rounded-full text-sm font-semibold active:scale-[0.97] ${
                filter === id ? "segmented-tab--active" : "segmented-tab--inactive"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-black/50">
              <span className="material-symbols-outlined text-[48px] text-[var(--neu-text-muted)]">
                handshake
              </span>
            </div>
            <h3 className="mb-2 text-xl font-semibold">No deals yet</h3>
            <p className="mb-6 text-[var(--neu-text-muted)]">
              Buy or make an offer on something — your deal chat will show up here.
            </p>
            <button
              onClick={() => router.push("/marketplace")}
              className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-brand-green-dark"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((deal) => (
              <DealCard key={`${deal.kind}-${deal.id}`} deal={deal} onOpen={() => openDeal(deal)} />
            ))}
          </div>
        )}
      </div>
    </LocalHuudSubpageShell>
  );
}
