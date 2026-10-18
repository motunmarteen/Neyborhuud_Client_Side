'use client';

/**
 * Avatar Studio (owner 2026-10-18): build your 3D NeyborHuud avatar — body and skin, face,
 * hair, headwear (gele, fila…), clothes (agbada, Ankara, kaftan, Super Eagles…) and extras.
 * Start from a selfie (skin tone matched on the phone; the photo is never uploaded).
 * Premium items show their HuudCredit price: try them on, buy to keep.
 * Your avatar shows on your profile and, for friends, on the map.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-handler';
import { createStage, renderPortrait, type Stage } from '@/lib/avatar3d/stage';
import { skinToneFromSelfie } from '@/lib/avatar3d/selfie';
import { POSES, type PoseId } from '@/lib/avatar3d/build';
import { StickerPicker, stickerFile } from '@/components/avatar/StickerPicker';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { useTranslation } from '@/lib/i18n';
import { useAvatarCatalogue, useBuyAvatarItem, useMyAvatar, useSaveAvatar, type AvatarConfig, type AvatarItem } from '@/hooks/useAvatar';

/** Parts of the wardrobe; labels are i18n keys avatar.tab.<key> and avatar.slot.<slot>. */
const TABS: { key: string; slots: string[] }[] = [
  { key: 'body', slots: ['skin', 'body'] },
  { key: 'face', slots: ['face', 'eyes', 'brows', 'mouth', 'facialHair'] },
  { key: 'hair', slots: ['hair', 'hairColor'] },
  { key: 'clothes', slots: ['top', 'topColor', 'bottom', 'bottomColor', 'shoes'] },
  { key: 'extras', slots: ['headwear', 'glasses', 'neck'] },
];

