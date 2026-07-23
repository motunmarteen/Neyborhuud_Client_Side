"use client";

/**
 * Product Offers Page — Seller view
 * Lists all offers on a specific product with accept / decline / counter / chat actions.
 * Route: /marketplace/:id/offers
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useProductOffers,
  useAcceptOffer,
  useRejectOffer,
  useRespondToOffer,
} from "@/hooks/useMarketplace";
import { MarketplaceOffer } from "@/types/api";
import { formatNGN } from "@/lib/marketplaceMessages";
import { toKobo } from "@/lib/currency";

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; label: string; icon: string }> = {
    pending:   { bg: "bg-status-warning/15 text-status-warning border border-status-warning/30",   label: "Pending",   icon: "schedule"    },
    countered: { bg: "bg-status-info/15 text-status-info border border-status-info/30",             label: "Countered", icon: "swap_horiz"  },
    accepted:  { bg: "bg-status-success/15 text-status-success border border-status-success/30",   label: "Accepted",  icon: "check_circle" },
    rejected:  { bg: "bg-status-danger/15 text-status-danger border border-status-danger/30",      label: "Declined",  icon: "cancel"       },
    expired:   { bg: "bg-status-neutral/10 text-status-neutral border border-status-neutral/20",   label: "Expired",   icon: "timer_off"    },
    cancelled: { bg: "bg-status-neutral/10 text-status-neutral border border-status-neutral/20",   label: "Cancelled", icon: "block"        },
  };
  const { bg, label, icon } = cfg[status] ?? { bg: "bg-status-neutral/10 text-status-neutral border border-status-neutral/20", label: status, icon: "help" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${bg}`}>
      <span className="material-symbols-outlined text-[11px] [font-variation-settings:'FILL'_1]" aria-hidden>{icon}</span>
      {label}
    </span>
  );
}

// ─── Time ago ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─── Offer row ───────────────────────────────────────────────────────────────

function OfferRow({
  offer,
  productPrice,
}: {
  offer: MarketplaceOffer;
  productPrice?: number;
}) {
  const router = useRouter();
  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");

  const accept  = useAcceptOffer();
  const reject  = useRejectOffer();
  const respond = useRespondToOffer(offer._id ?? offer.id);

  const offerId = offer._id ?? offer.id;
  const buyer = offer.buyer as any;
  const buyerName =
    buyer?.firstName && buyer?.lastName
      ? `${buyer.firstName} ${buyer.lastName}`
      : buyer?.username ?? buyer?.name ?? "Buyer";
  const buyerAvatar: string | undefined = buyer?.avatarUrl;

  const canAct = offer.status === "pending" || offer.status === "countered";

  const handleCounter = async () => {
    const nairaAmount = parseFloat(counterAmount);
    if (isNaN(nairaAmount) || nairaAmount <= 0) return;
    // API expects integer kobo — see lib/currency.ts.
    await respond.mutateAsync({ action: "counter", counterAmount: toKobo(nairaAmount) });
    setShowCounter(false);
    setCounterAmount("");
  };

  return (
    <div className="rounded-2xl border border-black/[0.08]/60 bg-brand-black p-4">
      {/* Buyer row */}
      <div className="flex items-center gap-3">
        {buyerAvatar ? (
          <img src={buyerAvatar} alt={buyerName} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/30 text-sm font-bold text-white">
            {buyerName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-white">{buyerName}</p>
          <p className="text-xs text-[var(--neu-text-muted)]">{timeAgo(offer.createdAt)}</p>
        </div>
        <StatusBadge status={offer.status} />
      </div>

      {/* Amounts */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {productPrice != null && (
          <span className="text-[var(--neu-text-muted)]">
            Listed: <span className="font-medium text-[var(--neu-text-muted)]">{formatNGN(productPrice)}</span>
          </span>
        )}
        <span className="text-status-warning font-semibold">
          Buyer&apos;s offer: {formatNGN(offer.offerAmount)}
        </span>
        {offer.counterOfferAmount != null && (
          <span className="text-brand-blue font-semibold">
            Your counter: {formatNGN(offer.counterOfferAmount)}
          </span>
        )}
      </div>

      {/* Action buttons */}
      {canAct && !showCounter && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => accept.mutate(offerId)}
            disabled={accept.isPending || reject.isPending}
            className="flex-1 rounded-full bg-brand-green-dark py-2 text-sm font-semibold text-white hover:bg-primary disabled:opacity-50 transition-colors"
          >
            {accept.isPending ? "…" : "Accept"}
          </button>
          <button
            type="button"
            onClick={() => setShowCounter(true)}
            className="flex-1 rounded-full bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-blue/90 transition-colors"
          >
            Counter
          </button>
          <button
            type="button"
            onClick={() => reject.mutate(offerId)}
            disabled={reject.isPending || accept.isPending}
            className="flex-1 rounded-full bg-brand-red py-2 text-sm font-semibold text-white hover:bg-brand-red/85 disabled:opacity-50 transition-colors"
          >
            {reject.isPending ? "…" : "Decline"}
          </button>
        </div>
      )}

      {/* Counter form */}
      {canAct && showCounter && (
        <div className="mt-4 space-y-3 rounded-xl bg-brand-black/50 p-3">
          <p className="text-sm font-medium text-[var(--neu-text-muted)]">Your counter offer</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neu-text-muted)] text-sm">₦</span>
            <input
              type="number"
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="1000"
              className="w-full rounded-lg border border-black/[0.08] bg-brand-black py-2 pl-7 pr-3 text-sm text-white focus:border-brand-blue focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowCounter(false); setCounterAmount(""); }}
              className="flex-1 rounded-full bg-brand-black py-2 text-sm font-semibold hover:bg-brand-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCounter}
              disabled={respond.isPending || !counterAmount}
              className="flex-1 rounded-full bg-brand-blue py-2 text-sm font-semibold text-white hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
            >
              {respond.isPending ? "Sending…" : "Send Counter"}
            </button>
          </div>
        </div>
      )}

      {/* Chat link */}
      {offer.conversationId && (
        <button
          type="button"
          onClick={() => router.push(`/chat/${offer.conversationId}`)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-brand-blue/40 py-2 text-sm font-medium text-brand-blue hover:bg-brand-blue/10 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chat with buyer
        </button>
      )}
    </div>
  );
}

