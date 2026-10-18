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
import { useAvatarCatalogue, useBuyAvatarItem, useMyAvatar, useSaveAvatar, type AvatarConfig, type AvatarItem } from '@/hooks/useAvatar';

const TABS: { key: string; label: string; slots: { slot: string; label: string }[] }[] = [
  { key: 'body', label: 'Body', slots: [{ slot: 'skin', label: 'Skin tone' }, { slot: 'body', label: 'Body shape' }] },
  {
    key: 'face',
    label: 'Face',
    slots: [
      { slot: 'face', label: 'Face shape' },
      { slot: 'eyes', label: 'Eyes' },
      { slot: 'brows', label: 'Brows' },
      { slot: 'mouth', label: 'Mouth' },
      { slot: 'facialHair', label: 'Facial hair' },
    ],
  },
  { key: 'hair', label: 'Hair', slots: [{ slot: 'hair', label: 'Style' }, { slot: 'hairColor', label: 'Colour' }] },
  {
    key: 'clothes',
    label: 'Clothes',
    slots: [
      { slot: 'top', label: 'Top' },
      { slot: 'topColor', label: 'Top colour' },
      { slot: 'bottom', label: 'Bottom' },
      { slot: 'bottomColor', label: 'Bottom colour' },
      { slot: 'shoes', label: 'Shoes' },
    ],
  },
  { key: 'extras', label: 'Extras', slots: [{ slot: 'headwear', label: 'Headwear' }, { slot: 'glasses', label: 'Glasses' }, { slot: 'neck', label: 'Neck' }] },
];

export default function AvatarStudioPage() {
  const { data: cat } = useAvatarCatalogue();
  const { data: mine } = useMyAvatar();
  const save = useSaveAvatar();
  const buy = useBuyAvatarItem();
  const [cfg, setCfg] = useState<AvatarConfig | null>(null);
  const [tab, setTab] = useState('body');
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
      toast.success('Matched your skin tone. Now pick your hair and outfit.');
    } else {
      toast.error('Could not read that photo. Try one with your face in good light.');
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
      { onSuccess: () => toast.success('Avatar saved 🎉'), onError: (err) => toast.error(getErrorMessage(err)) },
    );
  };

  const current = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
    <div className="min-h-screen bg-background pb-[calc(var(--app-bottomnav-h)+1.5rem)] pt-[var(--app-topnav-offset)]">
      <main className="mx-auto flex max-w-lg flex-col gap-3 px-4 py-3">
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-b from-[#BFE6FF] to-[#E8F7EC] shadow-[0_2px_10px_rgba(29,36,51,0.08)]">
          <canvas ref={canvasRef} className="block h-[360px] w-full touch-none" aria-label="Your 3D avatar. Drag to turn it." role="img" />
          <div className="absolute left-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-bold text-navy shadow"
            >
              <span aria-hidden>🤳🏾</span> From a selfie
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => void onSelfie(e.target.files?.[0])} />
          </div>
          <p className="absolute bottom-2 left-0 right-0 text-center text-[11px] font-bold text-navy/60">Drag to turn · your selfie stays on your phone</p>
        </div>

        <div role="tablist" aria-label="Avatar parts" className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-[0_2px_10px_rgba(29,36,51,0.06)] [scrollbar-width:none]">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ${tab === t.key ? 'bg-navy text-white' : 'text-muted'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!cat || !cfg ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-muted">Loading the wardrobe…</p>
        ) : (
          current.slots.map(({ slot, label }) => {
            const items = cat.items.filter((i) => i.slot === slot);
            const swatches = items.every((i) => i.color);
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
                        aria-label={`${i.name}${locked ? `, ${i.price} HuudCredit` : ''}`}
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

        {unowned.length ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-amber-soft p-3">
            <p className="text-sm font-bold text-navy">You&apos;re trying on premium items. Get them to keep this look:</p>
            {unowned.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-2">
                <span className="text-sm text-navy">{i.name}</span>
                <button
                  type="button"
                  disabled={buy.isPending}
                  onClick={() =>
                    buy.mutate(i.id, {
                      onSuccess: () => toast.success(`${i.name} is yours`),
                      onError: (err) => toast.error(getErrorMessage(err)),
                    })
                  }
                  className="min-h-10 rounded-full bg-navy px-4 text-xs font-bold text-white disabled:opacity-50"
                >
                  Get · 🪙 {i.price}
                </button>
              </div>
            ))}
            <p className="text-xs font-semibold text-muted">You have 🪙 {(mine?.balance ?? 0).toLocaleString('en-NG')}.</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onSave}
          disabled={!cfg || unowned.length > 0 || save.isPending}
          className="min-h-12 rounded-full bg-primary text-[15px] font-bold text-white disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save my avatar'}
        </button>
        <p className="text-center text-xs font-semibold text-muted">
          Friends who follow you back see your avatar on the map when you choose “Show me to friends”.{' '}
          <Link href="/huud" className="font-bold text-brand-green-dark">
            Open the map
          </Link>
        </p>
      </main>
    </div>
  );
}
