'use client';

/**
 * Book a map ad (owner, 2026-10-12): pick the kind, design it (name, a short line, colour,
 * optional link), place it (billboards and sponsored pins: move the map under the marker;
 * plots: chosen on the Ad Wall), choose weeks and how to pay, see the preview, then pay.
 * HuudCredit pays at once; naira goes to the Bachs checkout and comes back to "My ads".
 */

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type * as maplibregl from 'maplibre-gl';
import { useAuth } from '@/hooks/useAuth';
import { useMyGamificationStats } from '@/hooks/useGamification';
import {
  AD_KINDS,
  createAd,
  fetchAdPricing,
  payAdWithCredit,
  payAdWithNaira,
  priceText,
  userArea,
  type AdCurrency,
  type AdKind,
} from '@/lib/adsApi';
import { AdBoard, boardInk, sponsoredPinHtml } from '@/components/map/AdBoard';
import { startView, STREET_ZOOM } from '@/lib/nigeriaView';
import { getErrorMessage } from '@/lib/error-handler';
import { nhToast } from '@/lib/toast';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

const HuudMap = dynamic(() => import('@/components/map/HuudMap').then((m) => m.HuudMap), {
  ssr: false,
  loading: () => <div className="h-[260px] w-full animate-pulse rounded-[16px] bg-[#DDE7EF] motion-reduce:animate-none" />,
});

const CARD = 'rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]';
const MAIN_BTN =
  'inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(0,184,46,0.28)] transition-colors hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-50';
const INPUT =
  'min-h-12 w-full rounded-[14px] border border-line bg-white px-4 text-[15px] text-navy placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';
const LABEL = 'text-sm font-bold text-navy';
const CHIP = 'min-h-11 rounded-full border px-4 text-sm font-bold transition-colors';
const chipClass = (on: boolean) => `${CHIP} ${on ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:bg-background'}`;

const KINDS: AdKind[] = ['billboard', 'plot', 'sponsored_pin'];
const PIN_LAYERS = [
  { key: 'market', label: 'Market' },
  { key: 'work', label: 'Work' },
  { key: 'events', label: 'Events' },
] as const;
/** Zoom needed before a spot can be chosen (street level). */
const PLACE_ZOOM = 14;

export default function NewAdPage() {
  return (
    <Suspense fallback={null}>
      <NewAd />
    </Suspense>
  );
}

