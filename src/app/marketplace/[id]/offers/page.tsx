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

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; label: string }> = {
    pending:   { bg: "bg-amber-500/20 text-amber-300",   label: "Pending" },
    countered: { bg: "bg-purple-500/20 text-purple-300", label: "Countered" },
    accepted:  { bg: "bg-green-500/20 text-green-300",   label: "Accepted" },
    rejected:  { bg: "bg-red-500/20 text-red-300",       label: "Declined" },
    expired:   { bg: "bg-gray-600/30 text-gray-400",     label: "Expired" },
    cancelled: { bg: "bg-gray-600/30 text-gray-400",     label: "Cancelled" },
  };
  const { bg, label } = cfg[status] ?? { bg: "bg-gray-600/30 text-gray-400", label: status };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${bg}`}>
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
    const amount = parseFloat(counterAmount);
    if (isNaN(amount) || amount <= 0) return;
    await respond.mutateAsync({ action: "counter", counterAmount: amount });
    setShowCounter(false);
    setCounterAmount("");
  };

  return (
    <div className="rounded-2xl border border-gray-800/60 bg-gray-900 p-4">
      {/* Buyer row */}
      <div className="flex items-center gap-3">
        {buyerAvatar ? (
          <img src={buyerAvatar} alt={buyerName} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white">
            {buyerName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-white">{buyerName}</p>
          <p className="text-xs text-gray-400">{timeAgo(offer.createdAt)}</p>
        </div>
        <StatusBadge status={offer.status} />
      </div>

      {/* Amounts */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {productPrice != null && (
          <span className="text-gray-400">
            Listed: <span className="font-medium text-gray-300">{formatNGN(productPrice)}</span>
          </span>
        )}
        <span className="text-amber-300 font-semibold">
          Buyer&apos;s offer: {formatNGN(offer.offerAmount)}
        </span>
        {offer.counterOfferAmount != null && (
          <span className="text-purple-300 font-semibold">
            Your counter: {formatNGN(offer.counterOfferAmount)}
          </span>
        )}
      </div>

      {/* Action buttons */}
      {canAct && !showCounter && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => accept.mutate(offerId)}
            disabled={accept.isPending || reject.isPending}
            className="flex-1 rounded-full bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {accept.isPending ? "…" : "Accept"}
          </button>
          <button
            onClick={() => setShowCounter(true)}
            className="flex-1 rounded-full bg-purple-700 py-2 text-sm font-semibold text-white hover:bg-purple-600 transition-colors"
          >
            Counter
          </button>
          <button
            onClick={() => reject.mutate(offerId)}
            disabled={reject.isPending || accept.isPending}
            className="flex-1 rounded-full bg-red-700 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {reject.isPending ? "…" : "Decline"}
          </button>
        </div>
      )}

      {/* Counter form */}
      {canAct && showCounter && (
        <div className="mt-4 space-y-3 rounded-xl bg-gray-800/50 p-3">
          <p className="text-sm font-medium text-gray-300">Your counter offer</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
            <input
              type="number"
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="1000"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2 pl-7 pr-3 text-sm text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCounter(false); setCounterAmount(""); }}
              className="flex-1 rounded-full bg-gray-700 py-2 text-sm font-semibold hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCounter}
              disabled={respond.isPending || !counterAmount}
              className="flex-1 rounded-full bg-purple-700 py-2 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50 transition-colors"
            >
              {respond.isPending ? "Sending…" : "Send Counter"}
            </button>
          </div>
        </div>
      )}

      {/* Chat link */}
      {offer.conversationId && (
        <button
          onClick={() => router.push(`/messages/${offer.conversationId}`)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-blue-600/40 py-2 text-sm font-medium text-blue-300 hover:bg-blue-900/30 transition-colors"
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
    <div className="min-h-screen bg-[#0f0f1e] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-[#1a1a2e]">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <button
            onClick={() => router.back()}
            className="mb-2 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 text-lg">
                🛍️
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {product?.title ?? "Product"} — Offers
              </h1>
              {product?.price != null && (
                <p className="text-sm text-gray-400">
                  Listed at ₦{product.price.toLocaleString()}
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
              key={label}
              onClick={() => setStatusFilter(value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                statusFilter === value
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
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
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-800" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && offers.length === 0 && (
          <div className="py-16 text-center">
            <p className="mb-2 text-4xl">🤝</p>
            <p className="text-gray-400">
              {statusFilter
                ? `No ${statusFilter} offers for this listing.`
                : "No offers yet on this listing."}
            </p>
            <Link
              href={`/marketplace/${productId}`}
              className="mt-4 inline-block rounded-full bg-green-600 px-5 py-2 text-sm font-semibold hover:bg-green-500 transition-colors"
            >
              View listing
            </Link>
          </div>
        )}

        {/* Offer list */}
        {!isLoading && offers.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
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
