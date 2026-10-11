'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, Lock, X } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Button } from '@/components/ui/Button';
import { nhToast } from '@/lib/toast';
import { apiMessage } from '@/lib/pollsApi';
import { createLostFound, LF_CATEGORIES, MAX_PLEDGE, type LfKind } from '@/lib/lostFoundApi';
import { useMyGamificationStats } from '@/hooks/useGamification';

/**
 * 🔎 Lost & Found — post something you lost or found (owner decisions 2026-10-10):
 * a private detail only the real owner would know (never shown publicly), a photo
 * for found items, and for lost items an optional HuudCredit thank-you (0–500),
 * held by the app until the item is returned. HuudCredit only, never cash.
 */

const nowLocal = () => {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

const field =
  'min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] text-navy outline-none placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25';

export function CreateLostFoundSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: stats } = useMyGamificationStats();
  const balance = typeof stats?.totalHuudCoins === 'number' ? stats.totalHuudCoins : null;
  const fileRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<LfKind>('lost');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<string>('');
  const [place, setPlace] = useState('');
  const [seenAt, setSeenAt] = useState(nowLocal());
  const [body, setBody] = useState('');
  const [secret, setSecret] = useState('');
  const [pledge, setPledge] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const maxPledge = Math.min(MAX_PLEDGE, balance ?? 0);
  const problems = [
    itemName.trim().length < 2 && 'Name the item.',
    !category && 'Pick a category.',
    place.trim().length < 3 && (kind === 'lost' ? 'Say where you last had it.' : 'Say where you found it.'),
    secret.trim().length < 3 && 'Add the private detail.',
    kind === 'found' && files.length === 0 && 'Add a photo of what you found.',
  ].filter(Boolean) as string[];

  const reset = () => {
    setKind('lost');
    setItemName('');
    setCategory('');
    setPlace('');
    setSeenAt(nowLocal());
    setBody('');
    setSecret('');
    setPledge(0);
    setFiles([]);
  };

  const submit = async () => {
    if (problems.length || busy) return;
    setBusy(true);
    try {
      let mediaUrls: string[] = [];
      if (files.length) {
        const up = await apiClient.uploadFiles<{ files: { url: string }[] }>('/media/upload', files);
        mediaUrls = (up.data?.files ?? []).map((f) => f.url).filter(Boolean);
      }
      const out = await createLostFound({
        kind,
        itemName: itemName.trim(),
        category,
        place: place.trim(),
        seenAt: seenAt ? new Date(seenAt).toISOString() : undefined,
        body: body.trim() || undefined,
        mediaUrls: mediaUrls.length ? mediaUrls : undefined,
        secretDetail: secret.trim(),
        pledge: kind === 'lost' && pledge > 0 ? pledge : undefined,
      });
      nhToast.success(kind === 'lost' ? 'Posted. Neighbours go help you look.' : 'Posted. The owner can now claim it.', undefined);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
      reset();
      onClose();
      router.push(`/lost-found/${out.postId}`);
    } catch (e) {
      nhToast.error('Not posted', apiMessage(e, 'Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppBottomSheet
      open={open}
      onClose={onClose}
      title="Lost & Found"
      description="Returned items earn the finder 50 HuudCredit."
      footer={
        <div className="flex flex-col gap-1.5">
          {problems.length ? <p className="text-center text-xs font-semibold text-muted">{problems[0]}</p> : null}
          <Button fullWidth loading={busy} disabled={problems.length > 0} onClick={submit}>
            {kind === 'lost' ? 'Post lost item' : 'Post found item'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Lost or found">
          {(['lost', 'found'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={`min-h-14 rounded-2xl text-[15px] font-extrabold ${kind === k ? 'bg-navy text-white' : 'border border-line bg-white text-navy'}`}
            >
              {k === 'lost' ? '😟 I lost something' : '🙌🏾 I found something'}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-navy">What is it?</span>
          <input value={itemName} onChange={(e) => setItemName(e.target.value.slice(0, 80))} placeholder="Black Tecno Camon phone" className={field} />
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-bold text-navy">Category</legend>
          <div className="flex flex-wrap gap-2">
            {LF_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold ${category === c.id ? 'bg-navy text-white' : 'border border-line bg-white text-navy'}`}
              >
                <span aria-hidden>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-navy">{kind === 'lost' ? 'Where did you last have it?' : 'Where did you find it?'}</span>
          <input value={place} onChange={(e) => setPlace(e.target.value.slice(0, 160))} placeholder={kind === 'lost' ? 'Keke from Ojuelegba to Bode Thomas' : 'Bariga junction BRT stop'} className={field} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-navy">When?</span>
          <input type="datetime-local" value={seenAt} max={nowLocal()} onChange={(e) => setSeenAt(e.target.value)} className={field} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-navy">More details (optional)</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 2000))} rows={2} placeholder={kind === 'lost' ? 'Anything that can help neighbours spot it' : 'Where you are keeping it, when you are around'} className={`${field} py-3`} />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold text-navy">Photos {kind === 'found' ? '(needed)' : '(optional)'}</span>
          <div className="flex flex-wrap gap-2">
            {previews.map((u, i) => (
              <div key={u} className="relative h-20 w-20 overflow-hidden rounded-2xl bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setFiles((all) => all.filter((_, k) => k !== i))} aria-label={`Remove photo ${i + 1}`} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-navy/70 text-white">
                  <X size={14} />
                </button>
              </div>
            ))}
            {files.length < 4 ? (
              <button type="button" onClick={() => fileRef.current?.click()} className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-line text-muted hover:bg-background" aria-label="Add photo">
                <Camera size={22} />
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
              setFiles((all) => [...all, ...picked].slice(0, 4));
              e.target.value = '';
            }}
          />
          {kind === 'found' ? <p className="text-xs text-muted">Cover anything with a name, number or face before you post.</p> : null}
        </div>

        <label className="flex flex-col gap-1.5 rounded-2xl bg-background p-3">
          <span className="flex items-center gap-1.5 text-sm font-bold text-navy">
            <Lock size={14} aria-hidden /> Private detail (only you see this)
          </span>
          <span className="text-xs text-muted">
            {kind === 'lost'
              ? 'Something only the real owner knows, e.g. "lock screen is my daughter" or "₦2,000 in the side pocket". Anyone who says they have it must match it.'
              : 'Something you noticed that the real owner should be able to describe. Anyone who says it is theirs must match it.'}
          </span>
          <input value={secret} onChange={(e) => setSecret(e.target.value.slice(0, 300))} placeholder="Keep it short" className={field} />
        </label>

        {kind === 'lost' ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-line p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-navy">🪙 Thank-you pledge (optional)</span>
              <span className="text-sm font-extrabold text-amber-ink">{pledge} HC</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxPledge}
              step={10}
              value={Math.min(pledge, maxPledge)}
              onChange={(e) => setPledge(Number(e.target.value))}
              disabled={maxPledge < 10}
              aria-label="Pledge in HuudCredit"
              className="accent-[#00B82E]"
            />
            <p className="text-xs text-muted">
              {balance === null
                ? 'Checking your HuudCredit…'
                : maxPledge < 10
                  ? 'You need at least 10 HuudCredit to pledge.'
                  : `Held by the app and given to whoever returns it. If nobody does, it comes back to you. You have ${balance.toLocaleString('en-NG')} HuudCredit.`}
            </p>
          </div>
        ) : null}
      </div>
    </AppBottomSheet>
  );
}