function NewAd() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const { user, isLoading: userLoading } = useAuth();
  const area = userArea(user);
  const { data: stats } = useMyGamificationStats();
  const balance: number | undefined = stats?.totalHuudCoins;
  const pricing = useQuery({ queryKey: ['ads', 'pricing'], queryFn: fetchAdPricing, staleTime: 10 * 60_000 });

  const initialKind = KINDS.includes(params.get('kind') as AdKind) ? (params.get('kind') as AdKind) : 'billboard';
  const plotRow = params.get('row');
  const plotCol = params.get('col');
  const plot = plotRow != null && plotCol != null ? { row: Number(plotRow), col: Number(plotCol) } : null;

  const [kind, setKind] = useState<AdKind>(initialKind);
  const [title, setTitle] = useState('');
  const [line, setLine] = useState('');
  const [colour, setColour] = useState('#E8892B');
  const [target, setTarget] = useState('');
  const [pinLayer, setPinLayer] = useState<'market' | 'work' | 'events'>('market');
  const [weeks, setWeeks] = useState(1);
  const [payWith, setCurrency] = useState<AdCurrency>('HC');
  const [spot, setSpot] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const view = useMemo(() => startView(user), [user]);
  const onMap = (map: maplibregl.Map) => {
    const read = () => {
      const c = map.getCenter();
      setSpot({ lat: c.lat, lng: c.lng, zoom: map.getZoom() });
    };
    read();
    map.on('moveend', read);
  };

  if (!userLoading && !area) {
    return (
      <Shell>
        <EmptyState
          icon="📍"
          title="Set your area first"
          description="Ads show in your LGA. Add your area in your profile, then come back."
          action={{ label: 'Open settings', href: '/settings' }}
        />
      </Shell>
    );
  }
  if (pricing.isError) {
    return (
      <Shell>
        <ErrorState onRetry={() => void pricing.refetch()} homeHref="/ads" />
      </Shell>
    );
  }
  if (!pricing.data || userLoading) {
    return (
      <Shell>
        <Skeleton className="h-[480px] w-full rounded-[22px]" />
      </Shell>
    );
  }

  const p = pricing.data;
  // Naira only while Bachs is set up on the server.
  const currency: AdCurrency = p.naira ? payWith : 'HC';
  const total = p.prices[kind][currency] * weeks;
  const placed = kind === 'plot' ? !!plot : !!spot && spot.zoom >= PLACE_ZOOM;
  const shortOfCredit = currency === 'HC' && typeof balance === 'number' && balance < total;
  const ready = title.trim().length > 0 && placed && !shortOfCredit && !busy;

  const submit = async () => {
    if (!area || !ready) return;
    setBusy(true);
    setError(null);
    try {
      const ad = await createAd({
        kind,
        title: title.trim(),
        line: line.trim() || undefined,
        colour,
        target: target.trim() || undefined,
        pinLayer: kind === 'sponsored_pin' ? pinLayer : undefined,
        lga: area.lga,
        state: area.state,
        ...(kind === 'plot' ? { row: plot!.row, col: plot!.col } : { lat: spot!.lat, lng: spot!.lng }),
        weeks,
        currency,
      });
      if (currency === 'HC') {
        await payAdWithCredit(ad._id);
        void qc.invalidateQueries({ queryKey: ['ads'] });
        nhToast.success('Paid. Your ad is in review', 'We check every ad first. It goes live once approved.');
        router.push('/ads/mine');
      } else {
        const url = await payAdWithNaira(ad._id);
        window.location.assign(url);
      }
    } catch (e) {
      setError(getErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Shell>
      {/* 1. Kind */}
      <section className={`${CARD} flex flex-col gap-3 p-4`}>
        <h1 className="font-heading text-lg font-extrabold text-navy">Book an ad</h1>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Kind of ad">
          {AD_KINDS.map((k) => (
            <button key={k.kind} type="button" aria-pressed={kind === k.kind} className={chipClass(kind === k.kind)} onClick={() => setKind(k.kind)}>
              <span aria-hidden>{k.icon}</span> {k.name}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{AD_KINDS.find((k) => k.kind === kind)?.what}</p>
      </section>

      {/* 2. Design */}
      <section className={`${CARD} flex flex-col gap-3 p-4`}>
        <label htmlFor="ad-title" className="flex flex-col gap-1.5">
          <span className={LABEL}>Business name</span>
          <input id="ad-title" className={INPUT} value={title} maxLength={28} onChange={(e) => setTitle(e.target.value)} placeholder="Mama Bisi's Kitchen" />
          <span className="text-xs text-muted">{title.length}/28</span>
        </label>
        <label htmlFor="ad-line" className="flex flex-col gap-1.5">
          <span className={LABEL}>Short line (optional)</span>
          <input id="ad-line" className={INPUT} value={line} maxLength={44} onChange={(e) => setLine(e.target.value)} placeholder="Hot amala till 9pm" />
          <span className="text-xs text-muted">{line.length}/44</span>
        </label>
        <fieldset className="flex flex-col gap-1.5">
          <legend className={`${LABEL} mb-1.5`}>Colour</legend>
          <div className="flex flex-wrap gap-2">
            {p.colours.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${c}`}
                aria-pressed={colour === c}
                onClick={() => setColour(c)}
                className={`h-11 w-11 rounded-full border-2 ${colour === c ? 'border-navy ring-2 ring-navy ring-offset-2' : 'border-white'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </fieldset>
        <label htmlFor="ad-link" className="flex flex-col gap-1.5">
          <span className={LABEL}>Link (optional)</span>
          <input
            id="ad-link"
            className={INPUT}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="https://… or your NeyborHuud listing"
            inputMode="url"
            autoCapitalize="none"
          />
          <span className="text-xs text-muted">Where people go when they tap your ad. Must start with https://</span>
        </label>
        {kind === 'sponsored_pin' ? (
          <fieldset className="flex flex-col gap-1.5">
            <legend className={`${LABEL} mb-1.5`}>Show it in</legend>
            <div className="flex flex-wrap gap-2">
              {PIN_LAYERS.map((l) => (
                <button key={l.key} type="button" aria-pressed={pinLayer === l.key} className={chipClass(pinLayer === l.key)} onClick={() => setPinLayer(l.key)}>
                  {l.label}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
      </section>

      {/* 3. Place */}
      <section className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 className="font-heading text-base font-extrabold text-navy">Where</h2>
        {kind === 'plot' ? (
          plot ? (
            <p className="text-sm text-navy">
              Plot {plot.row + 1}-{plot.col + 1} on the {area?.lga} Ad Wall.{' '}
              <Link href="/ads/wall" className="font-bold text-brand-green-dark underline">
                Change
              </Link>
            </p>
          ) : (
            <Link href="/ads/wall" className={MAIN_BTN}>
              Pick a plot on the Ad Wall
            </Link>
          )
        ) : (
          <>
            <p className="text-sm text-muted">Move the map until the green marker sits on your shop or street.</p>
            <div className="relative overflow-hidden rounded-[16px]">
              <HuudMap
                center={view.center}
                zoom={view.zoom < PLACE_ZOOM ? view.zoom : STREET_ZOOM + 1}
                tilt={false}
                compass={false}
                className="h-[260px] w-full"
                label="Map to place your ad. The marker in the middle is your spot."
                onReady={onMap}
              />
              <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-3xl drop-shadow">
                📍
              </span>
            </div>
            {spot && spot.zoom < PLACE_ZOOM ? (
              <p className="text-xs font-bold text-[#A86F0A]">Zoom in to street level to choose the spot.</p>
            ) : null}
            <p className="text-xs text-muted">Each area has room for {p.spotsPerArea[kind === 'billboard' ? 'billboard' : 'sponsored_pin']} of these.</p>
          </>
        )}
      </section>

      {/* 4. How long and how to pay */}
      <section className={`${CARD} flex flex-col gap-3 p-4`}>
        <fieldset className="flex flex-col gap-1.5">
          <legend className={`${LABEL} mb-1.5`}>How long</legend>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: p.maxWeeks }, (_, i) => i + 1).map((w) => (
              <button key={w} type="button" aria-pressed={weeks === w} className={chipClass(weeks === w)} onClick={() => setWeeks(w)}>
                {w} week{w > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-1.5">
          <legend className={`${LABEL} mb-1.5`}>Pay with</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={currency === 'HC'} className={chipClass(currency === 'HC')} onClick={() => setCurrency('HC')}>
              🪙 HuudCredit
            </button>
            <button
              type="button"
              aria-pressed={currency === 'NGN'}
              className={chipClass(currency === 'NGN')}
              onClick={() => setCurrency('NGN')}
              disabled={!p.naira}
            >
              ₦ Naira{p.naira ? '' : ' (soon)'}
            </button>
          </div>
          {currency === 'HC' && typeof balance === 'number' ? (
            <p className={`text-xs font-bold ${shortOfCredit ? 'text-[#C8102E]' : 'text-muted'}`}>
              You have {balance.toLocaleString('en-NG')} HuudCredit{shortOfCredit ? '. Not enough for this booking.' : '.'}
            </p>
          ) : null}
        </fieldset>
      </section>

      {/* 5. Preview and pay */}
      <section className={`${CARD} flex flex-col gap-3 p-4`}>
        <h2 className="font-heading text-base font-extrabold text-navy">Preview</h2>
        <div className="flex min-h-[120px] items-end justify-center rounded-[16px] bg-[linear-gradient(180deg,#9ED3F5,#E9F3E1)] px-4 pb-4 pt-8">
          {kind === 'billboard' ? (
            <AdBoard title={title.trim()} line={line.trim() || undefined} colour={colour} />
          ) : kind === 'sponsored_pin' ? (
            <div className="pb-6" dangerouslySetInnerHTML={{ __html: sponsoredPinHtml({ title: title.trim() || 'Your name', pinLayer }) }} />
          ) : (
            <div
              className="grid h-20 w-20 place-items-center rounded-[8px] p-1 text-center text-[11px] font-extrabold leading-tight"
              style={{ background: colour, color: boardInk(colour) }}
            >
              {title.trim() || 'Your name'}
            </div>
          )}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-muted">Total</span>
          <span className="font-heading text-xl font-black text-navy">{priceText(total, currency)}</span>
        </div>
        {error ? (
          <p role="alert" className="rounded-[14px] bg-[#FDECEE] px-3 py-2 text-sm font-semibold text-[#C8102E]">
            {error}
          </p>
        ) : null}
        <button type="button" className={MAIN_BTN} disabled={!ready} onClick={submit}>
          {busy ? 'Please wait…' : currency === 'HC' ? `Pay ${priceText(total, 'HC')}` : `Pay ${priceText(total, 'NGN')}`}
        </button>
        <p className="text-xs text-muted">Our team checks every ad before it goes live. If we don&rsquo;t approve it, you get your money back.</p>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-[calc(var(--app-bottomnav-h)+1.5rem)] pt-[var(--app-topnav-offset)]">
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-4">{children}</main>
    </div>
  );
}
