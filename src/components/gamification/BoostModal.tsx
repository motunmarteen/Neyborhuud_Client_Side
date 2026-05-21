"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useGamification";

type BoostType = "job" | "service" | "event" | "listing" | "post";

interface BoostOption {
  days: number;
  coins: number;
  label: string;
  badge?: string;
}

interface Props {
  type: BoostType;
  itemTitle: string;
  options: BoostOption[];
  defaultDays?: number;
  alreadyActive?: boolean;
  activeUntil?: string;
  isPending: boolean;
  onConfirm: (days: number) => void;
  onClose: () => void;
}

const TYPE_META: Record<BoostType, { icon: string; color: string; gradient: string; verb: string }> = {
  job:      { icon: "💼", color: "blue",   gradient: "from-brand-blue to-indigo-600",    verb: "Featured in job feed" },
  service:  { icon: "🔧", color: "teal",   gradient: "from-teal-500 to-green-600",     verb: "Promoted in services" },
  event:    { icon: "🎉", color: "rose",   gradient: "from-rose-500 to-pink-600",      verb: "Spotlighted for the community" },
  listing:  { icon: "🏷️",  color: "orange", gradient: "from-brand-red to-amber-600",   verb: "Featured in marketplace" },
  post:     { icon: "📌", color: "purple", gradient: "from-purple-500 to-violet-600",  verb: "Pinned to community feed" },
};

const PERKS: Record<BoostType, string[]> = {
  job:     ["🔝 Top of job search results", "📢 Notified to nearby job seekers", "⭐ Featured badge on listing"],
  service: ["🔝 Priority in service search", "📣 Promoted to neighbours nearby", "⭐ Featured badge on profile"],
  event:   ["🗓️ Highlighted on community calendar", "📣 Alert sent to neighbours", "⭐ Featured badge on event"],
  listing: ["🔝 Top of marketplace feed", "📢 Notified to nearby buyers", "⭐ Boosted badge on listing"],
  post:    ["📌 Pinned at top of community feed", "👀 Higher visibility to neighbours", "🔔 Boosted engagement"],
};

export function BoostModal({
  type,
  itemTitle,
  options,
  defaultDays,
  alreadyActive = false,
  activeUntil,
  isPending,
  onConfirm,
  onClose,
}: Props) {
  const [selectedDays, setSelectedDays] = useState<number>(
    defaultDays ?? options[0]?.days,
  );
  const [done, setDone] = useState(false);

  const { data: walletRaw } = useWallet();
  const walletCoins: number =
    (walletRaw as any)?.balance ??
    (walletRaw as any)?.coins ??
    (walletRaw as any)?.huudCoins ?? 0;

  const meta = TYPE_META[type];
  const perks = PERKS[type];
  const selectedOpt = options.find((o) => o.days === selectedDays) ?? options[0];
  const hasEnough = walletCoins >= selectedOpt.coins;

  function handleConfirm() {
    onConfirm(selectedDays);
    setDone(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl overflow-hidden">

        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${meta.gradient} px-6 py-5 text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{meta.icon}</span>
                <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
                  Boost {type}
                </span>
              </div>
              <h2 className="text-lg font-black leading-tight line-clamp-2 max-w-xs">
                {itemTitle}
              </h2>
              <p className="mt-1 text-sm opacity-75">{meta.verb} — powered by HuudCoins</p>
            </div>
            <button
              onClick={onClose}
              className="ml-2 rounded-full bg-white/20 p-2 transition hover:bg-white/30"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5">
          {alreadyActive && activeUntil && !done && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
              <span>⚡</span>
              <span>
                Currently active until{" "}
                <strong>{new Date(activeUntil).toLocaleDateString()}</strong>.
                Selecting a new duration <em>extends</em> from that date.
              </span>
            </div>
          )}

          {done ? (
            <div className="py-4 text-center">
              <div className="mb-3 text-5xl animate-bounce">🚀</div>
              <h3 className="text-lg font-black text-[var(--neu-text-muted)]">Boost Active!</h3>
              <p className="mt-1 text-sm text-[var(--neu-text-muted)]">
                <span className="font-bold text-amber-600">🪙 {selectedOpt.coins.toLocaleString()} HuudCoins</span> deducted.
                Your {type} is now featured for{" "}
                <strong>{selectedDays} {selectedDays === 1 ? "day" : "days"}</strong>.
              </p>
              <button
                onClick={onClose}
                className={`mt-5 w-full rounded-2xl bg-gradient-to-r ${meta.gradient} py-3 text-sm font-black text-white shadow hover:opacity-90 transition`}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Wallet balance */}
              <div className="mb-4 flex items-center justify-between rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm">
                <div className="flex items-center gap-2 text-amber-800">
                  <span className="text-base">🪙</span>
                  <span className="font-semibold">Your balance</span>
                </div>
                <span className="font-black text-amber-700 text-base">
                  {walletCoins.toLocaleString()} coins
                </span>
              </div>

              {/* Boost perks */}
              <div className="mb-4 rounded-2xl bg-brand-surface px-4 py-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--neu-text-muted)]">
                  What you get
                </p>
                <ul className="space-y-1">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-sm text-[var(--neu-text-muted)]">
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Duration options */}
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--neu-text-muted)]">
                Choose duration
              </p>
              <div className={`grid gap-3 mb-5 ${options.length <= 2 ? "grid-cols-2" : "grid-cols-2"}`}>
                {options.map((opt) => {
                  const isSelected = opt.days === selectedDays;
                  const affordable = walletCoins >= opt.coins;
                  return (
                    <button
                      key={opt.days}
                      onClick={() => setSelectedDays(opt.days)}
                      disabled={!affordable}
                      className={`relative flex flex-col items-center rounded-2xl border-2 py-3.5 px-2 text-sm font-bold transition focus:outline-none
                        ${isSelected
                          ? `border-current bg-gradient-to-br ${meta.gradient} text-white shadow-lg`
                          : affordable
                            ? "border-black/[0.08] bg-white text-[var(--neu-text-muted)] hover:border-black/[0.08] hover:bg-brand-surface"
                            : "border-black/[0.08] bg-brand-surface text-[var(--neu-text-muted)] cursor-not-allowed"
                        }`}
                    >
                      {opt.badge && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-white shadow">
                          {opt.badge}
                        </span>
                      )}
                      <span className="text-base font-black">{opt.label}</span>
                      <span className={`mt-0.5 text-xs ${isSelected ? "opacity-80" : "text-[var(--neu-text-muted)]"}`}>
                        🪙 {opt.coins.toLocaleString()} coins
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Insufficient balance */}
              {!hasEnough && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-2 text-xs text-red-600 font-medium">
                  You need {(selectedOpt.coins - walletCoins).toLocaleString()} more HuudCoins for this option.
                  Earn more by posting, commenting, and engaging in your community!
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={!hasEnough || isPending}
                className={`w-full rounded-2xl bg-gradient-to-r ${meta.gradient} py-3.5 text-sm font-black text-white shadow-md transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Activating...
                  </span>
                ) : (
                  `🚀 Boost for ${selectedDays} ${selectedDays === 1 ? "day" : "days"} — 🪙 ${selectedOpt.coins.toLocaleString()}`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
