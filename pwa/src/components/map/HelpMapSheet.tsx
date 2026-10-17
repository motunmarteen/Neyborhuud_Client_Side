'use client';

/**
 * "Help map Nigeria" (M-18, owner 2026-10-16: "fill in, plus help map Nigeria"). Where
 * OpenStreetMap has no building outlines, the 3D map draws stand-in buildings along the
 * roads. This sheet invites neighbours to add the real ones to OpenStreetMap (free, open to
 * everyone); NeyborHuud's map picks them up when its map data next updates.
 */

import { AppBottomSheet } from '@/components/ui/AppBottomSheet';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Where the map is, so the editor opens on this street. */
  centre: { lat: number; lng: number } | null;
  realCount: number;
  fillerCount: number;
};

export function HelpMapSheet({ open, onClose, centre, realCount, fillerCount }: Props) {
  const editHref = centre
    ? `https://www.openstreetmap.org/edit#map=19/${centre.lat.toFixed(5)}/${centre.lng.toFixed(5)}`
    : 'https://www.openstreetmap.org/edit';
  const total = realCount + fillerCount;
  const share = total ? Math.round((fillerCount / total) * 100) : 0;

  return (
    <AppBottomSheet open={open} onClose={onClose} title="Help map Nigeria 🗺️">
      <div className="flex flex-col gap-3 pb-2 text-sm font-semibold text-navy">
        <p>
          {share >= 95 ? 'All the buildings you see here are stand-ins' : `About ${share}% of the buildings you see here are stand-ins`}:
          OpenStreetMap, the free world map our map is built on, has no outlines for them yet. You can add the real ones, and your street will look like your street.
        </p>
        <ol className="flex flex-col gap-2">
          {[
            'Make a free OpenStreetMap account.',
            'Open the editor at your street, choose a satellite photo, and trace each roof as an area marked “Building”.',
            'Save. NeyborHuud’s map picks up new buildings when its map data next updates, usually within a week or two.',
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-white">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
        <div className="rounded-2xl bg-amber-soft p-3 text-[13px]">
          Map buildings, roads and public places only. Never add people’s names, phone numbers or which house belongs to whom.
        </div>
        <a
          href={editHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-4 text-[15px] font-bold text-white"
        >
          Open the map editor at this street
        </a>
        <a
          href="https://learnosm.org/en/beginner/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white px-4 text-[15px] font-bold text-navy"
        >
          New to mapping? Short beginner’s guide
        </a>
        <p className="text-xs text-muted">The editor works best on a computer or tablet.</p>
      </div>
    </AppBottomSheet>
  );
}
