'use client';

/**
 * Your avatar stickers (owner 2026-10-18): your own 3D avatar in a pose with a Naija caption.
 * Drawn on the phone from your saved avatar; tap one to use it (chat, post replies, share).
 * Drawn stickers are kept for the session, so the picker opens instantly the second time.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { renderSticker } from '@/lib/avatar3d/stage';
import type { PoseId } from '@/lib/avatar3d/build';
import { useAvatarCatalogue, useMyAvatar } from '@/hooks/useAvatar';
import { useTranslation } from '@/lib/i18n';
import apiClient from '@/lib/api-client';

export type StickerGroup = 'greet' | 'feel' | 'celebrate';

/** The caption is part of the picture (Naija words from across the country), so it isn't translated. */
export const STICKERS: { id: string; caption: string; pose: PoseId; group: StickerGroup }[] = [
  // Greetings
  { id: 'how_far', caption: 'How far?', pose: 'wave', group: 'greet' },
  { id: 'good_morning', caption: 'Good morning!', pose: 'wave', group: 'greet' },
  { id: 'e_kaaro', caption: 'E kaaro!', pose: 'wave', group: 'greet' },
  { id: 'sannu', caption: 'Sannu!', pose: 'wave', group: 'greet' },
  { id: 'kedu', caption: 'Kedu!', pose: 'wave', group: 'greet' },
  { id: 'i_hail', caption: 'I hail o!', pose: 'peace', group: 'greet' },
  { id: 'wetin_dey', caption: 'Wetin dey?', pose: 'shrug', group: 'greet' },
  { id: 'i_dey_come', caption: 'I dey come', pose: 'point', group: 'greet' },
  { id: 'oya', caption: 'Oya now!', pose: 'point', group: 'greet' },
  { id: 'safe_journey', caption: 'Safe journey', pose: 'wave', group: 'greet' },
  { id: 'peace', caption: 'Peace!', pose: 'peace', group: 'greet' },
  // Feelings and replies
  { id: 'abeg', caption: 'Abeg!', pose: 'pray', group: 'feel' },
  { id: 'thank_you', caption: 'Thank you!', pose: 'pray', group: 'feel' },
  { id: 'sorry_o', caption: 'Sorry o', pose: 'pray', group: 'feel' },
  { id: 'no_vex', caption: 'No vex', pose: 'pray', group: 'feel' },
  { id: 'god_abeg', caption: 'God abeg', pose: 'pray', group: 'feel' },
  { id: 'no_wahala', caption: 'No wahala', pose: 'thumbs', group: 'feel' },
  { id: 'well_done', caption: 'Well done!', pose: 'thumbs', group: 'feel' },
  { id: 'correct', caption: 'Correct!', pose: 'thumbs', group: 'feel' },
  { id: 'gbam', caption: 'Gbam!', pose: 'thumbs', group: 'feel' },
  { id: 'e_go_better', caption: 'E go better', pose: 'thumbs', group: 'feel' },
  { id: 'na_so', caption: 'Na so!', pose: 'hips', group: 'feel' },
  { id: 'nawa_o', caption: 'Nawa o!', pose: 'hips', group: 'feel' },
  { id: 'wahala_dey', caption: 'Wahala dey!', pose: 'shrug', group: 'feel' },
  { id: 'shine_eye', caption: 'Shine your eye', pose: 'point', group: 'feel' },
  { id: 'sharp_sharp', caption: 'Sharp sharp!', pose: 'point', group: 'feel' },
  // Celebrate
  { id: 'e_don_do', caption: 'E don do!', pose: 'flex', group: 'celebrate' },
  { id: 'we_move', caption: 'We move!', pose: 'flex', group: 'celebrate' },
  { id: 'light', caption: 'Light don come!', pose: 'dance', group: 'celebrate' },
  { id: 'hbd', caption: 'Happy birthday!', pose: 'dance', group: 'celebrate' },
  { id: 'congrats', caption: 'Congrats!', pose: 'dance', group: 'celebrate' },
  { id: 'owambe', caption: 'Owambe!', pose: 'dance', group: 'celebrate' },
  { id: 'chop_life', caption: 'Chop life!', pose: 'dance', group: 'celebrate' },
];

