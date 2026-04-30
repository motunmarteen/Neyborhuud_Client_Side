/**
 * BuyerIntentActions Component
 * Shows "Make Offer" or "Request to Buy" buttons based on product negotiability
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/services/marketplace.service";
import { useMakeOffer, useCreateOrder } from "@/hooks/useMarketplace";

interface BuyerIntentActionsProps {
  product: Product;
  currentUserId?: string;
  isOwner: boolean;
}

export function BuyerIntentActions({
  product,
  currentUserId,
  isOwner,
}: BuyerIntentActionsProps) {
  const router = useRouter();
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  
  const makeOffer = useMakeOffer(product.id);
  const createOrder = useCreateOrder();

  // Don't show if user is the owner or product is sold
  if (isOwner || product.status === "sold") {
    return null;
  }

  // User must be logged in
  if (!currentUserId) {
    return (
      <div className="mt-6 space-y-3">
        <button
          onClick={() => router.push("/login")}
          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
        >
          Login to Buy
        </button>
      </div>
    );
  }

  const handleRequestToBuy = async () => {
    if (!product.negotiable) {
      // Fixed-price product - create order directly
      try {
        const response = await createOrder.mutateAsync({ productId: product.id });
        const order = (response as any)?.data?.order || (response as any)?.order;
        
        if (order?.conversationId) {
          // Redirect to chat
          router.push(`/messages/${order.conversationId}`);
        }
      } catch (error) {
        // Error toast shown by hook
      }
    } else {
      // Negotiable product - show offer dialog
      setShowOfferDialog(true);
    }
  };

  const handleMakeOffer = async () => {
    const amount = parseFloat(offerAmount);
    
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    try {
      await makeOffer.mutateAsync(amount);
      setShowOfferDialog(false);
      setOfferAmount("");
    } catch (error) {
      // Error toast shown by hook
    }
  };

  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: product.currency || "NGN",
    minimumFractionDigits: 0,
  }).format(product.price);

  return (
    <div className="mt-6 space-y-3">
      {/* Main Action Button */}
      <button
        onClick={handleRequestToBuy}
        disabled={createOrder.isPending || makeOffer.isPending}
        className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {createOrder.isPending ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            {product.negotiable ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Make Offer
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Request to Buy
              </>
            )}
          </>
        )}
      </button>

      {/* Contact Seller Button */}
      <button
        onClick={() => router.push(`/messages/new?sellerId=${product.sellerId}`)}
        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Contact Seller
      </button>

      {/* View My Orders/Offers */}
      <div className="flex gap-2">
        <button
          onClick={() => router.push("/marketplace/my-orders")}
          className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-sm text-white rounded-lg transition-colors"
        >
          My Orders
        </button>
        <button
          onClick={() => router.push("/marketplace/my-offers")}
          className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-sm text-white rounded-lg transition-colors"
        >
          My Offers
        </button>
      </div>

      {/* Offer Dialog */}
      {showOfferDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Make an Offer</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Listed Price: {formattedPrice}</p>
              <label className="block text-sm font-medium mb-2">Your Offer Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="Enter your offer"
                  className="w-full pl-8 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 text-white"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Seller will be notified and can accept, reject, or counter
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOfferDialog(false);
                  setOfferAmount("");
                }}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMakeOffer}
                disabled={makeOffer.isPending || !offerAmount}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                {makeOffer.isPending ? "Sending..." : "Send Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
