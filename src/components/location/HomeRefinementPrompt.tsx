"use client";

import { useState } from "react";
import type { SmartLocationSyncResult } from "@/lib/frequentPlaces";
import {
  useConfirmHomeRefinement,
  useDismissHomeHint,
} from "@/hooks/useFrequentPlaces";
import { AddFrequentPlaceSheet } from "@/components/location/AddFrequentPlaceSheet";

type Props = {
  hint: NonNullable<SmartLocationSyncResult["homeRefinement"]>;
  currentHome?: string;
  onDone: () => void;
};

export function HomeRefinementPrompt({ hint, currentHome, onDone }: Props) {
  const confirm = useConfirmHomeRefinement();
  const dismiss = useDismissHomeHint();
  const [showSavePlace, setShowSavePlace] = useState(false);

  const pending = hint.pendingAddress ?? "this location";
  const progress = `${hint.visitCount} of ${hint.visitsRequired} visits`;

  function handleConfirm() {
    confirm.mutate(undefined, { onSuccess: () => onDone() });
  }

  function handleDismiss() {
    dismiss.mutate(undefined, { onSuccess: () => onDone() });
  }

  if (showSavePlace) {
    return (
      <AddFrequentPlaceSheet
        initialCoords={{ lat: hint.lat, lng: hint.lng }}
        initialKind="work"
        onClose={() => {
          dismiss.mutate(undefined);
          onDone();
        }}
        onSaved={() => {
          dismiss.mutate(undefined);
          onDone();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[310] flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="mod-modal w-full max-w-sm rounded-2xl p-6 shadow-xl"
        style={{ background: "var(--neu-bg, #fff)", color: "var(--neu-text)" }}
      >
        <div className="mb-3 flex justify-center">
          <span className="material-symbols-outlined text-[40px] text-primary">home_pin</span>
        </div>
        <h2 className="mb-2 text-center text-lg font-bold">Update home address?</h2>
        <p className="mb-3 text-center text-sm" style={{ color: "var(--neu-text-secondary)" }}>
          We noticed you&apos;re often near <strong>{pending}</strong> ({progress}).
          {currentHome ? (
            <>
              {" "}
              Your saved home is still <strong>{currentHome}</strong>.
            </>
          ) : null}
        </p>
        <p className="mb-5 text-center text-xs" style={{ color: "var(--neu-text-muted)" }}>
          Saved work and chill spots are never changed. Only your home address updates if you confirm.
        </p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirm.isPending}
          className="mb-2 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {confirm.isPending ? "Updating…" : "Yes, update home"}
        </button>
        <button
          type="button"
          onClick={() => setShowSavePlace(true)}
          className="mb-2 w-full rounded-xl border border-primary/30 py-3 text-sm font-semibold text-primary"
        >
          No — save as work or chill spot
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={dismiss.isPending}
          className="w-full py-2 text-sm"
          style={{ color: "var(--neu-text-muted)" }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
