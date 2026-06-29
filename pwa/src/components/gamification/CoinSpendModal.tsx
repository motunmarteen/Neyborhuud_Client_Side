"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useGamification";

export interface CoinSpendOption {
  label: string;
  value: number | string;
  coins: number;
  popular?: boolean;
}

interface Props {
  title: string;
  /** Short description shown in the modal header */
  description?: string;
  options: CoinSpendOption[];
  defaultValue?: number | string;
  /** Called with the chosen option value when the user confirms */
  onConfirm: (value: number | string) => void;
  isPending: boolean;
  onClose: () => void;
  /** Pass true when the item is already actively boosted/pinned */
  alreadyActive?: boolean;
  /** ISO date string of current expiry, if any */
  activeUntil?: string;
  /** Label for the confirm button (defaults to "Confirm") */
  confirmLabel?: string;
}

export function CoinSpendModal({
  title,
  description,
  options,
  defaultValue,
  onConfirm,
  isPending,
  onClose,
  alreadyActive = false,
  activeUntil,
  confirmLabel = "Confirm",
}: Props) {
  const [selected, setSelected] = useState<number | string>(
    defaultValue ?? options[0]?.value,
  );
  const [done, setDone] = useState(false);

  const { data: walletRaw } = useWallet();
  const walletCoins: number =
    (walletRaw as any)?.balance ?? (walletRaw as any)?.coins ?? 0;

  const selectedOption = options.find((o) => o.value === selected) ?? options[0];
  const hasEnough = walletCoins >= (selectedOption?.coins ?? 0);

  async function handleConfirm() {
    await onConfirm(selected);
    setDone(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--neu-text-muted)]">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-[var(--neu-text-muted)]">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-full p-1 text-[var(--neu-text-muted)] hover:bg-brand-surface hover:text-[var(--neu-text-secondary)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Current active status */}
        {alreadyActive && activeUntil && !done && (
          <div className="mb-4 rounded-lg bg-status-info/8 p-3 text-sm text-status-info">
            Currently active until{" "}
            <strong>{new Date(activeUntil).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>. Selecting
            another option will <em>extend</em> from the current end date.
          </div>
        )}

        {/* Wallet balance */}
        <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2 text-sm">
          <span className="text-amber-800">Your HuudCoins</span>
          <span className="font-bold text-amber-700">🪙 {walletCoins.toLocaleString()}</span>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <div className="mb-2 text-4xl">🎉</div>
            <p className="font-semibold text-[var(--neu-text-muted)]">Done!</p>
            <p className="mt-1 text-sm text-[var(--neu-text-muted)]">
              {selectedOption?.coins.toLocaleString()} HuudCoins deducted.
            </p>
            <button
              onClick={onClose}
              className="mt-4 rounded-xl bg-brand-green-dark px-6 py-2 text-sm font-medium text-white hover:bg-brand-green-dark"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Option selector */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              {options.map((opt) => {
                const active = opt.value === selected;
                const affordable = walletCoins >= opt.coins;
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => setSelected(opt.value)}
                    disabled={!affordable}
                    className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                      active
                        ? "border-amber-500 bg-amber-50"
                        : affordable
                        ? "border-black/[0.08] bg-white hover:border-primary"
                        : "cursor-not-allowed border-black/[0.08] bg-brand-surface opacity-50"
                    }`}
                  >
                    {opt.popular && (
                      <span className="absolute right-2 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Popular
                      </span>
                    )}
                    <p className="font-semibold text-[var(--neu-text-muted)]">{opt.label}</p>
                    <p className="mt-0.5 text-sm text-amber-700">
                      🪙 {opt.coins.toLocaleString()} coins
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Insufficient funds warning */}
            {!hasEnough && (
              <p className="mb-3 text-center text-sm text-status-danger">
                You need{" "}
                <strong>
                  {((selectedOption?.coins ?? 0) - walletCoins).toLocaleString()} more
                </strong>{" "}
                HuudCoins. Earn them by participating in your neighbourhood!
              </p>
            )}

            {/* Confirm */}
            <button
              onClick={handleConfirm}
              disabled={!hasEnough || isPending}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition-colors hover:bg-status-warning/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending
                ? "Processing…"
                : `${confirmLabel} · 🪙 ${(selectedOption?.coins ?? 0).toLocaleString()} coins`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
