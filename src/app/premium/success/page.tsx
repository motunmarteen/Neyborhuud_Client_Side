"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useVerifyPayment } from "@/hooks/usePayments";

function SuccessInner() {
  const searchParams = useSearchParams();
  // Paystack returns both ?reference= and ?trxref=
  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useVerifyPayment(reference);
  const payment = (data as any)?.data ?? data;
  const isSuccess =
    payment?.status === "completed" || payment?.status === "processing";

  // Refresh user profile so tier badge updates everywhere
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    }
  }, [isSuccess, queryClient]);

  if (!reference) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1e] text-white px-4">
        <div className="text-center">
          <p className="text-gray-400 mb-6">No payment reference found.</p>
          <Link
            href="/premium"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm transition-colors"
          >
            Back to Premium
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1e] text-white px-4">
      <div className="w-full max-w-sm text-center">
        {/* Loading */}
        {isLoading && (
          <>
            <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-400 rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-xl font-bold mb-2">Verifying Payment</h1>
            <p className="text-gray-400 text-sm">
              Please wait while we confirm your payment…
            </p>
          </>
        )}

        {/* Success */}
        {!isLoading && isSuccess && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-green-400 text-5xl">
                check_circle
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-green-400">
              Payment Successful!
            </h1>
            <p className="text-gray-400 text-sm mb-8">
              Your payment has been confirmed and your account has been updated.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/premium"
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm transition-colors"
              >
                View Plan
              </Link>
              <Link
                href="/feed"
                className="px-5 py-2.5 bg-green-500 hover:bg-green-600 rounded-xl text-sm font-semibold transition-colors"
              >
                Go to Feed
              </Link>
            </div>
          </>
        )}

        {/* Failure / error */}
        {!isLoading && !isSuccess && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-red-400 text-5xl">
                cancel
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-400">
              {isError ? "Verification Failed" : "Payment Failed"}
            </h1>
            <p className="text-gray-400 text-sm mb-8">
              {isError
                ? "We could not verify your payment. If money was deducted, please contact support."
                : "Your payment was not successful. Please try again."}
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/premium"
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm transition-colors"
              >
                Try Again
              </Link>
              <a
                href="mailto:support@neyborhuud.com"
                className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm transition-colors"
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

export default function PremiumSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f1e]">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-400 rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
