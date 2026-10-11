'use client';

/**
 * Sentinel — Ask Sentinel (SSAA) + safety + Explore (owner decision 2026-10-11, tracker F-14).
 *
 * One box for everything: "Ask Sentinel or search anything…".
 * - Names, words, #tags: results as you type (no AI)
 * - Questions and requests ("is light on?", "plumber near me"): press Enter, Sentinel answers
 *   about your area on top (mood, sources, follow-ups) with grouped results below
 * - Empty box: safety tools, questions to try, Explore tiles, trending and news
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
import { askSentinel, classifyQuery, GROUP_LABEL, type AskPerson, type AskPlace, type AskPost, type AskResult } from '@/lib/askSentinel';
import { searchService } from '@/services/search.service';
import { newsService } from '@/services/news.service';
import type { RssArticle } from '@/types/incident';
import { WhoIsInMyHuudDrawer } from '@/components/neighborhood/WhoIsInMyHuudDrawer';

const SAFETY_TOOLS = [
  { href: '/sos', icon: '🆘', label: 'SOS', strong: true },
  { href: '/safety/emergency', icon: '🚨', label: 'Report emergency' },
  { href: '/safety/trips', icon: '🚗', label: 'Safe trips' },
  { href: '/safety/kidnapping-tracking', icon: '📍', label: 'Live tracking' },
  { href: '/safety/manage#checkins', icon: '✅', label: 'Check-ins' },
  { href: '/safety/manage#guardians', icon: '👥', label: 'Guardians' },
  { href: '/safety/fake-call', icon: '📞', label: 'Fake call' },
  { href: '/safety/panic-pin', icon: '🔢', label: 'Panic PIN' },
];

const EXPLORE_TILES = [
  { href: '/map', icon: '🗺️', label: 'Map', sub: 'Pins, safe zones, places' },
  { href: '/marketplace', icon: '🛒', label: 'Market', sub: 'Buy and sell near you' },
  { href: '/services', icon: '🛠️', label: 'Artisans', sub: 'Plumbers, electricians…' },
  { href: '/events', icon: '🎉', label: 'Events', sub: 'Meetings, clean-ups, parties' },
  { href: '/jobs', icon: '💼', label: 'Jobs', sub: 'Work around you' },
  { href: '/fyi', icon: '📢', label: 'Bulletins', sub: 'Light, roads, notices' },
  { href: '/communities', icon: '🏘️', label: 'Estates', sub: 'Your estate and ward' },
  { href: '/local-news', icon: '📰', label: 'News', sub: 'Lagos and Nigeria' },
];

const TYPE_ICON: Record<string, string> = {
  emergency: '🚨', fyi: '📢', marketplace: '🛒', event: '🎉', services: '🛠️', job: '💼', help_request: '🙏', gossip: '💬', post: '✏️',
};

const MOOD = {
  safe: { label: 'All calm', tone: 'green' as const, icon: '🟢' },
  advisory: { label: 'Advisory', tone: 'amber' as const, icon: '🟡' },
  alert: { label: 'Alert', tone: 'red' as const, icon: '🔴' },
};

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function SentinelPage() {
  return (
    <Suspense>
      <SentinelScreen />
    </Suspense>
  );
}

function SentinelScreen() {
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
        const out = await askSentinel(text, withCoords);
        if (id === runId.current) setResult(out);
      } catch (e: any) {
        if (id === runId.current) setError(e?.response?.status === 429 ? 'You have asked a lot. Try again in a few minutes.' : 'Sentinel could not answer right now. Check your connection.');
      } finally {
        if (id === runId.current) setLoading(false);
      }
    },
    [coords],
  );

  // Open from the top-bar 🔍 or a #tag link: focus the box, run ?q= once.
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
    const t = setTimeout(() => void run(query), 350);
    return () => clearTimeout(t);
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
      setError('Turn on location for NeyborHuud in your phone settings, then try again.');
    }
  };

  const tryQuestions = useMemo(
    () => [
      area ? `Is light on for ${area}?` : 'Is light on for my area?',
      'Any go-slow near me?',
      'Plumber near me',
      'Is it safe to walk around now?',
    ],
    [area],
  );

  const hasQuery = query.trim().length > 0;

  return (
    <AppBrowseLayout
      className="!px-0 !pt-0"
      header={
        <div className="sticky top-0 z-30 bg-background/95 px-4 pb-3 pt-3 backdrop-blur">
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
              placeholder="Ask Sentinel or search anything…"
              aria-label="Ask Sentinel or search anything"
              enterKeyHint={mode === 'question' ? 'send' : 'search'}
              className="h-[52px] w-full rounded-full border border-line bg-white pl-11 pr-24 text-[15px] font-semibold text-navy shadow-[0_2px_10px_rgba(29,36,51,0.06)] outline-none placeholder:font-medium placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            {hasQuery ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear" className="absolute right-14 grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-background">
                <X size={17} />
              </button>
            ) : null}
            <button
              type="submit"
              aria-label={mode === 'question' ? 'Ask Sentinel' : 'Search'}
              disabled={!hasQuery || loading}
              className="absolute right-1.5 grid h-10 w-10 place-items-center rounded-full bg-primary text-white disabled:bg-line disabled:text-faint"
            >
              {loading ? <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden /> : mode === 'question' ? <ArrowUp size={19} strokeWidth={2.6} aria-hidden /> : <Search size={17} aria-hidden />}
            </button>
          </form>
          {hasQuery && mode === 'question' && !loading && (!result || result.query !== query.trim()) ? (
            <p className="mt-1.5 px-4 text-xs font-semibold text-muted">Press Enter and Sentinel go answer about your area.</p>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-4 px-4 pb-6">
        {error ? <Card className="border border-red-soft bg-red-soft/40 text-sm font-semibold text-[#C2353A]">{error}</Card> : null}

        {hasQuery && result ? (
          <Results result={result} onAsk={ask} onUseLocation={useMyLocation} onOpenPost={(id) => router.push(`/feed?postId=${id}`)} />
        ) : null}

        {hasQuery && !result && loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-muted" role="status">
            <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden /> {mode === 'question' ? 'Sentinel dey check your area…' : 'Searching…'}
          </div>
        ) : null}

        {!hasQuery ? (
          <>
            <Card>
              <p className="text-[11px] font-black uppercase tracking-wider text-faint">Your safety{area ? ` · ${area}` : ''}</p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {SAFETY_TOOLS.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center text-[11px] font-bold leading-tight ${
                      t.strong ? 'bg-brand-red text-white' : 'bg-background text-navy hover:bg-[#E6EAF0]'
                    }`}
                  >
                    <span className="text-xl" aria-hidden>{t.icon}</span>
                    {t.label}
                  </Link>
                ))}
              </div>
              <Link href="/safety/manage" className="mt-3 block text-center text-sm font-extrabold text-brand-green-dark hover:underline">
                All safety tools
              </Link>
            </Card>

            <section aria-labelledby="try-title">
              <p id="try-title" className="mb-2 px-1 text-[11px] font-black uppercase tracking-wider text-faint">Ask Sentinel</p>
              <div className="flex flex-wrap gap-2">
                {tryQuestions.map((q) => (
                  <button key={q} type="button" onClick={() => ask(q)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-bold text-navy hover:bg-[#F6F8FB]">
                    <Sparkles size={14} className="text-brand-green-dark" aria-hidden /> {q}
                  </button>
                ))}
                <button type="button" onClick={() => setWhoOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-bold text-navy hover:bg-[#F6F8FB]">
                  👥 Who is in my Huud?
                </button>
              </div>
            </section>

            <section aria-labelledby="explore-title">
              <p id="explore-title" className="mb-2 px-1 text-[11px] font-black uppercase tracking-wider text-faint">Explore</p>
              <div className="grid grid-cols-2 gap-2">
                {EXPLORE_TILES.map((t) => (
                  <Link key={t.href} href={t.href} className="flex min-h-[64px] items-center gap-3 rounded-[22px] bg-white px-3.5 py-3 shadow-[0_2px_10px_rgba(29,36,51,0.06)] hover:bg-[#F6F8FB]">
                    <span className="text-2xl" aria-hidden>{t.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-extrabold text-navy">{t.label}</span>
                      <span className="block truncate text-xs text-muted">{t.sub}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {trending.length ? (
              <section aria-labelledby="trend-title">
                <p id="trend-title" className="mb-2 px-1 text-[11px] font-black uppercase tracking-wider text-faint">Trending in your Huud</p>
                <div className="flex flex-wrap gap-2">
                  {trending.map((t) => (
                    <button key={t} type="button" onClick={() => setQuery(t.startsWith('#') ? t : t)} className="min-h-10 rounded-full bg-white px-3 text-sm font-bold text-navy shadow-[0_1px_3px_rgba(29,36,51,0.06)]">
                      {t}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {news.length ? (
              <section aria-labelledby="news-title" className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <p id="news-title" className="text-[11px] font-black uppercase tracking-wider text-faint">News</p>
                  <Link href="/local-news" className="text-sm font-extrabold text-brand-green-dark">All news</Link>
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
  const mood = result.answer ? MOOD[result.answer.sentiment] : null;
  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      {result.answer ? (
        <Card className="ring-1 ring-green-soft">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-green-soft text-brand-green-dark" aria-hidden>
              <Sparkles size={16} />
            </span>
            <p className="font-heading text-[15px] font-extrabold text-navy">Sentinel</p>
            {mood ? <Chip tone={mood.tone}>{mood.icon} {mood.label}</Chip> : null}
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
          <p className="mt-3 text-[11px] text-faint">Sentinel can make mistakes. In danger? Use SOS.</p>
        </Card>
      ) : null}

      {result.needsLocation ? (
        <Card>
          <p className="font-bold text-navy">Where you dey?</p>
          <p className="mt-1 text-sm text-muted">Turn on location (or set your area) so Sentinel can check around you, not somewhere else.</p>
          <Button className="mt-3" variant="soft" fullWidth onClick={onUseLocation}>
            <MapPin size={16} aria-hidden /> Use my location
          </Button>
        </Card>
      ) : null}

      {result.mode === 'search' && result.query ? (
        <button type="button" onClick={() => onAsk(`What's happening with ${result.query} around me?`)} className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-green-soft px-4 text-sm font-extrabold text-brand-green-dark">
          <Sparkles size={15} aria-hidden /> Ask Sentinel about &quot;{result.query}&quot;
        </button>
      ) : null}

      {result.total === 0 && !result.answer ? (
        <Card className="text-center">
          <p className="text-2xl" aria-hidden>🔎</p>
          <p className="mt-1 font-bold text-navy">Nothing found for &quot;{result.query}&quot;</p>
          <p className="mt-1 text-sm text-muted">Try another word, or ask Sentinel a question.</p>
        </Card>
      ) : null}

      {result.groups.map((g) => (
        <section key={g.key} aria-label={GROUP_LABEL[g.key]}>
          <p className="mb-2 px-1 text-[13px] font-extrabold text-navy">{GROUP_LABEL[g.key]}</p>
          <Card padding="none" className="divide-y divide-line">
            {g.items.map((item, i) =>
              g.key === 'people' ? (
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

function PersonRow({ p }: { p: AskPerson }) {
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
          {p.isVerified ? <BadgeCheck size={15} className="shrink-0 fill-primary text-white" aria-label="Verified" /> : null}
        </span>
        <span className="block truncate text-[13px] text-muted">@{p.username}{p.area ? ` · ${p.area}` : ''}</span>
      </span>
    </Link>
  );
}

function PlaceRow({ p, onAsk }: { p: AskPlace; onAsk: (q: string) => void }) {
  return (
    <button type="button" onClick={() => onAsk(`What's happening in ${p.lga}?`)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F6F8FB]">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-soft text-lg" aria-hidden>📍</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-navy">{p.lga}</span>
        <span className="block text-[13px] text-muted">{[p.state, `${p.people.toLocaleString('en-NG')} neighbours`].filter(Boolean).join(' · ')}</span>
      </span>
      <Sparkles size={15} className="shrink-0 text-brand-green-dark" aria-hidden />
    </button>
  );
}

function PostRow({ p, onOpen }: { p: AskPost; onOpen: (id: string) => void }) {
  const text = (p.title || p.content || '').trim();
  return (
    <button type="button" onClick={() => onOpen(p.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[#F6F8FB]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background text-lg" aria-hidden>{TYPE_ICON[p.contentType] ?? '✏️'}</span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-semibold text-navy">{text || 'Post'}</span>
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
