"use client";

/**
 * My Offers Page
 * View all offers (sent and received)
 */

import { useState } from "react";
import { useMyOffers, useRespondToOffer } from "@/hooks/useMarketplace";
import { useRouter } from "next/navigation";
import { MarketplaceOffer } from "@/types/api";

export default function MyOffersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"sent" | "received">("sent");
  const [counterAmount, setCounterAmount] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMyOffers(tab);

  const offers = data?.pages.flatMap((page: any) => 
    page?.data?.offers || page?.offers || []
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1e] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      accepted: "bg-green-500",
      rejected: "bg-red-500",
      countered: "bg-blue-500",
      expired: "bg-gray-500",
      cancelled: "bg-gray-600",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-[#0f0f1e] text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-green-400 text-3xl">local_offer</span>
            <h1 className="text-3xl font-bold">My Offers</h1>
          </div>
          <p className="text-gray-400 mt-2">Your negotiations</p>
        </div>

        {/* Navigation Tabs */}
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

        {/* Sent/Received Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-900/50 p-1.5 rounded-2xl border border-gray-800">
          <button
            onClick={() => setTab("sent")}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
              tab === "sent" 
                ? "bg-green-500 text-white" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Offers Sent
          </button>
          <button
            onClick={() => setTab("received")}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
              tab === "received" 
                ? "bg-green-500 text-white" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Offers Received
          </button>
        </div>

        {/* Offers List */}
        {offers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-500 text-[48px]">handshake</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No {tab === "sent" ? "Sent" : "Received"} Offers
            </h3>
            <p className="text-gray-400 mb-6">
              {tab === "sent" 
                ? "You haven't made any offers yet"
                : "You haven't received any offers yet"}
            </p>
            <button
              onClick={() => router.push("/marketplace")}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-full font-semibold transition-all text-white"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer: MarketplaceOffer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                tab={tab}
                router={router}
                selectedOffer={selectedOffer}
                setSelectedOffer={setSelectedOffer}
                counterAmount={counterAmount}
                setCounterAmount={setCounterAmount}
              />
            ))}

            {/* Load More */}
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
  );
}

// Offer Card Component
function OfferCard({
  offer,
  tab,
  router,
  selectedOffer,
  setSelectedOffer,
  counterAmount,
  setCounterAmount,
}: {
  offer: MarketplaceOffer;
  tab: "sent" | "received";
  router: any;
  selectedOffer: string | null;
  setSelectedOffer: (id: string | null) => void;
  counterAmount: string;
  setCounterAmount: (amount: string) => void;
}) {
  const respondToOffer = useRespondToOffer(offer.id);

  const handleResponse = async (action: "accept" | "reject" | "counter") => {
    try {
      await respondToOffer.mutateAsync({
        action,
        counterAmount: action === "counter" ? parseFloat(counterAmount) : undefined,
      });
      setSelectedOffer(null);
      setCounterAmount("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      accepted: "bg-green-500",
      rejected: "bg-red-500",
      countered: "bg-blue-500",
      expired: "bg-gray-500",
      cancelled: "bg-gray-600",
    };
    return colors[status] || "bg-gray-500";
  };

  const showActions = tab === "received" && offer.status === "pending";

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800/50">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-800/50 flex-shrink-0">
          {offer.product?.images?.[0] ? (
            <img
              src={offer.product.images[0]}
              alt={offer.product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-600 text-[32px]">inventory_2</span>
            </div>
          )}
        </div>

        {/* Offer Info */}
        <div className="flex-1 min-w-0">
          <h3
            onClick={() => router.push(`/marketplace/${offer.productId}`)}
            className="font-semibold text-lg truncate text-white hover:text-green-400 cursor-pointer transition-colors"
          >
            {offer.product?.title || "Product"}
          </h3>
          <p className="text-white/70 text-sm flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-[14px]">person</span>
            {tab === "sent"
              ? `${offer.seller?.username || offer.seller?.firstName || "Unknown"}`
              : `${offer.buyer?.username || offer.buyer?.firstName || "Unknown"}`}
          </p>
          
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-white/60">Listed: ₦{offer.product?.price.toLocaleString()}</span>
              <span className="text-green-400 font-semibold">
                Offer: ₦{offer.offerAmount.toLocaleString()}
              </span>
              {offer.counterOfferAmount && (
                <span className="text-blue-400 font-semibold">
                  Counter: ₦{offer.counterOfferAmount.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(offer.status)}`}>
                {offer.status.toUpperCase()}
              </span>
              <span className="text-xs text-white/50 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                {new Date(offer.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions (for received pending offers) */}
      {showActions && selectedOffer !== offer.id && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => handleResponse("accept")}
            disabled={respondToOffer.isPending}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-full font-semibold transition-all"
          >
            Accept
          </button>
          <button
            onClick={() => setSelectedOffer(offer.id)}
            className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-full font-semibold transition-all"
          >
            Counter
          </button>
          <button
            onClick={() => handleResponse("reject")}
            disabled={respondToOffer.isPending}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 rounded-full font-semibold transition-all"
          >
            Reject
          </button>
        </div>
      )}

      {/* Counter Offer Form */}
      {showActions && selectedOffer === offer.id && (
        <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <label className="block text-sm font-medium mb-2 text-white">Counter Offer Amount</label>
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">₦</span>
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
              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-full font-semibold transition-all"
            >
              {respondToOffer.isPending ? "Sending..." : "Send Counter"}
            </button>
          </div>
        </div>
      )}

      {/* Accepted Offer - Create Order Button */}
      {offer.status === "accepted" && tab === "sent" && !offer.orderId && (
        <div className="mt-4">
          <button
            onClick={() => router.push(`/marketplace/${offer.productId}?offerId=${offer.id}`)}
            className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-full font-semibold transition-all text-white"
          >
            Complete Purchase
          </button>
        </div>
      )}
    </div>
  );
}
