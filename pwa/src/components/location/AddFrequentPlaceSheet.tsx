"use client";

import { useState } from "react";
import { BottomSheetOverlay } from "@/components/ui/BottomSheetOverlay";
import { getCurrentLocation } from "@/lib/geolocation";
import {
  FREQUENT_PLACE_KINDS,
  kindMeta,
  type FrequentPlaceKind,
} from "@/lib/frequentPlaces";
import { useAddFrequentPlace } from "@/hooks/useFrequentPlaces";

type Props = {
  onClose: () => void;
  onSaved?: () => void;
  initialCoords?: { lat: number; lng: number };
  initialKind?: FrequentPlaceKind;
};

export function AddFrequentPlaceSheet({ onClose, onSaved, initialCoords, initialKind }: Props) {
  const [kind, setKind] = useState<FrequentPlaceKind>(initialKind ?? "work");
  const [label, setLabel] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(initialCoords ?? null);
  const add = useAddFrequentPlace();

  async function detectHere() {
    setDetecting(true);
    try {
      const loc = await getCurrentLocation();
      if (loc) setCoords({ lat: loc.lat, lng: loc.lng });
    } finally {
      setDetecting(false);
    }
  }

  function handleSave() {
    if (!coords) return;
    add.mutate(
      {
        kind,
        label: label.trim() || kindMeta(kind).label,
        latitude: coords.lat,
        longitude: coords.lng,
      },
      {
        onSuccess: () => {
          onSaved?.();
          onClose();
        },
      },
    );
  }

  return (
    <BottomSheetOverlay
      open
      onClose={onClose}
      ariaLabel="Save frequent place"
      zIndexClass="z-[300]"
      alignClass="items-end justify-center p-0 backdrop-blur-sm sm:items-center sm:p-4"
      backdropClassName="bg-black/45"
      panelClassName="mod-modal w-full max-w-md rounded-t-2xl p-6 sm:rounded-2xl"
      panelStyle={{ background: "var(--neu-bg, #fff)", color: "var(--neu-text)" }}
      handleClassName="pt-2 pb-0"
    >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Save frequent place</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-brand-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="mb-4 text-sm" style={{ color: "var(--neu-text-muted)" }}>
          Work, chill spots, gym, and more help NeyborHuud show what matters around you — without changing your home address.
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {FREQUENT_PLACE_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                kind === k.id
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-black/[0.08] hover:bg-brand-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{k.icon}</span>
              {k.label}
            </button>
          ))}
        </div>

        <label className="mb-4 block text-sm font-medium">
          Custom name (optional)
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={kindMeta(kind).label}
            className="mt-1 w-full rounded-xl border border-black/[0.08] px-3 py-2.5 text-sm"
          />
        </label>

        <button
          type="button"
          onClick={() => void detectHere()}
          disabled={detecting}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-3 text-sm font-semibold text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">my_location</span>
          {detecting ? "Getting location…" : coords ? "Update to current location" : "Use my current location"}
        </button>

        {coords && (
          <p className="mb-4 text-center text-xs" style={{ color: "var(--neu-text-muted)" }}>
            📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!coords || add.isPending}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {add.isPending ? "Saving…" : "Save place"}
        </button>
    </BottomSheetOverlay>
  );
}
