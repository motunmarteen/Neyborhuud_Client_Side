"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useInitiatePayment } from "@/hooks/usePayments";
import { useWallet } from "@/hooks/useGamification";

const BOOST_OPTIONS = [
  { label: "3 Days", days: 3, price: 500 },
  { label: "7 Days", days: 7, price: 1000 },
  { label: "14 Days", days: 14, price: 2000 },
  { label: "30 Days", days: 30, price: 3500 },
] as const;

interface Props {
  productId: string;
  productTitle: string;
  onClose: () => void;
}

export function BoostModal({ productId, productTitle, onClose }: Props) {
  const [selectedDays, setSelectedDays] = useState<3 | 7 | 14 | 30>(7);
  const [payMethod, setPayMethod] = useState<"huudcoins" | "card">("card");

  const { data: walletRaw } = useWallet();
  const walletCoins: number =
    (walletRaw as any)?.coins ?? (walletRaw as any)?.balance ?? 0;

  const selected = BOOST_OPTIONS.find((o) => o.days === selectedDays)!;
  const canPayWithCoins = walletCoins >= selected.price;

  const { mutate: initiatePayment, isPending } = useInitiatePayment();

  function handleBoost() {
    if (payMethod === "huudcoins") {
      toast.info(
        "HuudCoins payment coming soon. Please use Card (Paystack) for now.",
      );
      return;
    }
    initiatePayment(
      {
        type: "listing_boost",
        amount: selected.price,
        currency: "NGN",
        metadata: { productId, duration: selectedDays },
      },
      {
        onError: () =>
          toast.error("Payment initiation failed. Please try again."),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1a2e] rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-white">Boost Listing</h2>
            <p className="text-sm text-gray-400 truncate max-w-[260px]">
              {productTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Duration selector */}
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-3">
              Select Duration
            </p>
            <div className="grid grid-cols-2 gap-2">
              {BOOST_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() =>
                    setSelectedDays(opt.days as 3 | 7 | 14 | 30)
                  }
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedDays === opt.days
                      ? "border-amber-400 bg-amber-400/10 text-white"
                      : "border-gray-600 bg-[#0f0f1e] text-gray-400 hover:border-gray-500"
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div
                    className={`text-sm ${selectedDays === opt.days ? "text-amber-400" : "text-gray-500"}`}
                  >
                    ₦{opt.price.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-3">
              Pay With
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => canPayWithCoins && setPayMethod("huudcoins")}
                className={`flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  payMethod === "huudcoins"
                    ? "border-yellow-400 bg-yellow-400/10 text-white"
                    : "border-gray-600 bg-[#0f0f1e] text-gray-400"
                } ${!canPayWithCoins ? "opacity-40 cursor-not-allowed" : "hover:border-gray-500"}`}
              >
                <span className="text-lg">🪙</span>
                <div className="text-left">
                  <div className="text-sm font-semibold">HuudCoins</div>
                  <div className="text-xs text-gray-500">
                    {canPayWithCoins
                      ? `${walletCoins.toLocaleString()} available`
                      : "Insufficient"}
                  </div>
                </div>
              </button>
              <button
                onClick={() => setPayMethod("card")}
                className={`flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  payMethod === "card"
                    ? "border-green-400 bg-green-400/10 text-white"
                    : "border-gray-600 bg-[#0f0f1e] text-gray-400 hover:border-gray-500"
                }`}
              >
                <span className="text-lg">💳</span>
                <div className="text-left">
                  <div className="text-sm font-semibold">Card</div>
                  <div className="text-xs text-gray-500">Paystack</div>
                </div>
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-[#0f0f1e] border border-gray-700 px-4 py-3 flex items-center justify-between">
            <span className="text-gray-400 text-sm">Total</span>
            <span className="font-bold text-white text-lg">
              ₦{selected.price.toLocaleString()}
            </span>
          </div>

          {/* Boost Now button */}
          <button
            onClick={handleBoost}
            disabled={isPending}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 disabled:text-amber-500/60 text-black font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">
                  rocket_launch
                </span>
                Boost Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
