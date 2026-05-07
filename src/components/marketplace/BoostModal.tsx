"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useGamification";
import { useBoostProduct } from "@/hooks/useMarketplace";

/** Boost durations and their HuudCoin costs — must match backend BOOST_COSTS */
const BOOST_OPTIONS = [
  { label: "3 Days",  days: 3  as const, coins: 300,  popular: false },
  { label: "7 Days",  days: 7  as const, coins: 500,  popular: true  },
  { label: "14 Days", days: 14 as const, coins: 900,  popular: false },
  { label: "30 Days", days: 30 as const, coins: 1500, popular: false },
];

interface Props {
  productId: string;
  productTitle: string;
  /** Pass true when the listing is already actively boosted */
  alreadyBoosted?: boolean;
  /** ISO date string — current boost expiry, if any */
  boostedUntil?: string;
  onClose: () => void;
}

export function BoostModal({
  productId,
  productTitle,
  alreadyBoosted = false,
  boostedUntil,
  onClose,
}: Props) {
  const [selectedDays, setSelectedDays] = useState<3 | 7 | 14 | 30>(7);
  const [boosted, setBoosted] = useState(false);

  const { data: walletRaw } = useWallet();
  const walletCoins: number =
    (walletRaw as any)?.balance ?? (walletRaw as any)?.coins ?? 0;

  const selected = BOOST_OPTIONS.find((o) => o.days === selectedDays)!;
  const hasEnough = walletCoins >= selected.coins;

  const { mutate: boost, isPending } = useBoostProduct();

  function handleBoost() {
    boost(
      { productId, days: selectedDays },
      {
        onSuccess: () => {
          setBoosted(true);
        },
      },
    );
  }

  /* ── Success Screen ─────────────────────────────────────────── */
  if (boosted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-[#1a1a2e] rounded-2xl border border-amber-500/40 shadow-2xl p-8 flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">🚀</div>
          <h2 className="text-xl font-bold text-white">
            {alreadyBoosted ? "Boost Extended!" : "Listing Boosted!"}
          </h2>
          <p className="text-gray-400 text-sm">
            <span className="text-amber-400 font-semibold">{productTitle}</span>{" "}
            will appear at the top of search results for{" "}
            <span className="text-white font-semibold">{selectedDays} days</span>.
          </p>
          <p className="text-xs text-gray-500">
            {selected.coins} HuudCoins deducted
          </p>
          <button
            onClick={onClose}
            className="mt-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  /* ── Main Modal ─────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1a2e] rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-white">
              {alreadyBoosted ? "Extend Boost" : "Boost Listing"} 🚀
            </h2>
            <p className="text-sm text-gray-400 truncate max-w-[260px]">
              {productTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Current boost notice */}
          {alreadyBoosted && boostedUntil && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300">
              <span>🔥</span>
              <span>
                Currently boosted until{" "}
                <strong>
                  {new Date(boostedUntil).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
                . Adding days extends from that date.
              </span>
            </div>
          )}

          {/* HuudCoin wallet balance */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0f0f1e] border border-gray-700">
            <span className="text-gray-400 text-sm">Your HuudCoins</span>
            <span className={`font-bold text-base ${hasEnough ? "text-amber-400" : "text-red-400"}`}>
              🪙 {walletCoins.toLocaleString()}
            </span>
          </div>

          {/* Duration selector */}
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-3">Select Duration</p>
            <div className="grid grid-cols-2 gap-2">
              {BOOST_OPTIONS.map((opt) => {
                const affordable = walletCoins >= opt.coins;
                const isSelected = selectedDays === opt.days;
                return (
                  <button
                    key={opt.days}
                    onClick={() => setSelectedDays(opt.days)}
                    className={`relative p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-amber-400 bg-amber-400/10 text-white"
                        : affordable
                        ? "border-gray-600 bg-[#0f0f1e] text-gray-400 hover:border-gray-500"
                        : "border-gray-700 bg-[#0f0f1e] text-gray-600 cursor-default"
                    }`}
                  >
                    {opt.popular && (
                      <span className="absolute -top-2 right-2 text-[10px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded-full leading-tight">
                        POPULAR
                      </span>
                    )}
                    <div className="font-semibold">{opt.label}</div>
                    <div className={`text-sm flex items-center gap-1 ${isSelected ? "text-amber-400" : affordable ? "text-gray-500" : "text-gray-700"}`}>
                      🪙 {opt.coins.toLocaleString()} coins
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Insufficient coins notice */}
          {!hasEnough && (
            <p className="text-xs text-red-400 text-center">
              You need{" "}
              <strong>{selected.coins - walletCoins} more HuudCoins</strong> to
              boost for {selected.label.toLowerCase()}. Earn coins by posting,
              commenting, completing jobs, and helping neighbours.
            </p>
          )}

          {/* Summary row */}
          <div className="rounded-xl bg-[#0f0f1e] border border-gray-700 px-4 py-3 flex items-center justify-between">
            <span className="text-gray-400 text-sm">Cost</span>
            <span className="font-bold text-white text-lg flex items-center gap-1">
              🪙 {selected.coins.toLocaleString()} HuudCoins
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={handleBoost}
            disabled={isPending || !hasEnough}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Boosting…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">rocket_launch</span>
                {alreadyBoosted ? "Extend Boost" : "Boost Now"} — {selected.coins} coins
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-600">
            Boosted listings appear at the top of the marketplace. No real money is charged.
          </p>
        </div>
      </div>
    </div>
  );
}
