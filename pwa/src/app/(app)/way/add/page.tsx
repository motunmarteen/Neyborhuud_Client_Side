'use client';

/**
 * Way Finder: share a route (owner 2026-10-19). A template, one card per leg:
 * how you travel, where to board, where to get off, fare, minutes, a tip. Each leg starts
 * where the last one ended. Answers a rider's request when opened from one (?request=).
 * The author earns HuudCredit once two different riders confirm it works.
 */

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { MODE_EMOJI, ROUTE_MODES, shareRoute, type RouteMode, type RouteStep } from '@/lib/wayFinder';

export default function AddRoutePage() {
  return (
    <Suspense>
      <AddRoute />
    </Suspense>
  );
}

const field =
  'h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] font-semibold text-navy outline-none placeholder:font-medium placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25';

type Leg = { mode: RouteMode; board: string; alight: string; fareMin: string; fareMax: string; minutes: string; note: string };
const blank = (board = '', alight = ''): Leg => ({ mode: 'danfo', board, alight, fareMin: '', fareMax: '', minutes: '', note: '' });

function AddRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const [from, setFrom] = useState(params.get('from') ?? '');
  const [to, setTo] = useState(params.get('to') ?? '');
  const [legs, setLegs] = useState<Leg[]>([blank(params.get('from') ?? '', params.get('to') ?? '')]);
  const [tips, setTips] = useState('');
  const [busy, setBusy] = useState(false);

  const setLeg = (i: number, patch: Partial<Leg>) => setLegs((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const addLeg = () =>
    setLegs((ls) => {
      // The new leg starts where the last one ended; the last one now stops short of the end.
      const last = ls[ls.length - 1];
      const next = [...ls];
      if (last && last.alight.trim() === to.trim()) next[next.length - 1] = { ...last, alight: '' };
      return [...next, blank(next[next.length - 1]?.alight ?? '', to)];
    });

  const removeLeg = (i: number) => setLegs((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls));

  const num = (v: string) => (v.trim() ? Number(v) : null);
  const ready = from.trim().length >= 2 && to.trim().length >= 2 && legs.every((l) => l.board.trim().length >= 2 && l.alight.trim().length >= 2);

  const submit = async () => {
    if (!user) {
      router.push(`/huud?login=1&next=${encodeURIComponent(`/way/add?from=${from}&to=${to}`)}`);
      return;
    }
    if (!ready || busy) return;
    setBusy(true);
    try {
      const steps: RouteStep[] = legs.map((l) => ({
        mode: l.mode,
        board: l.board.trim(),
        alight: l.alight.trim(),
        fareMin: num(l.fareMin),
        fareMax: num(l.fareMax) ?? num(l.fareMin),
        minutes: num(l.minutes),
        note: l.note.trim(),
      }));
      const route = await shareRoute({ from: from.trim(), to: to.trim(), steps, tips: tips.trim(), requestId: params.get('request') ?? undefined });
      toast.success(t('way.add.done'));
      router.replace(`/way?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&route=${route.id}`);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t('way.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppBrowseLayout maxWidth="680">
      <div className="flex flex-col gap-4 pb-6">
        <div className="rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
          <p className="font-heading text-[17px] font-black text-navy">🧭 {t('way.add.title')}</p>
          <p className="mt-0.5 text-[13px] font-semibold text-muted">{t('way.add.intro')}</p>
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span className="px-1 text-xs font-extrabold text-navy">{t('way.from')}</span>
              <input
                value={from}
                onChange={(e) => {
                  const v = e.target.value;
                  // The first leg boards where the trip starts.
                  setLegs((ls) => ls.map((l, i) => (i === 0 && (l.board === from || !l.board) ? { ...l, board: v } : l)));
                  setFrom(v);
                }}
                placeholder={t('way.fromPh')}
                className={field}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="px-1 text-xs font-extrabold text-navy">{t('way.to')}</span>
              <input
                value={to}
                onChange={(e) => {
                  const v = e.target.value;
                  // The last leg gets off where the trip ends.
                  setLegs((ls) => ls.map((l, i) => (i === ls.length - 1 && (l.alight === to || !l.alight) ? { ...l, alight: v } : l)));
                  setTo(v);
                }}
                placeholder={t('way.toPh')}
                className={field}
              />
            </label>
          </div>
        </div>

        <ol className="flex flex-col gap-3">
          {legs.map((l, i) => (
            <li key={i} className="flex flex-col gap-2 rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-navy">{t('way.add.leg', { n: i + 1 })}</p>
                {legs.length > 1 ? (
                  <button type="button" onClick={() => removeLeg(i)} aria-label={t('way.add.remove', { n: i + 1 })} className="grid h-9 w-9 place-items-center rounded-full text-brand-red hover:bg-red-soft">
                    <Trash2 size={16} aria-hidden />
                  </button>
                ) : null}
              </div>
              <div role="radiogroup" aria-label={t('way.add.how')} className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
                {ROUTE_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={l.mode === m}
                    onClick={() => setLeg(i, { mode: m })}
                    className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] font-extrabold shadow-[0_2px_6px_rgba(29,36,51,0.12)] ${l.mode === m ? 'bg-navy text-white' : 'bg-white text-navy'}`}
                  >
                    <span aria-hidden>{MODE_EMOJI[m]}</span> {t(`way.mode.${m}`)}
                  </button>
                ))}
              </div>
              {/* Labels stay visible after typing (owner asked what the boxes were, 2026-11-11). */}
              <label className="flex flex-col gap-1">
                <span className="px-1 text-xs font-extrabold text-navy">{t('way.add.board')}</span>
                <input value={l.board} onChange={(e) => setLeg(i, { board: e.target.value })} placeholder={t('way.add.boardPh')} className={field} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="px-1 text-xs font-extrabold text-navy">{t('way.add.alight')}</span>
                <input value={l.alight} onChange={(e) => setLeg(i, { alight: e.target.value })} placeholder={t('way.add.alightPh')} className={field} />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex min-w-0 flex-col gap-1">
                  <span className="truncate px-1 text-xs font-extrabold text-navy">{t('way.add.fareLow')}</span>
                  <input inputMode="numeric" value={l.fareMin} onChange={(e) => setLeg(i, { fareMin: e.target.value.replace(/\D/g, '') })} placeholder="300" className={field} />
                </label>
                <label className="flex min-w-0 flex-col gap-1">
                  <span className="truncate px-1 text-xs font-extrabold text-navy">{t('way.add.fareHigh')}</span>
                  <input inputMode="numeric" value={l.fareMax} onChange={(e) => setLeg(i, { fareMax: e.target.value.replace(/\D/g, '') })} placeholder="400" className={field} />
                </label>
                <label className="flex min-w-0 flex-col gap-1">
                  <span className="truncate px-1 text-xs font-extrabold text-navy">{t('way.add.mins')}</span>
                  <input inputMode="numeric" value={l.minutes} onChange={(e) => setLeg(i, { minutes: e.target.value.replace(/\D/g, '') })} placeholder="25" className={field} />
                </label>
              </div>
              <p className="px-1 text-[11px] font-semibold text-muted">{t('way.add.fareHint')}</p>
              <input value={l.note} onChange={(e) => setLeg(i, { note: e.target.value })} maxLength={200} placeholder={t('way.add.notePh')} aria-label={t('way.add.note')} className={field} />
            </li>
          ))}
        </ol>

        <button type="button" onClick={addLeg} disabled={legs.length >= 8} className="inline-flex min-h-11 items-center justify-center gap-1.5 self-start rounded-full bg-green-soft px-4 text-sm font-extrabold text-brand-green-dark disabled:opacity-50">
          <Plus size={16} aria-hidden /> {t('way.add.addLeg')}
        </button>

        <label className="flex flex-col gap-1">
          <span className="px-1 text-xs font-extrabold text-navy">{t('way.add.tips')}</span>
          <textarea value={tips} onChange={(e) => setTips(e.target.value)} maxLength={500} rows={3} placeholder={t('way.add.tipsPh')} className="w-full rounded-2xl border border-line bg-white p-3 text-[15px] font-semibold text-navy outline-none placeholder:font-medium placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25" />
        </label>

        <p className="rounded-2xl bg-amber-soft/60 p-3 text-[13px] font-semibold text-navy">🪙 {t('way.add.reward')}</p>

        <button type="button" onClick={() => void submit()} disabled={!ready || busy} className="min-h-12 rounded-full bg-primary text-[15px] font-extrabold text-white disabled:opacity-50">
          {busy ? <Loader2 size={18} className="mx-auto animate-spin motion-reduce:animate-none" aria-hidden /> : t('way.add.submit')}
        </button>
      </div>
    </AppBrowseLayout>
  );
}