// ─── Status filter tabs ───────────────────────────────────────────────────────

const FILTER_TABS = [
  { label: "All",       value: undefined },
  { label: "Pending",   value: "pending" },
  { label: "Countered", value: "countered" },
  { label: "Accepted",  value: "accepted" },
  { label: "Declined",  value: "rejected" },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductOffersPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useProductOffers(productId, statusFilter);

  const product = data?.product as any;
  const offers  = data?.offers ?? [];

  return (
    <div className="min-h-screen bg-brand-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-black/[0.08] bg-brand-black">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 flex items-center gap-2 text-sm text-[var(--neu-text-muted)] hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-3">
            {product?.thumbnail || product?.images?.[0] ? (
              <img
                src={product.thumbnail ?? product.images[0]}
                alt={product.title}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/20 text-brand-blue">
                <span className="material-symbols-outlined text-[20px]" aria-hidden>shopping_bag</span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {product?.title ?? "Product"} — Offers
              </h1>
              {product?.price != null && (
                <p className="text-sm text-[var(--neu-text-muted)]">
                  Listed at {formatNGN(product.price)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5">
        {/* Filter tabs */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map(({ label, value }) => (
            <button
              type="button"
              key={label}
              onClick={() => setStatusFilter(value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                statusFilter === value
                  ? "bg-brand-green-dark text-white"
                  : "bg-brand-black text-[var(--neu-text-muted)] hover:bg-brand-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-brand-black" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && offers.length === 0 && (
          <div className="py-16 text-center">
            <p className="mb-2 text-4xl">🤝</p>
            <p className="text-[var(--neu-text-muted)]">
              {statusFilter
                ? `No ${statusFilter} offers for this listing.`
                : "No offers yet on this listing."}
            </p>
            <Link
              href={`/marketplace?product=${encodeURIComponent(productId)}`}
              className="mt-4 inline-block rounded-full bg-brand-green-dark px-5 py-2 text-sm font-semibold hover:bg-primary transition-colors"
            >
              View listing
            </Link>
          </div>
        )}

        {/* Offer list */}
        {!isLoading && offers.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--neu-text-muted)]">
              {offers.length} {offers.length === 1 ? "offer" : "offers"}
            </p>
            {offers.map((offer) => (
              <OfferRow
                key={offer._id ?? offer.id}
                offer={offer}
                productPrice={product?.price}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