export default function AvatarStudioPage() {
  const { t } = useTranslation();
  const [stickersOpen, setStickersOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);
  const { data: cat } = useAvatarCatalogue();
  const { data: mine } = useMyAvatar();
  const save = useSaveAvatar();
  const buy = useBuyAvatarItem();
  const [cfg, setCfg] = useState<AvatarConfig | null>(null);
  const [tab, setTab] = useState('body');
  const [pose, setPose] = useState<PoseId>('idle');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<Stage | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const byId = useMemo(() => new Map((cat?.items ?? []).map((i) => [i.id, i])), [cat]);
  const color = useMemo(() => (id: string | undefined, fb: string) => (id && byId.get(id)?.color) || fb, [byId]);
  const owned = useMemo(() => new Set(mine?.owned ?? []), [mine]);

  // Start from the saved avatar, else the defaults.
  useEffect(() => {
    if (cfg || !cat || mine === undefined) return;
    setCfg({ ...cat.defaults, ...(mine?.avatar?.config ?? {}) });
  }, [cat, mine, cfg]);

  // The 3D stage lives as long as the page.
  useEffect(() => {
    if (!canvasRef.current || !cat) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.hasAttribute('data-calm');
    stageRef.current = createStage(canvasRef.current, color, { still });
    return () => {
      stageRef.current?.dispose();
      stageRef.current = null;
    };
  }, [cat, color]);
  useEffect(() => {
    if (cfg) stageRef.current?.setAvatar(cfg);
  }, [cfg]);
  useEffect(() => {
    stageRef.current?.setPose(pose);
  }, [pose, cat]);

  const shareSticker = async (url: string, caption: string) => {
    const file = await stickerFile(url, caption);
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: caption });
        return;
      }
    } catch {
      return; // closed the share sheet
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    toast.success(t('avatar.stickerSaved'));
  };

  const unowned = useMemo(
    () => (cfg ? Object.values(cfg).map((id) => byId.get(id)).filter((i): i is AvatarItem => !!i && i.price > 0 && !owned.has(i.id)) : []),
    [cfg, byId, owned],
  );

  const pick = (slot: string, id: string) => setCfg((c) => (c ? { ...c, [slot]: id } : c));

  const onSelfie = async (file: File | undefined) => {
    if (!file || !cat) return;
    const tone = await skinToneFromSelfie(
      file,
      cat.items.filter((i) => i.slot === 'skin'),
    );
    if (tone) {
      pick('skin', tone);
      toast.success(t('avatar.selfieOk'));
    } else {
      toast.error(t('avatar.selfieBad'));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const onSave = () => {
    if (!cfg) return;
    let portrait: string | undefined;
    try {
      portrait = renderPortrait(cfg, color);
    } catch {
      portrait = undefined;
    }
    save.mutate(
      { config: cfg, portrait },
      { onSuccess: () => toast.success(t('avatar.saved')), onError: (err) => toast.error(getErrorMessage(err)) },
    );
  };

  const current = TABS.find((tb) => tb.key === tab) ?? TABS[0];

  // Snapchat-style editor (owner 2026-10-18): the avatar stays in view at the top while you
  // change things; only the options scroll; Save stays at the bottom.
  return (
    <div className="fixed inset-0 flex flex-col bg-background pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[calc(var(--safe-top)+var(--app-topnav-height))]">
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-3">
        {/* The avatar: always visible */}
        <div className="relative shrink-0 overflow-hidden rounded-[26px] bg-gradient-to-b from-[#BFE6FF] to-[#E8F7EC] shadow-[0_2px_10px_rgba(29,36,51,0.08)]">
          <canvas ref={canvasRef} className="block h-[min(40svh,340px)] min-h-[210px] w-full touch-none" aria-label={t('avatar.canvas')} role="img" />
          <div className="absolute inset-x-2 top-2 flex justify-between gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-bold text-navy shadow">
              <span aria-hidden>🤳🏾</span> {t('avatar.selfie')}
            </button>
            {mine?.avatar ? (
              <button type="button" onClick={() => setStickersOpen(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-bold text-navy shadow">
                <span aria-hidden>🎭</span> {t('avatar.stickers')}
              </button>
            ) : null}
            <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" aria-label={t('avatar.selfie')} onChange={(e) => void onSelfie(e.target.files?.[0])} />
          </div>
          {/* Poses sit on the stage, like a camera's modes */}
          <div className="absolute inset-x-0 bottom-2 flex gap-1.5 overflow-x-auto px-2 [scrollbar-width:none]" role="group" aria-label={t('avatar.poses')}>
            {POSES.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={pose === p.id}
                aria-label={t(`avatar.pose.${p.id}`)}
                onClick={() => setPose(p.id)}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg shadow ${pose === p.id ? 'bg-navy ring-2 ring-white' : 'bg-white/90'}`}
              >
                <span aria-hidden>{p.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Parts */}
        <div role="tablist" aria-label={t('avatar.parts')} className="no-scrollbar -mx-1 mt-2 flex shrink-0 gap-1.5 overflow-x-auto px-1 py-1">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              type="button"
              role="tab"
              aria-selected={tab === tb.key}
              onClick={() => {
                setTab(tb.key);
                optionsRef.current?.scrollTo({ top: 0 });
              }}
              className={`tap-target inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[13px] font-extrabold shadow-[0_2px_6px_rgba(29,36,51,0.12)] ${tab === tb.key ? 'bg-navy text-white' : 'bg-white text-navy'}`}
            >
              {t(`avatar.tab.${tb.key}`)}
            </button>
          ))}
        </div>

        {/* Options: the only part that scrolls */}
        {/* grow/basis-0 (not flex-1): the top bar hides when a "flex-1 overflow-y-auto" area scrolls; here it must stay */}
        <div ref={optionsRef} className="mt-1 flex min-h-0 grow basis-0 flex-col gap-2.5 overflow-y-auto overscroll-contain pb-2">
          {!cat || !cfg ? (
            <p className="rounded-2xl bg-white p-4 text-sm text-muted">{t('avatar.loading')}</p>
          ) : (
            current.slots.map((slot) => {
              const items = cat.items.filter((i) => i.slot === slot);
              const swatches = items.every((i) => i.color);
              const label = t(`avatar.slot.${slot}`);
              return (
                <section key={slot} aria-label={label} className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
                  <h2 className="px-1 text-sm font-extrabold text-navy">{label}</h2>
                  <div className={swatches ? 'flex flex-wrap gap-2' : 'grid grid-cols-3 gap-2'}>
                    {items.map((i) => {
                      const on = cfg[slot] === i.id;
                      const locked = i.price > 0 && !owned.has(i.id);
                      return swatches ? (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => pick(slot, i.id)}
                          aria-pressed={on}
                          aria-label={locked ? t('avatar.itemPrice', { name: i.name, price: i.price }) : i.name}
                          className={`relative h-11 w-11 rounded-full border-2 ${on ? 'border-navy ring-2 ring-primary' : 'border-white shadow'}`}
                          style={{ background: i.color }}
                        >
                          {locked ? <span className="absolute -right-1 -top-1 rounded-full bg-amber-soft px-1 text-[9px] font-black text-[#A86F0A]">🪙</span> : null}
                        </button>
                      ) : (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => pick(slot, i.id)}
                          aria-pressed={on}
                          className={`flex min-h-12 flex-col items-center justify-center rounded-xl border px-2 py-1.5 text-center text-xs font-bold ${on ? 'border-brand-green-dark bg-green-soft text-navy' : 'border-line bg-white text-navy'}`}
                        >
                          {i.name}
                          {locked ? <span className="text-[10px] font-black text-[#A86F0A]">🪙 {i.price}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
          <p className="px-2 pt-1 text-center text-xs font-semibold text-muted">
            {t('avatar.mapNote')}{' '}
            <Link href="/huud" className="font-bold text-brand-green-dark">
              {t('avatar.openMap')}
            </Link>
          </p>
        </div>

        {/* Bottom: premium items to get, then Save (always in reach) */}
        <div className="shrink-0 border-t border-line bg-background pb-2 pt-2">
          {unowned.length ? (
            <div className="mb-2 flex flex-col gap-1.5 rounded-2xl bg-amber-soft p-2.5">
              <p className="px-1 text-xs font-bold text-navy">{t('avatar.premiumNote', { balance: (mine?.balance ?? 0).toLocaleString('en-NG') })}</p>
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                {unowned.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    disabled={buy.isPending}
                    onClick={() =>
                      buy.mutate(i.id, {
                        onSuccess: () => toast.success(t('avatar.bought', { name: i.name })),
                        onError: (err) => toast.error(getErrorMessage(err)),
                      })
                    }
                    className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-navy px-3 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {t('avatar.get', { name: i.name, price: i.price })}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            disabled={!cfg || unowned.length > 0 || save.isPending}
            className="min-h-12 w-full rounded-full bg-primary text-[15px] font-bold text-white disabled:opacity-50"
          >
            {save.isPending ? t('avatar.saving') : t('avatar.save')}
          </button>
        </div>
      </div>

      <AppBottomSheet open={stickersOpen} onClose={() => setStickersOpen(false)} title={t('avatar.stickers')}>
        <p className="mb-2 text-xs font-semibold text-muted">{t('avatar.stickersHint')}</p>
        {stickersOpen ? <StickerPicker onPick={(url, caption) => void shareSticker(url, caption)} /> : null}
      </AppBottomSheet>
    </div>
  );
}
