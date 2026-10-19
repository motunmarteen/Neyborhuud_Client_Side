'use client';

/**
 * Ask Huud: NeyborHuud's assistant (owner 2026-10-19, docs/ASK-HUUD-PLAN.md).
 *
 * One box for everything: "Ask Huud anything…".
 * - Names, words, #tags: results as you type
 * - Questions ("where can I buy…", "which feature helps me…"): press Enter; the answer is on
 *   top with results and "Open" buttons below
 * - Empty box: what to try, Explore, trending and news
 * Safety tools live on the Sentinel tab; Ask Huud can still answer about your area's safety.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUp, BadgeCheck, ExternalLink, Loader2, MapPin, Search, Sparkles, X } from 'lucide-react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useHuudDisplayName, HUUD_NAME_FALLBACK } from '@/hooks/useHuudDisplayName';
import { getCurrentLocation } from '@/lib/geolocation';
import { askHuud, classifyQuery, GROUP_KEY, type AskFeature, type AskPerson, type AskPlace, type AskPost, type AskResult } from '@/lib/askSentinel';
import { searchService } from '@/services/search.service';
import { newsService } from '@/services/news.service';
import type { RssArticle } from '@/types/incident';
import { WhoIsInMyHuudDrawer } from '@/components/neighborhood/WhoIsInMyHuudDrawer';
import { useTranslation } from '@/lib/i18n';

const EXPLORE_TILES = [
  { href: '/huud', icon: '🗺️', key: 'map' },
  { href: '/marketplace', icon: '🛒', key: 'market' },
  { href: '/services', icon: '🛠️', key: 'artisans' },
  { href: '/events', icon: '🎉', key: 'events' },
  { href: '/jobs', icon: '💼', key: 'jobs' },
  { href: '/fyi', icon: '📢', key: 'notices' },
  { href: '/communities', icon: '🏘️', key: 'estates' },
  { href: '/help-request', icon: '🙏', key: 'help' },
];

const TYPE_ICON: Record<string, string> = {
  emergency: '🚨', fyi: '📢', marketplace: '🛒', event: '🎉', services: '🛠️', job: '💼', help_request: '🙏', gossip: '💬', post: '✏️',
};

const MOOD = {
  safe: { key: 'ask.mood.safe', tone: 'green' as const, icon: '🟢' },
  advisory: { key: 'ask.mood.advisory', tone: 'amber' as const, icon: '🟡' },
  alert: { key: 'ask.mood.alert', tone: 'red' as const, icon: '🔴' },
};

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function AskHuudPage() {
  return (
    <Suspense>
      <AskHuudScreen />
    </Suspense>
  );
}

function AskHuudScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const huudName = useHuudDisplayName(user);
  const area = huudName && huudName !== HUUD_NAME_FALLBACK ? huudName : null;
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [result, setResult] = useState<AskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [trending, setTrending] = useState<string[]>([]);
  const [news, setNews] = useState<RssArticle[]>([]);
  const [whoOpen, setWhoOpen] = useState(false);
  const runId = useRef(0);

  const mode = classifyQuery(query);

  const run = useCallback(
    async (q: string, withCoords = coords) => {
      const text = q.trim();
      if (!text) return;
      const id = ++runId.current;
      setLoading(true);
      setError(null);
      try {
        const out = await askHuud(text, withCoords);
        if (id === runId.current) setResult(out);
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (id === runId.current) setError(status === 429 ? t('ask.tooMany') : t('ask.failed'));
      } finally {
        if (id === runId.current) setLoading(false);
      }
    },
    [coords, t],
  );

  // Opened from the top bar 🔍, the map card or a #tag link: focus the box, run ?q= once.
  useEffect(() => {
    const q = params.get('q');
    if (q) void run(q);
    if (params.get('focus') === '1' || q) inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lookups search as you type; questions wait for Enter so the AI is not called on every key.
  useEffect(() => {
    if (!query.trim()) {
      setResult(null);
      setError(null);
      return;
    }
    if (mode !== 'search' || query.trim().length < 2) return;
    const timer = setTimeout(() => void run(query), 350);
    return () => clearTimeout(timer);
  }, [query, mode, run]);

  useEffect(() => {
    searchService.getTrendingSearches(8).then(setTrending).catch(() => setTrending([]));
    newsService.getArticles({ region: 'nigeria', limit: 3 }).then(setNews).catch(() => setNews([]));
  }, []);

  const ask = (q: string) => {
    setQuery(q);
    void run(q);
  };

  const useMyLocation = async () => {
    const c = await getCurrentLocation().catch(() => null);
    if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
      setCoords({ lat: c.lat, lng: c.lng });
      void run(query, { lat: c.lat, lng: c.lng });
    } else {
      setError(t('ask.locationOff'));
    }
  };

  // What Ask Huud can do, as one-tap questions (plan §2).
  const tryQuestions = useMemo(
    () => [
      t('ask.try.buy'),
      t('ask.try.carpenter'),
      t('ask.try.sunday'),
      area ? t('ask.try.lightArea', { area }) : t('ask.try.light'),
      t('ask.try.feature'),
      t('ask.try.news'),
    ],
    [area, t],
  );

  const hasQuery = query.trim().length > 0;

  return (
    <AppBrowseLayout
      className="!px-0 !pt-0"
      header={
        <div className="px-4 pb-3 pt-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(query);
            }}
            className="relative flex items-center"
            role="search"
          >
            <Sparkles size={18} className="pointer-events-none absolute left-4 text-brand-green-dark" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('ask.placeholder')}
              aria-label={t('ask.placeholder')}
              enterKeyHint={mode === 'question' ? 'send' : 'search'}
              className="h-[52px] w-full rounded-full border border-line bg-white pl-11 pr-24 text-[15px] font-semibold text-navy shadow-[0_2px_10px_rgba(29,36,51,0.06)] outline-none placeholder:font-medium placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            {hasQuery ? (
              <button type="button" onClick={() => setQuery('')} aria-label={t('ask.clear')} className="absolute right-14 grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-background">
                <X size={17} />
              </button>
            ) : null}
            <button
              type="submit"
              aria-label={mode === 'question' ? t('ask.send') : t('ask.search')}
              disabled={!hasQuery || loading}
              className="absolute right-1.5 grid h-10 w-10 place-items-center rounded-full bg-primary text-white disabled:bg-line disabled:text-faint"
            >
              {loading ? <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden /> : mode === 'question' ? <ArrowUp size={19} strokeWidth={2.6} aria-hidden /> : <Search size={17} aria-hidden />}
            </button>
          </form>
          {hasQuery && mode === 'question' && !loading && (!result || result.query !== query.trim()) ? (
            <p className="mt-1.5 px-4 text-xs font-semibold text-muted">{t('ask.pressEnter')}</p>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-4 px-4 pb-6">
        {error ? <Card className="border border-red-soft bg-red-soft/40 text-sm font-semibold text-[#C2353A]">{error}</Card> : null}

        {hasQuery && result ? (
          <Results result={result} onAsk={ask} onUseLocation={useMyLocation} onOpenPost={(id) => router.push(`/feed?post=${id}`)} />
        ) : null}

        {hasQuery && !result && loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-muted" role="status">
            <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden /> {mode === 'question' ? t('ask.thinking') : t('ask.searching')}
          </div>
        ) : null}

        {!hasQuery ? (
          <>
            <Card className="ring-1 ring-green-soft">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-green-soft text-brand-green-dark" aria-hidden>
                  <Sparkles size={19} />
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-[17px] font-black text-navy">{t('ask.title')}</p>
                  <p className="text-[13px] font-semibold text-muted">{t('ask.intro')}</p>
                </div>
              </div>
            </Card>

            <section aria-labelledby="try-title">
              <p id="try-title" className="mb-2 px-1 text-[11px] font-black uppercase tracking-wider text-faint">{t('ask.tryTitle')}</p>
              <div className="flex flex-wrap gap-2">
                {tryQuestions.map((q) => (
                  <button key={q} type="button" onClick={() => ask(q)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-bold text-navy hover:bg-[#F6F8FB]">
                    <Sparkles size={14} className="text-brand-green-dark" aria-hidden /> {q}
                  </button>
                ))}
                <button type="button" onClick={() => setWhoOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-bold text-navy hover:bg-[#F6F8FB]">
                  👥 {t('ask.who')}
                </button>
              </div>
            </section>

            <section aria-labelledby="explore-title">
              <p id="explore-title" className="mb-2 px-1 text-[11px] font-black uppercase tracking-wider text-faint">{t('ask.explore')}</p>
              <div className="grid grid-cols-2 gap-2">
                {EXPLORE_TILES.map((tile) => (
                  <Link key={tile.href} href={tile.href} className="flex min-h-[64px] items-center gap-3 rounded-[22px] bg-white px-3.5 py-3 shadow-[0_2px_10px_rgba(29,36,51,0.06)] hover:bg-[#F6F8FB]">
                    <span className="text-2xl" aria-hidden>{tile.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-extrabold text-navy">{t(`ask.tile.${tile.key}`)}</span>
                      <span className="block truncate text-xs text-muted">{t(`ask.tile.${tile.key}Sub`)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {trending.length ? (
              <section aria-labelledby="trend-title">
                <p id="trend-title" className="mb-2 px-1 text-[11px] font-black uppercase tracking-wider text-faint">{t('ask.trending')}</p>
                <div className="flex flex-wrap gap-2">
                  {trending.map((tr) => (
                    <button key={tr} type="button" onClick={() => setQuery(tr)} className="min-h-10 rounded-full bg-white px-3 text-sm font-bold text-navy shadow-[0_1px_3px_rgba(29,36,51,0.06)]">
                      {tr}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {news.length ? (
              <section aria-labelledby="news-title" className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <p id="news-title" className="text-[11px] font-black uppercase tracking-wider text-faint">{t('ask.news')}</p>
                  <Link href="/local-news" className="text-sm font-extrabold text-brand-green-dark">{t('ask.allNews')}</Link>
                </div>
                {news.map((a, i) => (
                  <a key={i} href={a.link || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-[22px] bg-white p-3 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.imageUrl} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold uppercase text-brand-green-dark">{a.sourceName || a.source}</span>
                      <span className="line-clamp-2 text-sm font-bold text-navy">{a.title}</span>
                    </span>
                    <ExternalLink size={14} className="shrink-0 text-faint" aria-hidden />
                  </a>
                ))}
              </section>
            ) : null}
          </>
        ) : null}
      </div>

      <WhoIsInMyHuudDrawer isOpen={whoOpen} onClose={() => setWhoOpen(false)} />
    </AppBrowseLayout>
  );
}

function Results({
  result,
  onAsk,
  onUseLocation,
  onOpenPost,
}: {
  result: AskResult;
  onAsk: (q: string) => void;
  onUseLocation: () => void;
  onOpenPost: (id: string) => void;
}) {
  const { t } = useTranslation();
  const mood = result.answer ? MOOD[result.answer.sentiment] : null;
  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      {result.answer ? (
        <Card className="ring-1 ring-green-soft">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-green-soft text-brand-green-dark" aria-hidden>
              <Sparkles size={16} />
            </span>
            <p className="font-heading text-[15px] font-extrabold text-navy">{t('ask.title')}</p>
            {mood && result.answer.sources.length ? <Chip tone={mood.tone}>{mood.icon} {t(mood.key)}</Chip> : null}
            {result.answer.assessedArea?.lga ? <span className="ml-auto truncate text-xs font-bold text-muted">{result.answer.assessedArea.lga}</span> : null}
          </div>
          <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-relaxed text-navy">{result.answer.answer}</p>
          {result.answer.sources.length ? (
            <ul className="mt-3 flex flex-col gap-1.5">
              {result.answer.sources.slice(0, 4).map((s, i) => (
                <li key={i} className="flex items-center gap-2 rounded-2xl bg-background px-3 py-2 text-sm text-navy">
                  <MapPin size={14} className="shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{s.title}</span>
                  {s.distanceLabel ? <span className="shrink-0 text-xs font-bold text-muted">{s.distanceLabel}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {result.answer.suggestedFollowUps.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {result.answer.suggestedFollowUps.map((f) => (
                <button key={f} type="button" onClick={() => onAsk(f)} className="min-h-10 rounded-full bg-green-soft px-3 text-sm font-bold text-brand-green-dark">
                  {f}
                </button>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-[11px] text-faint">{t('ask.disclaimer')}</p>
        </Card>
      ) : null}

      {result.needsLocation ? (
        <Card>
          <p className="font-bold text-navy">{t('ask.whereTitle')}</p>
          <p className="mt-1 text-sm text-muted">{t('ask.whereBody')}</p>
          <Button className="mt-3" variant="soft" fullWidth onClick={onUseLocation}>
            <MapPin size={16} aria-hidden /> {t('ask.useLocation')}
          </Button>
        </Card>
      ) : null}

      {result.mode === 'search' && result.query && !result.groups.some((g) => g.key === 'features') ? (
        <button type="button" onClick={() => onAsk(t('ask.aboutQ', { q: result.query }))} className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-green-soft px-4 text-sm font-extrabold text-brand-green-dark">
          <Sparkles size={15} aria-hidden /> {t('ask.about', { q: result.query })}
        </button>
      ) : null}

      {result.total === 0 && !result.answer ? (
        <Card className="text-center">
          <p className="text-2xl" aria-hidden>🔎</p>
          <p className="mt-1 font-bold text-navy">{t('ask.nothing', { q: result.query })}</p>
          <p className="mt-1 text-sm text-muted">{t('ask.nothingBody')}</p>
        </Card>
      ) : null}

      {result.groups.map((g) => (
        <section key={g.key} aria-label={t(GROUP_KEY[g.key])}>
          <p className="mb-2 px-1 text-[13px] font-extrabold text-navy">{t(GROUP_KEY[g.key])}</p>
          <Card padding="none" className="divide-y divide-line">
            {g.items.map((item, i) =>
              g.key === 'features' ? (
                <FeatureRow key={i} f={item as AskFeature} />
              ) : g.key === 'people' ? (
                <PersonRow key={i} p={item as AskPerson} />
              ) : g.key === 'places' ? (
                <PlaceRow key={i} p={item as AskPlace} onAsk={onAsk} />
              ) : (
                <PostRow key={i} p={item as AskPost} onOpen={onOpenPost} />
              ),
            )}
          </Card>
        </section>
      ))}
    </div>
  );
}

/** A feature from the guide, with "Open" (plan step 1). */
function FeatureRow({ f }: { f: AskFeature }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-soft text-lg" aria-hidden>{f.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-navy">{f.name}</span>
        <span className="block text-[13px] leading-snug text-muted">{f.what}</span>
      </span>
      <Link href={f.href} className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-primary px-4 text-sm font-extrabold text-white">
        {t('ask.open')}
      </Link>
    </div>
  );
}

