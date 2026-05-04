"use client";

/**
 * My Offers Page
 * Browse history of offers (sent and received), filter by status,
 * accept / decline / counter pending offers in-line.
 */

import { useMemo, useState } from "react";
import { useMyOffers, useRespondToOffer, useMakeOffer } from "@/hooks/useMarketplace";
import { useRouter } from "next/navigation";
import { MarketplaceOffer } from "@/types/api";
import { formatNGN, getOfferToast } from "@/lib/marketplaceMessages";
import { toast } from "sonner";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";

type Tab = "all" | "sent" | "received";
type Perspective = "sent" | "received";
type StatusFilter = "all" | "pending" | "accepted" | "rejected" | "countered";

const STATUS_META: Record<
  string,
  { label: string; color: string; ring: string; icon: string }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    ring: "ring-amber-500/30",
    icon: "schedule",
  },
  accepted: {
    label: "Accepted",
    color: "bg-green-500/15 text-green-300 border-green-500/30",
    ring: "ring-green-500/30",
    icon: "check_circle",
  },
  rejected: {
    label: "Declined",
    color: "bg-red-500/15 text-red-300 border-red-500/30",
    ring: "ring-red-500/30",
    icon: "cancel",
  },
  countered: {
    label: "Countered",
    color: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    ring: "ring-purple-500/30",
    icon: "swap_horiz",
  },
  expired: {
    label: "Expired",
    color: "bg-gray-500/15 text-gray-300 border-gray-500/30",
    ring: "ring-gray-500/30",
    icon: "timer_off",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-600/15 text-gray-400 border-gray-600/30",
    ring: "ring-gray-600/30",
    icon: "block",
  },
};