const GROUPS: StickerGroup[] = ['greet', 'feel', 'celebrate'];
const RIBBON: Record<StickerGroup, string> = { greet: '#00B82E', feel: '#E0901A', celebrate: '#7C4DDB' };

// Session cache: one avatar look → its drawn stickers.
const cache = new Map<string, Record<string, string>>();

export function StickerPicker({ onPick }: { onPick: (dataUrl: string, caption: string) => void }) {
  const { t } = useTranslation();
  const { data: cat } = useAvatarCatalogue();
  const { data: mine, isLoading } = useMyAvatar();
  const cfg = mine?.avatar?.config;
  const key = cfg ? JSON.stringify(cfg) : '';
  const [imgs, setImgs] = useState<Record<string, string>>(() => cache.get(key) ?? {});
  const color = useMemo(() => {
    const by = new Map((cat?.items ?? []).map((i) => [i.id, i]));
    return (id: string | undefined, fb: string) => (id && by.get(id)?.color) || fb;
  }, [cat]);

  // Draw the missing ones one at a time so the phone stays responsive.
  useEffect(() => {
    if (!cfg || !cat) return;
    const done = cache.get(key) ?? {};
    cache.set(key, done);
    let alive = true;
    const todo = STICKERS.filter((s) => !done[s.id]);
    let i = 0;
    const next = () => {
      if (!alive) return;
      if (i >= todo.length) {
        setImgs({ ...done });
        return;
      }
      const s = todo[i++];
      try {
        done[s.id] = renderSticker(cfg, color, s.pose, s.caption, 384, RIBBON[s.group]);
      } catch {
        /* skip one that fails */
      }
      if (i % 3 === 0) setImgs({ ...done });
      window.setTimeout(next, 30);
    };
    next();
    return () => {
      alive = false;
    };
  }, [cfg, cat, color, key]);

  if (isLoading || !cat) return <p className="py-6 text-center text-sm text-muted">{t('sticker.loading')}</p>;
  if (!cfg) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span aria-hidden className="text-4xl">
          🧍🏾
        </span>
        <p className="text-sm text-navy">{t('sticker.needAvatar')}</p>
        <Link href="/avatar" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-white">
          {t('sticker.makeAvatar')}
        </Link>
      </div>
    );
  }
  return (
    <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
      {GROUPS.map((g) => (
        <section key={g} aria-label={t(`sticker.group.${g}`)}>
          <h3 className="mb-1.5 px-1 text-[11px] font-black uppercase tracking-[0.12em] text-muted">{t(`sticker.group.${g}`)}</h3>
          <ul className="grid grid-cols-3 gap-2">
            {STICKERS.filter((s) => s.group === g).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!imgs[s.id]}
                  onClick={() => imgs[s.id] && onPick(imgs[s.id], s.caption)}
                  className="flex aspect-square w-full items-center justify-center rounded-2xl bg-background disabled:animate-pulse"
                  aria-label={t('sticker.one', { caption: s.caption })}
                >
                  {imgs[s.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgs[s.id]} alt="" className="h-full w-full object-contain" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** A sticker's data URL as a PNG file (for chat upload or sharing). */
export async function stickerFile(dataUrl: string, caption: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  const name = `neyborhuud-sticker-${caption.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`;
  return new File([blob], name, { type: 'image/png' });
}

/** Upload a sticker through the app's own media upload; returns its web address. */
export async function uploadSticker(dataUrl: string, caption: string): Promise<string> {
  const res = await apiClient.uploadFiles<{ files: { url: string }[] }>('/media/upload', [await stickerFile(dataUrl, caption)]);
  const body = ((res as { data?: { files?: { url: string }[] } })?.data ?? res) as { files?: { url: string }[] };
  const url = body.files?.[0]?.url;
  if (!url) throw new Error('Sticker upload failed');
  return url;
}