function PersonRow({ p }: { p: AskPerson }) {
  const { t } = useTranslation();
  return (
    <Link href={`/profile/${p.username}`} className="flex min-h-14 items-center gap-3 px-4 py-2.5 hover:bg-[#F6F8FB]">
      {p.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-full bg-green-soft font-heading font-extrabold text-brand-green-dark" aria-hidden>
          {(p.name || p.username).charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-[15px] font-bold text-navy">
          <span className="truncate">{p.name}</span>
          {p.isVerified ? <BadgeCheck size={15} className="shrink-0 fill-primary text-white" aria-label={t('ask.verified')} /> : null}
        </span>
        <span className="block truncate text-[13px] text-muted">@{p.username}{p.area ? ` · ${p.area}` : ''}</span>
      </span>
    </Link>
  );
}

function PlaceRow({ p, onAsk }: { p: AskPlace; onAsk: (q: string) => void }) {
  const { t } = useTranslation();
  return (
    <button type="button" onClick={() => onAsk(t('ask.placeQ', { place: p.lga }))} className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F6F8FB]">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-soft text-lg" aria-hidden>📍</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-navy">{p.lga}</span>
        <span className="block text-[13px] text-muted">{[p.state, t('ask.neighbours', { n: p.people.toLocaleString('en-NG') })].filter(Boolean).join(' · ')}</span>
      </span>
      <Sparkles size={15} className="shrink-0 text-brand-green-dark" aria-hidden />
    </button>
  );
}

function PostRow({ p, onOpen }: { p: AskPost; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const text = (p.title || p.content || '').trim();
  return (
    <button type="button" onClick={() => onOpen(p.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[#F6F8FB]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background text-lg" aria-hidden>{TYPE_ICON[p.contentType] ?? '✏️'}</span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-semibold text-navy">{text || t('ask.post')}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {[p.author?.name, p.area, timeAgo(p.createdAt)].filter(Boolean).join(' · ')}
        </span>
      </span>
      {p.media[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.media[0]} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
      ) : null}
    </button>
  );
}
