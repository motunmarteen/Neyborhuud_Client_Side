"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useGamification";
import Image from "next/image";

const TIP_AMOUNTS = [
  { value: 50,  label: "50",  description: "A kind nod 👋",    color: "amber" },
  { value: 100, label: "100", description: "Cheers! 🙌",       color: "orange", popular: true },
  { value: 200, label: "200", description: "Awesome stuff 🌟",  color: "rose" },
  { value: 500, label: "500", description: "Community MVP 🏆",  color: "purple" },
] as const;

type TipAmount = 50 | 100 | 200 | 500;

interface Recipient {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  profilePicture?: string;
  trustScore?: number;
  /** e.g. "bronze" | "silver" | "gold" | "platinum" */
  tier?: string;
}

interface Props {
  recipient: Recipient;
  onConfirm: (amount: TipAmount) => void;
  isPending: boolean;
  onClose: () => void;
}

const TIER_COLORS: Record<string, string> = {
  bronze:   "text-amber-700 bg-amber-100 border-amber-300",
  silver:   "text-slate-600 bg-slate-100 border-slate-300",
  gold:     "text-yellow-700 bg-yellow-100 border-yellow-300",
  platinum: "text-purple-700 bg-purple-100 border-purple-300",
};

const TIER_ICONS: Record<string, string> = {
  bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💎",
};

function TierBadge({ tier }: { tier?: string }) {
  if (!tier) return null;
  const t = tier.toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${TIER_COLORS[t] ?? "text-gray-600 bg-gray-100 border-gray-300"}`}
    >
      {TIER_ICONS[t] ?? "⭐"} {tier}
    </span>
  );
}

export function TipModal({ recipient, onConfirm, isPending, onClose }: Props) {
  const [selected, setSelected] = useState<TipAmount>(100);
  const [done, setDone] = useState(false);

  const { data: walletRaw } = useWallet();
  const walletCoins: number =
    (walletRaw as any)?.balance ??
    (walletRaw as any)?.coins ??
    (walletRaw as any)?.huudCoins ?? 0;

  const hasEnough = walletCoins >= selected;
  const avatarSrc = recipient.profilePicture || recipient.avatarUrl;

  async function handleConfirm() {
    onConfirm(selected);
    setDone(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl overflow-hidden">

        {/* Gradient header bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

        <div className="p-6">
          {/* Close button */}
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Recipient avatar */}
              <div className="relative h-14 w-14 flex-shrink-0">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={recipient.displayName}
                    fill
                    className="rounded-full object-cover ring-2 ring-amber-200"
                    sizes="56px"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-2xl font-black text-white ring-2 ring-amber-200">
                    {recipient.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Coin icon overlay */}
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs shadow-sm">
                  🪙
                </span>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Sending a tip to</p>
                <h2 className="text-base font-black text-gray-900 leading-tight">
                  {recipient.displayName}
                </h2>
                {recipient.username && (
                  <p className="text-xs text-gray-400">@{recipient.username}</p>
                )}
                <div className="mt-1">
                  <TierBadge tier={recipient.tier} />
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="ml-2 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {done ? (
            /* ─── Success state ─── */
            <div className="py-4 text-center">
              <div className="mb-3 text-5xl animate-bounce">🎉</div>
              <h3 className="text-lg font-black text-gray-900">Tip Sent!</h3>
              <p className="mt-1 text-sm text-gray-500">
                You sent{" "}
                <span className="font-bold text-amber-600">
                  🪙 {selected.toLocaleString()} HuudCoins
                </span>{" "}
                to {recipient.displayName}.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                This goes directly into their wallet and strengthens community trust.
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-black text-white shadow-md hover:opacity-90 transition"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* ─── Wallet balance ─── */}
              <div className="mb-4 flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-sm border border-amber-100">
                <div className="flex items-center gap-2 text-amber-800">
                  <span className="text-base">🪙</span>
                  <span className="font-semibold">Your balance</span>
                </div>
                <span className="font-black text-amber-700 text-base">
                  {walletCoins.toLocaleString()} coins
                </span>
              </div>

              {/* ─── Amount selector ─── */}
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Choose an amount
              </p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {TIP_AMOUNTS.map((opt) => {
                  const isSelected = selected === opt.value;
                  const affordable = walletCoins >= opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelected(opt.value)}
                      disabled={!affordable}
                      className={`relative flex flex-col items-center rounded-2xl border-2 py-3 px-2 text-sm font-bold transition focus:outline-none
                        ${isSelected
                          ? "border-amber-500 bg-amber-50 text-amber-800 shadow-md shadow-amber-100"
                          : affordable
                            ? "border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50"
                            : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                        }`}
                    >
                      {'popular' in opt && opt.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-black text-white shadow">
                          Popular
                        </span>
                      )}
                      <span className="text-lg">🪙 {opt.label}</span>
                      <span className={`mt-0.5 text-xs font-normal ${isSelected ? "text-amber-600" : "text-gray-400"}`}>
                        {opt.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Insufficient balance warning */}
              {!hasEnough && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-2 text-xs text-red-600 font-medium">
                  You need {(selected - walletCoins).toLocaleString()} more HuudCoins to send this tip.
                  Earn them by posting, commenting, and participating in your community.
                </div>
              )}

              {/* Trust economy note */}
              <p className="mb-4 text-center text-xs text-gray-400 leading-relaxed">
                Tips go directly into {recipient.displayName.split(" ")[0]}&apos;s wallet. No platform fee — it&apos;s community-to-community.
              </p>

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={!hasEnough || isPending}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-black text-white shadow-md shadow-amber-200 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </span>
                ) : (
                  `Send 🪙 ${selected.toLocaleString()} HuudCoins`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
