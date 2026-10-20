'use client';

/**
 * Way Finder (owner 2026-10-19): "How do I get to Agege from Isolo?", answered by neighbours.
 * Search a trip, see the routes riders shared (several per trip), the riders' picks for
 * fastest and fastest in traffic, and the steps. Riders say "This worked" / "Didn't work" and
 * vote; the author earns HuudCredit when two different riders confirm. No route yet? Ask riders
 * or share one you know. Also opened from Ask Huud (?from=&to= or ?route=).
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownUp, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { FilterChip } from '@/components/ui/Chip';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import {
  askRiders, fareText, findRoutes, getRoute, MODE_EMOJI, minutesText, openRequests, routeFeedback, voteRoute,
  type RouteRequest, type RouteView,
} from '@/lib/wayFinder';

export default function WayFinderPage() {
  return (
    <Suspense>
      <WayFinder />
    </Suspense>
  );
}

const field =
  'h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] font-semibold text-navy outline-none placeholder:font-medium placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25';

function WayFinder() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const [from, setFrom] = useState(params.get('from') ?? '');
  const [to, setTo] = useState(params.get('to') ?? '');
  const [prefer, setPrefer] = useState<'fastest' | 'traffic' | null>(null);
  const [routes, setRoutes] = useState<RouteView[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<RouteRequest[]>([]);
  const [open, setOpen] = useState<RouteView | null>(null);
  const [asked, setAsked] = useState(false);

  const search = useCallback(
    async (f = from, tt = to, p = prefer) => {
      if (tt.trim().length < 2) return;
      setLoading(true);
      setAsked(false);
      try {
        setRoutes(await findRoutes(f.trim(), tt.trim(), p));
      } catch {
        toast.error(t('way.loadFailed'));
      } finally {
        setLoading(false);
      }
    },
    [from, to, prefer, t],
  );

  useEffect(() => {
    if (params.get('to')) void search(params.get('from') ?? '', params.get('to') ?? '');
    const rid = params.get('route');
    if (rid) getRoute(rid).then((r) => r && setOpen(r)).catch(() => undefined);
    openRequests().then(setRequests).catch(() => setRequests([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needLogin = () => {
    if (user) return false;
    router.push(`/huud?login=1&next=${encodeURIComponent(`/way?from=${from}&to=${to}`)}`);
    return true;
  };

  const update = (r: RouteView) => {
    setOpen(r);
    setRoutes((list) => (list ? list.map((x) => (x.id === r.id ? { ...r, badges: x.badges } : x)) : list));
  };

  const ask = async () => {
    if (needLogin()) return;
    try {
      const out = await askRiders(from.trim(), to.trim());
      setAsked(true);
      toast.success(out.existing ? t('way.askedJoin') : t('way.asked'));
    } catch {
      toast.error(t('way.failed'));
    }
  };

  const addHref = (f: string, tt: string, req?: string) =>
    `/way/add?from=${encodeURIComponent(f)}&to=${encodeURIComponent(tt)}${req ? `&request=${req}` : ''}`;

  return (
    <AppBrowseLayout maxWidth="680">
      <div className="flex flex-col gap-4 pb-6">
        <div className="rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
          <p className="font-heading text-[17px] font-black text-navy">🧭 {t('way.title')}</p>
          <p className="mt-0.5 text-[13px] font-semibold text-muted">{t('way.intro')}</p>
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void search();
            }}
          >
            <div className="relative flex flex-col gap-2">
              <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder={t('way.fromPh')} aria-label={t('way.from')} className={field} />
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={t('way.toPh')} aria-label={t('way.to')} className={field} />
              <button
                type="button"
                onClick={() => {
                  setFrom(to);
                  setTo(from);
                }}
                aria-label={t('way.swap')}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-navy shadow-[0_2px_6px_rgba(29,36,51,0.18)]"
              >
                <ArrowDownUp size={16} aria-hidden />
              </button>
            </div>
            <button type="submit" disabled={to.trim().length < 2 || loading} className="min-h-12 rounded-full bg-primary text-[15px] font-extrabold text-white disabled:opacity-50">
              {loading ? <Loader2 size={18} className="mx-auto animate-spin motion-reduce:animate-none" aria-hidden /> : t('way.find')}
            </button>
          </form>
        </div>

        {routes ? (
          <section className="flex flex-col gap-2" aria-live="polite">
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
              <FilterChip active={!prefer} onClick={() => { setPrefer(null); void search(from, to, null); }}>{t('way.all')}</FilterChip>
              <FilterChip active={prefer === 'fastest'} icon="⚡" onClick={() => { setPrefer('fastest'); void search(from, to, 'fastest'); }}>{t('way.fastest')}</FilterChip>
              <FilterChip active={prefer === 'traffic'} icon="🚦" onClick={() => { setPrefer('traffic'); void search(from, to, 'traffic'); }}>{t('way.traffic')}</FilterChip>
            </div>
            {routes.length ? (
              routes.map((r) => <RouteCard key={r.id} r={r} onOpen={() => setOpen(r)} />)
            ) : (
              <div className="rounded-2xl bg-white p-4 text-center shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
                <p className="text-2xl" aria-hidden>🧭</p>
                <p className="mt-1 font-bold text-navy">{t('way.noneTitle', { from: from || t('way.yourArea'), to })}</p>
                <p className="mt-1 text-sm text-muted">{t('way.noneBody')}</p>
                <div className="mt-3 flex flex-col gap-2">
                  <button type="button" disabled={asked || !from.trim()} onClick={() => void ask()} className="min-h-11 rounded-full bg-primary px-4 text-sm font-extrabold text-white disabled:opacity-50">
                    {asked ? t('way.askedShort') : t('way.askRiders')}
                  </button>
                  <Link href={addHref(from, to)} className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-extrabold text-navy ring-1 ring-line">
                    {t('way.iKnow')}
                  </Link>
                </div>
              </div>
            )}
            {routes.length ? (
              <Link href={addHref(from, to)} className="inline-flex min-h-11 items-center justify-center gap-1.5 self-start rounded-full bg-green-soft px-4 text-sm font-extrabold text-brand-green-dark">
                <Plus size={16} aria-hidden /> {t('way.addAnother')}
              </Link>
            ) : null}
          </section>
        ) : null}

        {!routes && requests.length ? (
          <section aria-labelledby="req-h" className="flex flex-col gap-2">
            <p id="req-h" className="px-1 text-[11px] font-black uppercase tracking-wider text-faint">{t('way.requestsTitle')}</p>
            <p className="px-1 text-xs font-semibold text-muted">{t('way.requestsBody')}</p>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
              {requests.map((q) => (
                <li key={q.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold text-navy">{q.from} → {q.to}</span>
                    <span className="block text-xs text-muted">{t(q.askers === 1 ? 'way.askers_one' : 'way.askers_other', { n: q.askers })}</span>
                  </span>
                  <Link href={addHref(q.from, q.to, q.id)} className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-primary px-3.5 text-xs font-extrabold text-white">
                    {t('way.iKnowShort')}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!routes ? (
          <Link href={addHref('', '')} className="flex min-h-14 items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-green-soft text-lg" aria-hidden>➕</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-extrabold text-navy">{t('way.share')}</span>
              <span className="block text-[13px] text-muted">{t('way.shareBody')}</span>
            </span>
          </Link>
        ) : null}
      </div>

      <AppBottomSheet open={!!open} onClose={() => setOpen(null)} title={open ? `${open.from} → ${open.to}` : ''}>
        {open ? <RouteDetail r={open} needLogin={needLogin} onChange={update} /> : null}
      </AppBottomSheet>
    </AppBrowseLayout>
  );
}

function Badges({ r }: { r: RouteView }) {
  const { t } = useTranslation();
  return (
    <span className="flex flex-wrap gap-1">
      {r.badges.includes('fastest') ? <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[11px] font-black text-[#8A5A00]">⚡ {t('way.fastest')}</span> : null}
      {r.badges.includes('traffic') ? <span className="rounded-full bg-blue-soft px-2 py-0.5 text-[11px] font-black text-[#1F4E8C]">🚦 {t('way.bestTraffic')}</span> : null}
      {r.confirmed ? <span className="rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-black text-brand-green-dark">✓ {t('way.confirmed')}</span> : null}
    </span>
  );
}

function RouteCard({ r, onOpen }: { r: RouteView; onOpen: () => void }) {
  const { t } = useTranslation();
  const total = [fareText(r.fareMin, r.fareMax), minutesText(r.minutes)].filter(Boolean).join(' · ');
  return (
    <button type="button" onClick={onOpen} className="flex flex-col gap-2 rounded-2xl bg-white p-3.5 text-left shadow-[0_2px_10px_rgba(29,36,51,0.06)] hover:bg-[#F6F8FB]">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[15px] font-extrabold text-navy">{r.from} → {r.to}</span>
        {total ? <span className="shrink-0 text-sm font-extrabold text-brand-green-dark">{total}</span> : null}
      </div>
      <Badges r={r} />
      <span className="flex flex-wrap items-center gap-1 text-[13px] font-semibold text-muted">
        {r.steps.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            {i > 0 ? <span aria-hidden>›</span> : null}
            <span aria-hidden>{MODE_EMOJI[s.mode]}</span> {s.alight}
          </span>
        ))}
      </span>
      <span className="text-xs text-muted">
        {t('way.votesLine', { worked: r.worked, fastest: r.fastest, traffic: r.traffic })}
      </span>
    </button>
  );
}

function RouteDetail({ r, needLogin, onChange }: { r: RouteView; needLogin: () => boolean; onChange: (r: RouteView) => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<RouteView>, done?: string) => {
    if (needLogin() || busy) return;
    setBusy(true);
    try {
      onChange(await fn());
      if (done) toast.success(done);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t('way.failed'));
    } finally {
      setBusy(false);
    }
  };
  const total = [fareText(r.fareMin, r.fareMax), minutesText(r.minutes)].filter(Boolean).join(' · ');
  return (
    <div className="flex flex-col gap-3 pb-2">
      <Badges r={r} />
      <ol className="flex flex-col gap-2">
        {r.steps.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-2xl bg-background p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-lg" aria-hidden>{MODE_EMOJI[s.mode]}</span>
            <span className="min-w-0 flex-1 text-sm text-navy">
              <span className="font-extrabold">{i + 1}. </span>
              {t(`way.step.${s.mode}`, { board: s.board, alight: s.alight })}
              {fareText(s.fareMin, s.fareMax) || s.minutes ? (
                <span className="mt-0.5 block text-xs font-bold text-muted">{[fareText(s.fareMin, s.fareMax), minutesText(s.minutes)].filter(Boolean).join(' · ')}</span>
              ) : null}
              {s.note ? <span className="mt-0.5 block text-xs text-muted">💡 {s.note}</span> : null}
            </span>
          </li>
        ))}
      </ol>
      {total ? <p className="text-sm font-extrabold text-navy">{t('way.total', { total })}</p> : null}
      {r.tips ? <p className="rounded-2xl bg-amber-soft/60 p-3 text-sm text-navy">💡 {r.tips}</p> : null}
      {r.author ? <p className="text-xs text-muted">{t('way.by', { name: r.author.name })}</p> : null}

      {r.mine ? (
        <p className="rounded-2xl bg-green-soft p-3 text-sm font-semibold text-brand-green-dark">{r.confirmed ? t('way.mineConfirmed') : t('way.mine')}</p>
      ) : (
        <>
          <p className="text-[13px] font-extrabold text-navy">{t('way.usedIt')}</p>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => void act(() => routeFeedback(r.id, true), t('way.thanksWorked'))} className={`min-h-11 flex-1 rounded-full text-sm font-extrabold ${r.myVote === 'worked' ? 'bg-primary text-white' : 'bg-white text-navy ring-1 ring-line'}`}>
              ✓ {t('way.worked')}
            </button>
            <button type="button" disabled={busy} onClick={() => void act(() => routeFeedback(r.id, false), t('way.thanksFailed'))} className={`min-h-11 flex-1 rounded-full text-sm font-extrabold ${r.myVote === 'failed' ? 'bg-brand-red text-white' : 'bg-white text-navy ring-1 ring-line'}`}>
              ✕ {t('way.failedBtn')}
            </button>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={busy} aria-pressed={r.myFastest} onClick={() => void act(() => voteRoute(r.id, 'fastest'))} className={`min-h-11 flex-1 rounded-full text-sm font-extrabold ${r.myFastest ? 'bg-[#E0901A] text-white' : 'bg-white text-navy ring-1 ring-line'}`}>
              ⚡ {t('way.voteFastest')}
            </button>
            <button type="button" disabled={busy} aria-pressed={r.myTraffic} onClick={() => void act(() => voteRoute(r.id, 'traffic'))} className={`min-h-11 flex-1 rounded-full text-sm font-extrabold ${r.myTraffic ? 'bg-[#2F6FC4] text-white' : 'bg-white text-navy ring-1 ring-line'}`}>
              🚦 {t('way.voteTraffic')}
            </button>
          </div>
          <p className="text-[11px] text-muted">{t('way.voteNote')}</p>
        </>
      )}
    </div>
  );
}