function formatRelative(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function MyOffersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [counterAmount, setCounterAmount] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  const sentQuery = useMyOffers("sent");
  const receivedQuery = useMyOffers("received");

  const isLoading = sentQuery.isLoading || receivedQuery.isLoading;
  const activeQuery = tab === "received" ? receivedQuery : sentQuery;
  const fetchNextPage =
    tab === "all"
      ? () => {
          if (sentQuery.hasNextPage) sentQuery.fetchNextPage();
          if (receivedQuery.hasNextPage) receivedQuery.fetchNextPage();
        }
      : activeQuery.fetchNextPage;
  const hasNextPage =
    tab === "all"
      ? sentQuery.hasNextPage || receivedQuery.hasNextPage
      : activeQuery.hasNextPage;
  const isFetchingNextPage =
    tab === "all"
      ? sentQuery.isFetchingNextPage || receivedQuery.isFetchingNextPage
      : activeQuery.isFetchingNextPage;

  const sentOffers: MarketplaceOffer[] = useMemo(
    () =>
      sentQuery.data?.pages.flatMap(
        (page: any) => page?.data?.offers || page?.offers || [],
      ) || [],
    [sentQuery.data],
  );
  const receivedOffers: MarketplaceOffer[] = useMemo(
    () =>
      receivedQuery.data?.pages.flatMap(
        (page: any) => page?.data?.offers || page?.offers || [],
      ) || [],
    [receivedQuery.data],
  );

  // Combined list with derived perspective; sorted newest first.
  const allOffers: Array<MarketplaceOffer & { __perspective: Perspective }> =
    useMemo(() => {
      const combined: Array<
        MarketplaceOffer & { __perspective: Perspective }
      > = [];
      if (tab === "sent" || tab === "all") {
        for (const o of sentOffers)
          combined.push({ ...o, __perspective: "sent" });
      }
      if (tab === "received" || tab === "all") {
        for (const o of receivedOffers)
          combined.push({ ...o, __perspective: "received" });
      }
      combined.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
      return combined;
    }, [tab, sentOffers, receivedOffers]);

  // Per-status counts (for the filter chips)
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: allOffers.length,
      pending: 0,
      accepted: 0,
      rejected: 0,
      countered: 0,
    };
    for (const o of allOffers) {
      if (c[o.status] !== undefined) c[o.status] += 1;
    }
    return c;
  }, [allOffers]);

  const offers = useMemo(() => {
    if (statusFilter === "all") return allOffers;
    return allOffers.filter((o) => o.status === statusFilter);
  }, [allOffers, statusFilter]);

  if (isLoading) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white p-6">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 bg-gray-800 rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
          <RightSidebar />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-green-400 text-3xl">
              local_offer
            </span>
            <h1 className="text-3xl font-bold">My Offers</h1>
          </div>
          <p className="text-gray-400 mt-2">
            Track every negotiation — accept, counter, or follow up in chat.
          </p>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => router.push("/marketplace/my-orders")}
            className="px-5 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-all border border-gray-700"
          >
            My Orders
          </button>
          <button
            onClick={() => router.push("/marketplace/my-sales")}
            className="px-5 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-all border border-gray-700"
          >
            My Sales
          </button>
          <button
            onClick={() => router.push("/marketplace/my-offers")}
            className="px-5 py-2.5 bg-green-500 text-white rounded-full font-semibold"
          >
            My Offers
          </button>
        </div>

        {/* All / Sent / Received Tabs */}
        <div className="flex gap-2 mb-4 bg-gray-900/50 p-1.5 rounded-2xl border border-gray-800">
          {(
            [
              { id: "all" as const, label: "All", count: sentOffers.length + receivedOffers.length },
              { id: "sent" as const, label: "Sent", count: sentOffers.length },
              { id: "received" as const, label: "Received", count: receivedOffers.length },
            ]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setStatusFilter("all");
                setSelectedOffer(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                tab === t.id
                  ? "bg-green-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[11px] px-1.5 rounded-full ${
                  tab === t.id ? "bg-white/20" : "bg-gray-800"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Status Filter Chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
          {(
            ["all", "pending", "accepted", "countered", "rejected"] as StatusFilter[]
          ).map((s) => {
            const active = statusFilter === s;
            const meta = s === "all" ? null : STATUS_META[s];
            const label = s === "all" ? "All" : meta?.label;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                  active
                    ? "bg-white text-[#0f0f1e] border-white"
                    : "bg-gray-900/40 text-gray-300 border-gray-700 hover:border-gray-500"
                }`}
              >
                {meta && (
                  <span
                    aria-hidden="true"
                    className={`material-symbols-outlined text-[16px] ${
                      active ? "text-[#0f0f1e]" : "text-gray-400"
                    }`}
                  >
                    {meta.icon}
                  </span>
                )}
                <span>{label}</span>
                <span
                  className={`text-[11px] px-1.5 rounded-full ${
                    active ? "bg-[#0f0f1e]/20" : "bg-gray-800"
                  }`}
                >
                  {counts[s] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Offers List */}
        {offers.length === 0 ? (
          <EmptyState tab={tab} statusFilter={statusFilter} router={router} />
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <OfferCard
                key={`${offer.__perspective}-${offer.id}`}
                offer={offer}
                tab={offer.__perspective}
                showPerspectiveBadge={tab === "all"}
                router={router}
                selectedOffer={selectedOffer}
                setSelectedOffer={setSelectedOffer}
                counterAmount={counterAmount}
                setCounterAmount={setCounterAmount}
              />
            ))}

            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            )}
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

function EmptyState({
  tab,
  statusFilter,
  router,
}: {
  tab: Tab;
  statusFilter: StatusFilter;
  router: any;
}) {
  const isFiltered = statusFilter !== "all";
  const titleMap: Record<StatusFilter, string> = {
    all:
      tab === "sent"
        ? "No offers sent yet"
        : tab === "received"
        ? "No offers received yet"
        : "No offers yet",
    pending: "No pending offers",
    accepted: "No accepted offers yet",
    rejected: "No declined offers",
    countered: "No counter offers",
  };
  const subMap: Record<StatusFilter, string> = {
    all:
      tab === "sent"
        ? "Make an offer on a negotiable item to start haggling."
        : tab === "received"
        ? "When buyers send offers on your listings they'll show up here."
        : "Your full offer history (sent and received) will live here.",
    pending: "Nothing waiting on a response right now.",
    accepted: "Successful deals will appear here once accepted.",
    rejected: "Declined offers stay here as part of your history.",
    countered: "Counter offers from sellers (or to your buyers) will appear here.",
  };

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
        <span className="material-symbols-outlined text-gray-500 text-[48px]">
          {isFiltered ? "filter_list_off" : "handshake"}
        </span>
      </div>
      <h3 className="text-xl font-semibold mb-2">{titleMap[statusFilter]}</h3>
      <p className="text-gray-400 mb-6">{subMap[statusFilter]}</p>
      {!isFiltered && (tab === "sent" || tab === "all") && (
        <button
          onClick={() => router.push("/marketplace")}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-full font-semibold transition-all text-white"
        >
          Browse Marketplace
        </button>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  tab,
  showPerspectiveBadge,
  router,
  selectedOffer,
  setSelectedOffer,
  counterAmount,
  setCounterAmount,
}: {
  offer: MarketplaceOffer;
  tab: Perspective;
  showPerspectiveBadge?: boolean;
  router: any;
  selectedOffer: string | null;
  setSelectedOffer: (id: string | null) => void;
  counterAmount: string;
  setCounterAmount: (amount: string) => void;
}) {
  const respondToOffer = useRespondToOffer(offer.id);
  const makeOffer = useMakeOffer(offer.productId);

  const handleResponse = async (action: "accept" | "reject" | "counter") => {
    try {
      await respondToOffer.mutateAsync({
        action,
        counterAmount:
          action === "counter" ? parseFloat(counterAmount) : undefined,
      });
      setSelectedOffer(null);
      setCounterAmount("");
    } catch {
      // toast handled in hook
    }
  };

  // Buyer accepting a seller's counter offer = re-submit a new offer at the counter price.
  const handleAcceptCounter = async () => {
    if (!offer.counterOfferAmount) return;
    try {
      await makeOffer.mutateAsync(offer.counterOfferAmount);
      toast.success(
        getOfferToast(
          { action: "accept", amount: offer.counterOfferAmount, actorRole: "buyer" },
          "buyer",
        ),
      );
    } catch {
      // error toast handled in hook
    }
  };

  const meta = STATUS_META[offer.status] ?? STATUS_META.pending;
  const listed = Number(offer.product?.price ?? 0);
  const offerAmt = Number(offer.offerAmount ?? 0);
  const counterAmt = Number(offer.counterOfferAmount ?? 0);
  const finalAmt =
    offer.status === "accepted"
      ? counterAmt > 0
        ? counterAmt
        : offerAmt
      : 0;
  const discountPct =
    listed > 0 && offerAmt > 0
      ? Math.max(0, Math.round(((listed - offerAmt) / listed) * 100))
      : 0;

  const counterparty =
    tab === "sent"
      ? offer.seller?.username || offer.seller?.firstName || "Seller"
      : offer.buyer?.username || offer.buyer?.firstName || "Buyer";

  // Seller can act on pending offers received
  const canSellerAct = tab === "received" && offer.status === "pending";
  // Buyer can accept seller's counter (sent tab, status=countered)
  const canBuyerAcceptCounter =
    tab === "sent" && offer.status === "countered" && counterAmt > 0;

  return (
    <div
      className={`bg-gray-900 rounded-2xl p-5 border border-gray-800/50 ring-1 ring-inset ${meta.ring}`}
    >
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-800/50 flex-shrink-0">
          {offer.product?.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offer.product.images[0]}
              alt={offer.product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-600 text-[32px]">
                inventory_2
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => router.push(`/marketplace/${offer.productId}`)}
              className="font-semibold text-base sm:text-lg truncate text-white hover:text-green-400 cursor-pointer transition-colors"
            >
              {offer.product?.title || "Product"}
            </h3>
            <span
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.color} flex-shrink-0`}
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[14px]"
              >
                {meta.icon}
              </span>
              <span>{meta.label}</span>
            </span>
          </div>

          <p className="text-white/60 text-xs sm:text-sm flex items-center gap-1 mt-1 flex-wrap">
            {showPerspectiveBadge && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mr-1 ${
                  tab === "sent"
                    ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                    : "bg-orange-500/15 text-orange-300 border-orange-500/30"
                }`}
              >
                <span aria-hidden className="material-symbols-outlined text-[12px]">
                  {tab === "sent" ? "north_east" : "south_west"}
                </span>
                {tab === "sent" ? "You sent" : "You received"}
              </span>
            )}
            <span className="material-symbols-outlined text-[14px]">person</span>
            {tab === "sent" ? "To" : "From"}{" "}
            <span className="text-white/80">@{counterparty}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/50">{formatRelative(offer.createdAt)}</span>
          </p>

          {/* Price summary */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <PriceCell label="Listed" value={listed} muted />
            <PriceCell
              label={tab === "sent" ? "Your offer" : "Buyer's offer"}
              value={offerAmt}
              accent="text-green-300"
            />
            {counterAmt > 0 && (
              <PriceCell
                label={tab === "sent" ? "Seller counter" : "Your counter"}
                value={counterAmt}
                accent="text-purple-300"
              />
            )}
          </div>

          {/* Status timeline */}
          <div className="mt-2 text-[11px] text-white/40">
            {offer.status === "accepted" && offer.acceptedAt && (
              <span>
                {tab === "sent"
                  ? `Your offer was accepted ${formatRelative(offer.acceptedAt)}`
                  : `You accepted this offer ${formatRelative(offer.acceptedAt)}`}
              </span>
            )}
            {offer.status === "rejected" && offer.updatedAt && (
              <span>
                {tab === "sent"
                  ? `Your offer was declined ${formatRelative(offer.updatedAt)}`
                  : `You declined this offer ${formatRelative(offer.updatedAt)}`}
              </span>
            )}
            {offer.status === "countered" && offer.updatedAt && (
              <span>
                {tab === "sent"
                  ? `Seller sent a counteroffer ${formatRelative(offer.updatedAt)}`
                  : `You sent a counteroffer ${formatRelative(offer.updatedAt)}`}
              </span>
            )}
            {offer.status === "pending" && discountPct > 0 && (
              <span>{discountPct}% below asking price</span>
            )}
          </div>
        </div>
      </div>

      {/* Outcome banner */}
      {offer.status === "accepted" && (
        <div className="mt-4 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">handshake</span>
          {tab === "sent"
            ? `Your offer has been accepted at ${formatNGN(finalAmt)}. You can proceed with the next steps.`
            : `You accepted the buyer's offer at ${formatNGN(finalAmt)}. Prepare to complete the transaction.`}
        </div>
      )}
      {offer.status === "rejected" && tab === "sent" && (
        <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-200">
          Your offer was declined by the seller. You can send a new offer or browse similar items.
        </div>
      )}
      {offer.status === "rejected" && tab === "received" && (
        <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-200">
          You declined the buyer's offer.
        </div>
      )}
      {offer.status === "countered" && tab === "sent" && (
        <div className="mt-4 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm text-purple-200">
          You received a counteroffer of {formatNGN(counterAmt)}. You can accept the counter or send a new offer.
        </div>
      )}
      {offer.status === "countered" && tab === "received" && (
        <div className="mt-4 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm text-purple-200">
          You sent a counteroffer of {formatNGN(counterAmt)}. Awaiting the buyer's response.
        </div>
      )}

      {/* Seller actions: pending received offers */}
      {canSellerAct && selectedOffer !== offer.id && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => handleResponse("accept")}
            disabled={respondToOffer.isPending}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-full font-semibold transition-all text-sm sm:text-base"
          >
            Accept
          </button>
          <button
            onClick={() => setSelectedOffer(offer.id)}
            className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 rounded-full font-semibold transition-all text-sm sm:text-base"
          >
            Counter
          </button>
          <button
            onClick={() => handleResponse("reject")}
            disabled={respondToOffer.isPending}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 rounded-full font-semibold transition-all text-sm sm:text-base"
          >
            Decline
          </button>
        </div>
      )}

      {/* Counter input form */}
      {canSellerAct && selectedOffer === offer.id && (
        <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <label className="block text-sm font-medium mb-2 text-white">
            Counter offer amount
          </label>
          <p className="text-[11px] text-white/50 mb-2">
            Buyer offered ₦{offerAmt.toLocaleString()} · Listed ₦
            {listed.toLocaleString()}
          </p>
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
              ₦
            </span>
            <input
              type="number"
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
              placeholder="Enter counter amount"
              className="w-full pl-8 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 text-white"
              min="0"
              step="1000"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedOffer(null);
                setCounterAmount("");
              }}
              className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-full font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => handleResponse("counter")}
              disabled={respondToOffer.isPending || !counterAmount}
              className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 rounded-full font-semibold transition-all"
            >
              {respondToOffer.isPending ? "Sending..." : "Send Counter"}
            </button>
          </div>
        </div>
      )}

      {/* Buyer accepts seller's counter */}
      {canBuyerAcceptCounter && (
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            onClick={handleAcceptCounter}
            disabled={makeOffer.isPending}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-full font-semibold transition-all text-sm sm:text-base"
          >
            {makeOffer.isPending
              ? "Sending..."
              : `Accept counteroffer of ${formatNGN(counterAmt)}`}
          </button>
          <button
            onClick={() => router.push(`/marketplace/${offer.productId}`)}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full font-semibold transition-all text-sm sm:text-base"
          >
            Send a new offer
          </button>
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        {offer.conversationId && (
          <button
            onClick={() => router.push(`/messages/${offer.conversationId}`)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-blue-600/50 py-2 text-sm font-medium text-blue-300 hover:bg-blue-900/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            {tab === "sent"
              ? `Chat with @${counterparty}`
              : `Reply to @${counterparty}`}
          </button>
        )}

        {offer.status === "accepted" && tab === "sent" && !offer.orderId && (
          <button
            onClick={() =>
              router.push(`/marketplace/${offer.productId}?offerId=${offer.id}`)
            }
            className="flex-1 py-2 bg-green-500 hover:bg-green-600 rounded-full font-semibold transition-all text-white text-sm"
          >
            Complete Purchase →
          </button>
        )}
      </div>
    </div>
  );
}

function PriceCell({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: number;
  accent?: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-white/40">
        {label}
      </div>
      <div
        className={`font-semibold ${accent ?? (muted ? "text-white/70" : "text-white")}`}
      >
        ₦{value.toLocaleString()}
      </div>
    </div>
  );
}
