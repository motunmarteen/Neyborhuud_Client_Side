"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useVerifyPayment } from "@/hooks/usePayments";
import type { Payment } from "@/types/api";

function SuccessInner() {
  const searchParams = useSearchParams();
  // HuudCoin refs start with "hc_"; legacy Paystack refs are kept for compatibility
  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useVerifyPayment(reference);
  const payment = ((data as any)?.data ?? data) as Payment | null;
  const isSuccess = payment?.status === "completed";

  // Refresh wallet balance + gamification stats after confirmed spend
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["gamification", "wallet"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    }
  }, [isSuccess, queryClient]);

  if (!reference) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black text-white px-4">
        <div className="text-center">
          <p className="text-[var(--neu-text-muted)] mb-6">No transaction reference found.</p>
          <Link
            href="/gamification/wallet"
            className="px-6 py-3 bg-brand-black hover:bg-brand-surface rounded-xl text-sm transition-colors"
          >
            View Wallet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-black text-white px-4">
      <div className="w-full max-w-sm text-center">

        {/* Loading */}
        {isLoading && (
          <>
            <div className="w-16 h-16 border-4 border-black/[0.08] border-t-primary rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-xl font-bold mb-2">Confirming Transaction</h1>
            <p className="text-[var(--neu-text-muted)] text-sm">Just a moment…</p>
          </>
        )}

        {/* Success */}
        {!isLoading && isSuccess && (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🪙</span>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-primary">
              HuudCoins Spent!
            </h1>
            {payment?.coinsSpent && (
              <p className="text-[var(--neu-text-muted)] text-base font-semibold mb-1">
                {payment.coinsSpent} HuudCoins deducted
              </p>
            )}
            {payment?.description && (
              <p className="text-[var(--neu-text-muted)] text-sm mb-6">{payment.description}</p>
            )}
            <p className="text-[var(--neu-text-muted)] text-xs mb-8 font-mono">{reference}</p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/gamification/wallet"
                className="px-5 py-2.5 bg-brand-black hover:bg-brand-surface rounded-xl text-sm transition-colors"
              >
                View Wallet
              </Link>
              <Link
                href="/feed"
                className="px-5 py-2.5 bg-primary hover:bg-primary text-black rounded-xl text-sm font-bold transition-colors"
              >
                Go to Feed
              </Link>
            </div>
          </>
        )}

        {/* Failure / error */}
        {!isLoading && !isSuccess && (
          <>
            <div className="w-20 h-20 rounded-full bg-brand-red/20 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-brand-red text-5xl">
                cancel
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-brand-red">
              {isError ? "Transaction Not Found" : "Transaction Failed"}
            </h1>
            <p className="text-[var(--neu-text-muted)] text-sm mb-8">
              {isError
                ? "We could not find this transaction. If coins were deducted, contact support."
                : "The transaction did not complete. Your coins have not been deducted."}
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/gamification/wallet"
                className="px-5 py-2.5 bg-brand-black hover:bg-brand-surface rounded-xl text-sm transition-colors"
              >
                View Wallet
              </Link>
              <a
                href="mailto:support@neyborhuud.com"
                className="px-5 py-2.5 bg-brand-red/20 hover:bg-brand-red/30 text-brand-red rounded-xl text-sm transition-colors"
              >
                Contact Support
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-black">
          <div className="w-16 h-16 border-4 border-black/[0.08] border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
