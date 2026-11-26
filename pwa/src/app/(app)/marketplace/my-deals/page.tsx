"use client";

/**
 * My Deals: every offer and order you are part of, as buyer or seller, one row each with its
 * stage. Tapping a row opens that deal's chat (the chat is the deal; there is no other page).
 * Restyled 2026-11-26: white rows (were dark navy boxes with the item name cut to "S…").
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { useMyDeals } from "@/hooks/useMarketplace";
import type { MyDeal } from "@/services/marketplace.service";
import { DEAL_STATUS_META as STATUS_META } from "@/lib/dealStatus";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";
import { LocalHuudHubPrimaryAction } from "@/components/local-huud/LocalHuudHubHeader";
import { LIST_CLASS, RowsSkeleton } from "@/components/friendship/PeopleRows";
import { ChipRow, FilterChip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatNaira } from "@/lib/currency";
import { formatTimeAgo } from "@/utils/timeAgo";

type Filter = "all" | "buying" | "selling";
const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["buying", "Buying"],
  ["selling", "Selling"],
];

function DealRow({ deal, onOpen }: { deal: MyDeal; onOpen: () => void }) {
  const meta = STATUS_META[deal.dealStatus];
  const who =
    [deal.counterparty?.firstName, deal.counterparty?.lastName].filter(Boolean).join(" ") ||
    (deal.counterparty?.username ? `@${deal.counterparty.username}` : "a neighbour");
  const photo = deal.product?.images?.[0];

  return (
    <li className="border-b border-line/60 last:border-0">
      <button
        type="button"
        onClick={onOpen}
        disabled={!deal.conversationId}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-background disabled:cursor-default"
      >
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-background">
          {photo ? (
            <Image src={photo} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <span aria-hidden className="grid h-full w-full place-items-center text-2xl">🛒</span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[15px] font-bold leading-snug text-navy">{deal.product?.title ?? "Item"}</span>
          <span className="mt-0.5 block truncate text-[13px] text-muted">
            {formatNaira(deal.amount)} · {deal.role === "buying" ? "from" : "to"} {who}
          </span>
          <span className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-purple-soft px-2 py-0.5 text-[12px] font-bold text-[#5E3BB8]">{meta.label}</span>
            <span className="text-[12px] text-muted">{formatTimeAgo(deal.updatedAt)}</span>
          </span>
        </span>
        {deal.conversationId ? <MessageCircle size={20} className="shrink-0 text-brand-green-dark" aria-label="Open chat" /> : null}
      </button>
    </li>
  );
}

export default function MyDealsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const { data: deals, isLoading } = useMyDeals(filter === "all" ? undefined : filter);
  const list = deals ?? [];

  return (
    <LocalHuudSubpageShell hubId="marketplace" action={<LocalHuudHubPrimaryAction href="/marketplace/create" label="Sell item" />}>
      <ChipRow label="Show deals">
        {FILTERS.map(([id, label]) => (
          <FilterChip key={id} active={filter === id} onClick={() => setFilter(id)}>
            {label}
          </FilterChip>
        ))}
      </ChipRow>

      {isLoading ? (
        <RowsSkeleton rows={3} />
      ) : list.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No deals yet"
          description="When you buy, sell or make an offer, the deal and its chat show here."
          action={{ label: "Browse the market", href: "/marketplace" }}
        />
      ) : (
        <ul className={LIST_CLASS}>
          {list.map((deal) => (
            <DealRow
              key={`${deal.kind}-${deal.id}`}
              deal={deal}
              onOpen={() => deal.conversationId && router.push(`/chat/${deal.conversationId}`)}
            />
          ))}
        </ul>
      )}
    </LocalHuudSubpageShell>
  );
}
