/**
 * BuyerIntentActions Component
 * Shows "Make Offer" or "Request to Buy" buttons based on product negotiability
 */

"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/services/marketplace.service";
import { useMakeOffer, useCreateOrder } from "@/hooks/useMarketplace";
import { chatService } from "@/services/chat.service";
import { toast } from "sonner";
import { formatNGN, getOfferToast } from "@/lib/marketplaceMessages";

/** Shared light / glass offer modal — matches marketplace doodle + brand greens */
function MakeOfferDialog({
  open,
  zOverlayClass,
  listedPriceLabel,
  offerAmount,
  onOfferAmountChange,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  zOverlayClass: string;
  listedPriceLabel: string;
  offerAmount: string;
  onOfferAmountChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zOverlayClass} flex items-end justify-center sm:items-center`}
      role="presentation"
    >
      <button
        type="button"
        className="doodle-modal-backdrop absolute inset-0 transition-opacity"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="make-offer-title"
        className="doodle-modal-panel relative z-10 flex max-h-[min(92vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border border-[var(--border-light)] shadow-[0_24px_60px_rgba(0,111,53,0.18)] dark:border-[var(--neu-shadow-dark)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.5)] sm:mx-4 sm:max-h-[85vh] sm:rounded-[28px] sm:rounded-b-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="doodle-modal-panel-wash z-0" aria-hidden />
        <div className="doodle-modal-ambient z-0 motion-safe:animate-soft-float" aria-hidden>
          <div className="doodle-modal-ambient-float" />
        </div>

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-11 rounded-full bg-black/15 dark:bg-white/25" aria-hidden />
        </div>

        <div className="overflow-y-auto overscroll-contain px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3 id="make-offer-title" className="text-lg font-bold tracking-tight" style={{ color: "var(--neu-text)" }}>
              Make an offer
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="mod-chip grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--neu-text-secondary)" }}>
                close
              </span>
            </button>
          </div>

          <p className="mb-1 text-sm font-medium text-brand-green-dark/70 dark:text-white/65">
            Listed price
          </p>
          <p className="mb-4 text-lg font-extrabold tabular-nums text-[#006F35] dark:text-primary">
            {listedPriceLabel}
          </p>

          <label htmlFor="offer-amount-input" className="mb-2 block text-sm font-semibold" style={{ color: "var(--neu-text)" }}>
            Your offer amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-semibold text-[#006F35] dark:text-primary">
              ₦
            </span>
            <input
              id="offer-amount-input"
              type="number"
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              value={offerAmount}
              onChange={(e) => onOfferAmountChange(e.target.value)}
              placeholder="0"
              className="min-h-[52px] w-full rounded-2xl border-2 border-[var(--border-light)] bg-[var(--surface-light)] py-3 pl-10 pr-4 text-base font-semibold tabular-nums text-brand-black shadow-inner placeholder:text-brand-green-dark/70/40 transition-shadow focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-primary dark:focus:ring-emerald-400/15"
              min="0"
              step="1000"
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-brand-green-dark/70 dark:text-white/50">
            The seller will be notified and can accept, reject, or counter your offer.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-[var(--border-light)] bg-[var(--neu-bg)]/88 p-4 backdrop-blur-xl safe-area-bottom dark:border-white/10 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] w-full shrink-0 rounded-full border border-[var(--border-light)] bg-white px-4 text-sm font-bold text-brand-black shadow-sm transition-transform active:scale-[0.99] dark:border-white/15 dark:bg-white/10 dark:text-white sm:min-w-0 sm:flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={isSubmitting || !offerAmount.trim()}
            className="min-h-[48px] w-full shrink-0 rounded-full bg-gradient-to-r from-primary to-[#006F35] px-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,212,49,0.35)] transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none dark:from-emerald-500 dark:to-teal-600 sm:min-w-0 sm:flex-1"
          >
            {isSubmitting ? "Sending…" : "Send offer"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

interface BuyerIntentActionsProps {
  product: Product;
  currentUserId?: string;
  isOwner: boolean;
  /** Tighter pill buttons for marketplace grid cards */
  layout?: "default" | "compact";
  /** Token present but profile not loaded yet — avoids flashing "Log in" */
  authPending?: boolean;
}

export function BuyerIntentActions({
  product,
  currentUserId,
  isOwner,
  layout = "default",
  authPending = false,
}: BuyerIntentActionsProps) {
  const router = useRouter();
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [contactingSeller, setContactingSeller] = useState(false);
  
  const makeOffer = useMakeOffer(product.id);
  const createOrder = useCreateOrder();

  const handleContactSeller = async () => {
    if (!product.id || contactingSeller) return;
    setContactingSeller(true);

    const navigateToConv = (res: any) => {
      const payload = (res as any)?.data ?? res;
      const conv =
        payload?.data?.conversation ??
        payload?.conversation ??
        payload;
      const convId = conv?._id ?? conv?.id ?? conv?.conversationId;
      if (!convId) {
        toast.error("Could not start conversation with seller");
        return false;
      }
      router.push(`/chat/${convId}`);
      return true;
    };

    try {
      // Try the new marketplace-aware endpoint first.
      // Falls back to plain DM if the backend hasn't deployed it yet (404).
      try {
        const res = await chatService.startMarketplaceConversation(product.id);
        if (navigateToConv(res)) return;
      } catch (firstErr: any) {
        const status = firstErr?.response?.status;
        // 404 here means the route isn't deployed yet — fall back gracefully.
        // Any other status is a real error (400 = own product, 410 = unavailable).
        if (status === 400) {
          toast.error("You can't message yourself about your own listing.");
          return;
        }
        if (status === 410) {
          toast.error("This product is no longer available.");
          return;
        }
        if (status !== 404 && status !== undefined) {
          toast.error(
            firstErr?.response?.data?.message || firstErr?.message || "Could not contact seller"
          );
          return;
        }
        // 404 (route not yet on backend) → fall through to legacy DM flow
      }

      if (!product.sellerId) {
        toast.error("Seller information is unavailable.");
        return;
      }
      const res = await chatService.getOrCreateDirectConversation(product.sellerId);
      navigateToConv(res);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Could not contact seller");
    } finally {
      setContactingSeller(false);
    }
  };

  // Don't show if user is the owner or product is sold
  if (isOwner || product.status === "sold") {
    return null;
  }

  if (authPending) {
    if (layout === "compact") {
      return (
        <div className="flex w-full flex-col gap-2 sm:flex-row" aria-busy="true" aria-label="Loading account">
          <div className="min-h-[44px] flex-1 animate-pulse rounded-full bg-[var(--surface-light)] sm:min-h-[40px] dark:bg-white/10" />
          <div className="min-h-[44px] flex-1 animate-pulse rounded-full bg-[var(--surface-light)] sm:min-h-[40px] dark:bg-white/10" />
        </div>
      );
    }
    return (
      <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading account">
        <div className="h-12 w-full animate-pulse rounded-lg bg-brand-surface dark:bg-brand-black" />
        <div className="h-11 w-full animate-pulse rounded-lg bg-brand-surface dark:bg-brand-black" />
      </div>
    );
  }

  // User must be logged in
  if (!currentUserId) {
    if (layout === "compact") {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push("/login");
          }}
          className="w-full rounded-full border border-[var(--border-light)] bg-[var(--surface-light)] py-2.5 text-center text-xs font-semibold text-[#006F35] shadow-[0_2px_12px_rgba(0,111,53,0.08)] backdrop-blur-xl transition-transform active:scale-[0.98] hover:bg-white dark:border-white/15 dark:bg-white/[0.08] dark:text-white dark:shadow-[0_0_24px_rgba(0,212,49,0.12)] dark:hover:bg-white/[0.12]"
        >
          Log in to buy
        </button>
      );
    }
    return (
      <div className="mt-6 space-y-3">
        <button
          onClick={() => router.push("/login")}
          className="w-full py-4 bg-primary hover:bg-brand-green-dark text-white font-semibold rounded-lg transition-colors"
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
          router.push(`/chat/${order.conversationId}`);
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
      const res = await makeOffer.mutateAsync(amount);
      setShowOfferDialog(false);
      setOfferAmount("");

      // Navigate to the unified chat thread if the backend returned a conversationId
      const payload = (res as any)?.data ?? (res as any);
      const conversationId =
        payload?.data?.conversationId ??
        payload?.conversationId ??
        payload?.data?.conversation?._id ??
        payload?.conversation?._id;

      if (conversationId) {
        toast.success(
          `${getOfferToast({ action: 'new', amount, actorRole: 'buyer' }, 'buyer')} You are awaiting the seller's response.`,
        );
        router.push(`/chat/${conversationId}`);
      } else {
        toast.success(
          `You placed an offer of ${formatNGN(amount)} and are awaiting the seller's response.`,
        );
      }
    } catch (error) {
      // Error toast shown by hook
    }
  };

  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: product.currency || "NGN",
    minimumFractionDigits: 0,
  }).format(product.price);

  if (layout === "compact") {
    const busy = createOrder.isPending || makeOffer.isPending;
    const offerLabel = product.negotiable ? "Offer" : "Buy";
    return (
      <Fragment>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleRequestToBuy();
            }}
            disabled={busy}
            className="relative flex min-h-[44px] w-full min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-primary/35 bg-gradient-to-r from-primary/18 to-[#006F35]/14 px-2.5 py-2.5 text-xs font-bold tracking-tight text-[#006F35] shadow-[0_4px_18px_rgba(0,212,49,0.18)] backdrop-blur-xl transition-transform active:scale-[0.98] disabled:opacity-45 sm:min-h-[40px] sm:px-3 dark:border-primary/25 dark:from-emerald-500/25 dark:to-teal-500/20 dark:text-emerald-100 dark:shadow-[0_0_28px_rgba(0,212,49,0.18)]"
          >
            {createOrder.isPending || makeOffer.isPending ? (
              <span className="material-symbols-outlined animate-spin shrink-0 text-[18px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined shrink-0 text-[16px]" style={{ fontVariationSettings: '"FILL" 0' }}>
                payments
              </span>
            )}
            <span className="truncate">{busy ? "…" : offerLabel}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleContactSeller();
            }}
            disabled={contactingSeller}
            className="flex min-h-[44px] w-full min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--border-light)] bg-white/85 px-2.5 py-2.5 text-xs font-bold text-brand-black shadow-[0_2px_12px_rgba(0,111,53,0.06)] backdrop-blur-xl transition-transform active:scale-[0.98] disabled:opacity-50 sm:min-h-[40px] sm:px-3 dark:border-white/15 dark:bg-white/[0.08] dark:text-white/95 dark:shadow-inner"
          >
            <span className="material-symbols-outlined shrink-0 text-[16px]">chat</span>
            <span className="truncate">{contactingSeller ? "…" : "Chat"}</span>
          </button>
        </div>

        <MakeOfferDialog
          open={showOfferDialog}
          zOverlayClass="z-[80]"
          listedPriceLabel={formattedPrice}
          offerAmount={offerAmount}
          onOfferAmountChange={setOfferAmount}
          onClose={() => {
            setShowOfferDialog(false);
            setOfferAmount("");
          }}
          onSubmit={() => void handleMakeOffer()}
          isSubmitting={makeOffer.isPending}
        />
      </Fragment>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {/* Main Action Button */}
      <button
        type="button"
        onClick={() => void handleRequestToBuy()}
        disabled={createOrder.isPending || makeOffer.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 font-semibold text-white transition-colors hover:bg-brand-green-dark disabled:bg-brand-surface"
      >
        {createOrder.isPending ? (
          <>
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            {product.negotiable ? (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Make Offer
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Request to Buy
              </>
            )}
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => void handleContactSeller()}
        disabled={contactingSeller}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {contactingSeller ? "Opening chat..." : "Contact Seller"}
      </button>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.push("/marketplace/my-orders")}
          className="flex-1 rounded-lg bg-brand-black px-4 py-2 text-sm text-white transition-colors hover:bg-brand-black"
        >
          My Orders
        </button>
        <button
          type="button"
          onClick={() => router.push("/marketplace/my-offers")}
          className="flex-1 rounded-lg bg-brand-black px-4 py-2 text-sm text-white transition-colors hover:bg-brand-black"
        >
          My Offers
        </button>
      </div>

      <MakeOfferDialog
        open={showOfferDialog}
        zOverlayClass="z-50"
        listedPriceLabel={formattedPrice}
        offerAmount={offerAmount}
        onOfferAmountChange={setOfferAmount}
        onClose={() => {
          setShowOfferDialog(false);
          setOfferAmount("");
        }}
        onSubmit={() => void handleMakeOffer()}
        isSubmitting={makeOffer.isPending}
      />
    </div>
  );
}
