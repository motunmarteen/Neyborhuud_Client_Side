/**
 * Local News Page
 * Displays real RSS news from Nigeria and international sources
 * fetched via the backend proxy at /api/v1/news
 */

'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';

import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { newsService } from '@/services/news.service';
import type { NewsSource, RssArticle } from '@/types/incident';

// ── Source groupings from backend ─────────────────────────────────────────────

const NIGERIA_SOURCES: NewsSource[] = [
  { id: 'punch',        name: 'Punch' },
  { id: 'vanguard',     name: 'Vanguard' },
  { id: 'channels',     name: 'Channels TV' },
  { id: 'thisday',      name: 'ThisDay' },
  { id: 'guardian_ng',  name: 'Guardian NG' },
  { id: 'premiumtimes', name: 'Premium Times' },
  { id: 'dailytrust',   name: 'Daily Trust' },
  { id: 'tribune',      name: 'Tribune' },
  { id: 'sun',          name: 'The Sun' },
];

const INTERNATIONAL_SOURCES: NewsSource[] = [
  { id: 'bbc_world',  name: 'BBC World' },
  { id: 'bbc_africa', name: 'BBC Africa' },
  { id: 'aljazeera',  name: 'Al Jazeera' },
  { id: 'skynews',    name: 'Sky News' },
  { id: 'nytimes',    name: 'NY Times World' },
  { id: 'cnn',        name: 'CNN' },
];

// ── Article Card ──────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: RssArticle }) {
  const date = article.pubDate
    ? new Date(article.pubDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="neu-card rounded-2xl overflow-hidden flex gap-0 transition-all active:scale-[0.99] hover:shadow-md block"
    >
      {/* Image */}
      {article.imageUrl && (
        <div className="relative flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32">
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full neu-socket" style={{ color: 'var(--neu-text-muted)' }}>
            {article.sourceName}
          </span>
          {date && (
            <span className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>{date}</span>
          )}
        </div>
        <h3 className="font-semibold text-sm leading-snug line-clamp-3" style={{ color: 'var(--neu-text)' }}>
          {article.title}
        </h3>
        {article.description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--neu-text-muted)' }}>
            {article.description}
          </p>
        )}
        <div className="flex items-center gap-1 mt-auto pt-1">
          <span className="text-[10px] font-semibold text-primary">Read more</span>
          <span className="material-symbols-outlined text-xs text-primary">open_in_new</span>
        </div>
      </div>
    </a>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'nigeria' | 'international';

function LocalNewsInner() {
  const [activeTab, setActiveTab] = useState<Tab>('nigeria');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sources = activeTab === 'nigeria' ? NIGERIA_SOURCES : INTERNATIONAL_SOURCES;

  const loadNews = useCallback(async (tab: Tab, sourceIds: string[]) => {
    setLoading(true);
    setError(null);
    const sourcesToFetch: NewsSource[] = (tab === 'nigeria' ? NIGERIA_SOURCES : INTERNATIONAL_SOURCES)
      .filter(s => sourceIds.length === 0 || sourceIds.includes(s.id));

    try {
      const results = await newsService.getMultipleFeeds(sourcesToFetch, 10);
      setArticles(results);
    } catch {
      setError('Failed to load news. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadNews(activeTab, selectedSourceIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedSourceIds([]);
    loadNews(tab, []);
  };

  const toggleSource = (sourceId: string) => {
    const next = selectedSourceIds.includes(sourceId)
      ? selectedSourceIds.filter(id => id !== sourceId)
      : [...selectedSourceIds, sourceId];
    setSelectedSourceIds(next);
    loadNews(activeTab, next);
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />

      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-64" />}><LeftSidebar /></Suspense>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[680px] mx-auto flex flex-col pb-20">

            {/* Page Header */}
            <div className="px-4 pt-6 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-xl text-primary">newspaper</span>
                <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>Local News</h1>
              </div>
              <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
                Latest news from Nigeria and around the world
              </p>
            </div>

            {/* Nigeria / International tabs */}
            <div className="flex gap-1 px-4 mb-3">
              {(['nigeria', 'international'] as Tab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab ? 'neu-btn-active text-primary' : 'neu-btn'
                  }`}
                  style={activeTab !== tab ? { color: 'var(--neu-text-muted)' } : {}}
                >
                  {tab === 'nigeria' ? '🇳🇬 Nigeria' : '🌍 International'}
                </button>
              ))}
            </div>

            {/* Source filter chips */}
            <div className="flex gap-2 px-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => { setSelectedSourceIds([]); loadNews(activeTab, []); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedSourceIds.length === 0 ? 'neu-btn-active text-primary' : 'neu-socket'
                }`}
                style={selectedSourceIds.length !== 0 ? { color: 'var(--neu-text-muted)' } : {}}
              >
                All Sources
              </button>
              {sources.map(src => (
                <button
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedSourceIds.includes(src.id) ? 'neu-btn-active text-primary' : 'neu-socket'
                  }`}
                  style={!selectedSourceIds.includes(src.id) ? { color: 'var(--neu-text-muted)' } : {}}
                >
                  {src.name}
                </button>
              ))}
            </div>

            {/* Refresh button */}
            <div className="flex justify-end px-4 mt-1 mb-3">
              <button
                onClick={() => loadNews(activeTab, selectedSourceIds)}
                disabled={loading}
                className="flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Content */}
            <div className="px-4 flex flex-col gap-4">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm mt-4" style={{ color: 'var(--neu-text-muted)' }}>Fetching latest news...</p>
                </div>
              )}

              {!loading && error && (
                <div className="neu-card-sm rounded-2xl flex flex-col items-center justify-center py-12 px-5">
                  <span className="material-symbols-outlined text-3xl text-red-400 mb-3">wifi_off</span>
                  <p className="text-sm text-center mb-4" style={{ color: 'var(--neu-text)' }}>{error}</p>
                  <button
                    onClick={() => loadNews(activeTab, selectedSourceIds)}
                    className="px-6 py-2.5 neu-btn rounded-2xl text-sm font-bold text-primary"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && articles.length === 0 && (
                <div className="neu-card-sm rounded-2xl flex flex-col items-center justify-center py-12 px-5">
                  <span className="material-symbols-outlined text-3xl opacity-40 mb-3" style={{ color: 'var(--neu-text-muted)' }}>
                    newspaper
                  </span>
                  <p className="text-sm text-center" style={{ color: 'var(--neu-text)' }}>No articles found</p>
                  <p className="text-xs text-center mt-2" style={{ color: 'var(--neu-text-muted)' }}>
                    Try selecting different sources or refresh.
                  </p>
                </div>
              )}

              {!loading && articles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </main>

        <RightSidebar />
      </div>

      <div className="md:hidden">
        <Suspense fallback={<div className="h-16" />}><BottomNav /></Suspense>
      </div>
    </div>
  );
}

export default function LocalNewsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen neu-base flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LocalNewsInner />
    </Suspense>
  );
}
