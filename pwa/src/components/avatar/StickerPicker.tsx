'use client';

/**
 * Your avatar stickers (owner 2026-10-18): your own 3D avatar in a pose with a Naija caption.
 * Drawn on the phone from your saved avatar; tap one to use it (send in chat, share, save).
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { renderSticker } from '@/lib/avatar3d/stage';
import type { PoseId } from '@/lib/avatar3d/build';
import { useAvatarCatalogue, useMyAvatar } from '@/hooks/useAvatar';

export const STICKERS: { id: string; caption: string; pose: PoseId }[] = [
  { id: 'how_far', caption: 'How far?', pose: 'wave' },
  { id: 'good_morning', caption: 'Good morning!', pose: 'wave' },
  { id: 'well_done', caption: 'Well done!', pose: 'thumbs' },
  { id: 'no_wahala', caption: 'No wahala', pose: 'thumbs' },
  { id: 'abeg', caption: 'Abeg!', pose: 'pray' },
  { id: 'thank_you', caption: 'Thank you!', pose: 'pray' },
  { id: 'wetin_dey', caption: 'Wetin dey?', pose: 'shrug' },
  { id: 'na_so', caption: 'Na so!', pose: 'hips' },
  { id: 'i_dey_come', caption: 'I dey come', pose: 'point' },
  { id: 'e_don_do', caption: 'E don do!', pose: 'flex' },
  { id: 'light', caption: 'Light don come!', pose: 'dance' },
  { id: 'hbd', caption: 'Happy birthday!', pose: 'dance' },
  { id: 'congrats', caption: 'Congrats!', pose: 'dance' },
  { id: 'peace', caption: 'Peace!', pose: 'peace' },
];

export function StickerPicker({ onPick }: { onPick: (dataUrl: string, caption: string) => void }) {
  const { data: cat } = useAvatarCatalogue();
  const { data: mine, isLoading } = useMyAvatar();
  const [imgs, setImgs] = useState<Record<string, string>>({});
  const cfg = mine?.avatar?.config;
  const color = useMemo(() => {
    const by = new Map((cat?.items ?? []).map((i) => [i.id, i]));
    return (id: string | undefined, fb: string) => (id && by.get(id)?.color) || fb;
  }, [cat]);

  // Draw them one at a time so the phone stays responsive.
  useEffect(() => {
    if (!cfg || !cat) return;
    let alive = true;
    let i = 0;
    const next = () => {
      if (!alive || i >= STICKERS.length) return;
      const s = STICKERS[i++];
      try {
        const url = renderSticker(cfg, color, s.pose, s.caption, 384);
        setImgs((m) => ({ ...m, [s.id]: url }));
      } catch {
        /* skip one that fails */
      }
      window.setTimeout(next, 30);
    };
    next();
    return () => {
      alive = false;
    };
  }, [cfg, cat, color]);

  if (isLoading || !cat) return <p className="py-6 text-center text-sm text-muted">Loading your stickers…</p>;
  if (!cfg) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span aria-hidden className="text-4xl">
          🧍🏾
        </span>
        <p className="text-sm text-navy">Make your 3D avatar first. Then your stickers appear here.</p>
        <Link href="/avatar" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-white">
          Make my avatar
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid max-h-[60vh] grid-cols-3 gap-2 overflow-y-auto">
      {STICKERS.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            disabled={!imgs[s.id]}
            onClick={() => imgs[s.id] && onPick(imgs[s.id], s.caption)}
            className="flex aspect-square w-full items-center justify-center rounded-2xl bg-background disabled:animate-pulse"
            aria-label={`Sticker: ${s.caption}`}
          >
            {imgs[s.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgs[s.id]} alt="" className="h-full w-full object-contain" />
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** A sticker's data URL as a PNG file (for chat upload or sharing). */
export async function stickerFile(dataUrl: string, caption: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  const name = `neyborhuud-sticker-${caption.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`;
  return new File([blob], name, { type: 'image/png' });
}
