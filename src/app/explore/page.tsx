/**
 * Explore Page — X/Twitter-style full-screen search & discovery
 * Shows trending topics, browse-by-type, and search results
 */

'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSearch } from '@/hooks/useSearch';
import { UserSearchResult } from '@/components/search/UserSearchResult';
import { PostSearchResult } from '@/components/search/PostSearchResult';
import { LocationSearchResult } from '@/components/search/LocationSearchResult';
import { BottomNav } from '@/components/feed/BottomNav';
import { searchService } from '@/services/search.service';

// ── Explore Tabs ──────────────────────────────────────────────
const EXPLORE_TABS = [
  { id: 'trending', label: 'Trending' },
  { id: 'fyi', label: 'FYI Bulletins' },
  { id: 'gossip', label: 'Gossip' },
  { id: 'help_request', label: 'Help Requests' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'events', label: 'Events' },
  { id: 'marketplace', label: 'Marketplace' },
] as const;

type ExploreTab = typeof EXPLORE_TABS[number]['id'];

// ── News article type ─────────────────────────────────────────
interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string | null;
  source: string;
  publishedAt: string;
}

// ── Browse by Type grid ───────────────────────────────────────
const BROWSE_TYPES = [
  { icon: 'campaign', label: 'FYI Bulletins', type: 'fyi' },
  { icon: 'forum', label: 'Gossip', type: 'gossip' },
  { icon: 'help', label: 'Help Requests', type: 'help_request' },
  { icon: 'work', label: 'Jobs', type: 'job' },
  { icon: 'event', label: 'Events', type: 'event' },
  { icon: 'shopping_bag', label: 'Marketplace', type: 'marketplace' },
];

// ── Search result tabs ────────────────────────────────────────
const SEARCH_TABS = [
  { id: 'all', label: 'All' },
  { id: 'users', label: 'Users' },
  { id: 'posts', label: 'Posts' },
  { id: 'locations', label: 'Places' },
] as const;

export default function ExplorePage() {
  return (
    <Suspense>
      <ExplorePageInner />
    </Suspense>
  );
}

function ExplorePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const inputRef = useRef<HTMLInputElement>(null);

  // Search state
  const {
    query, setQuery, type, setType,
    results, loading, error, totalResults,
  } = useSearch(initialQuery);

  // Explore tab state (shown when not searching)
  const [activeTab, setActiveTab] = useState<ExploreTab>('trending');
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const isSearching = query.length > 0;

  // Auto-focus the input on mount
  useEffect(() => {
    // Small delay to ensure the page has rendered
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load trending topics
  useEffect(() => {
    const loadTrending = async () => {
      setTrendingLoading(true);
      try {
        const res = await searchService.getTrendingSearches(10);
        const data = (res as any)?.data || res;
        if (Array.isArray(data)) {
          setTrendingTopics(data);
        }
      } catch {
        // Fallback trending topics for the community
        setTrendingTopics([
          '#SafetyFirst', '#NeyborHuud', '#CommunityAlert',
          '#MarketDay', '#LocalJobs', '#StreetGist',
          '#Owambe', '#HelpNeeded', '#GoodNews', '#NaijaHuud',
        ]);
      } finally {
        setTrendingLoading(false);
      }
    };
    loadTrending();
  }, []);

  // Load Nigeria news from free RSS-to-JSON APIs
  useEffect(() => {
    const loadNews = async () => {
      setNewsLoading(true);
      try {
        // Use rss2json to fetch Nigeria news from Google News RSS
        const rssUrl = encodeURIComponent('https://news.google.com/rss/search?q=Nigeria&hl=en-NG&gl=NG&ceid=NG:en');
        const res = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&count=10`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ok' && data.items?.length) {
            setNewsArticles(
              data.items.map((a: any) => {
                // Extract image from enclosure or thumbnail
                const image = a.enclosure?.link || a.thumbnail || null;
                return {
                  title: a.title || '',
                  description: a.description?.replace(/<[^>]*>/g, '').slice(0, 150) || '',
                  url: a.link || '',
                  image,
                  source: a.author || 'Google News',
                  publishedAt: a.pubDate || '',
                };
              }),
            );
            return;
          }
        }
        // Fallback curated news
        setNewsArticles([
          { title: 'Nigeria Economy Shows Growth Signs in Q2', description: 'GDP growth accelerates as reforms take effect across key sectors.', url: '#', image: null, source: 'Business Day', publishedAt: new Date().toISOString() },
          { title: 'Lagos to Expand BRT Network by 2027', description: 'New routes will connect Alimosho, Ikorodu, and Epe to the central grid.', url: '#', image: null, source: 'The Guardian', publishedAt: new Date().toISOString() },
          { title: 'Super Eagles Qualify for AFCON Quarter-Finals', description: 'Nigeria advances after a dominant group stage performance.', url: '#', image: null, source: 'ESPN Africa', publishedAt: new Date().toISOString() },
          { title: 'CBN Holds Interest Rate Steady at 27.5%', description: 'Central bank maintains rate to curb inflation while supporting growth.', url: '#', image: null, source: 'Punch', publishedAt: new Date().toISOString() },
          { title: 'New Tech Hub Opens in Yaba', description: 'The innovation center aims to support 500 startups in its first year.', url: '#', image: null, source: 'TechCabal', publishedAt: new Date().toISOString() },
        ]);
      } catch {
        setNewsArticles([]);
      } finally {
        setNewsLoading(false);
      }
    };
    loadNews();
  }, []);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      setSearchHistory(history.slice(0, 5));
    } catch {
      setSearchHistory([]);
    }
  }, []);

  const saveSearchHistory = (q: string) => {
    if (!q) return;
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      const updated = [q, ...history.filter((h: string) => h !== q)].slice(0, 10);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      setSearchHistory(updated.slice(0, 5));
    } catch { /* ignore */ }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveSearchHistory(query.trim());
    }
  };

  const handleHistoryClick = (q: string) => {
    setQuery(q);
    saveSearchHistory(q);
  };

  const handleTrendingClick = (topic: string) => {
    const clean = topic.startsWith('#') ? topic.slice(1) : topic;
    setQuery(clean);
    saveSearchHistory(clean);
  };

  const handleBrowseType = (contentType: string) => {
    router.push(`/feed?type=${contentType}`);
  };

  const handleBack = () => {
    if (isSearching) {
      setQuery('');
    } else {
      router.back();
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('searchHistory');
    setSearchHistory([]);
  };

  const formatNewsTime = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, []);

  return (
    <div className="flex flex-col h-screen neu-base">
      {/* ── Top Bar: Back + Search Input ── */}
      <div className="sticky top-0 z-50 neu-base" style={{ boxShadow: '0 2px 8px var(--neu-shadow-dark)' }}>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full transition-all active:scale-95"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--neu-text)' }}>arrow_back</span>
          </button>

          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none" style={{ color: 'var(--neu-text-muted)' }}>search</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search NeyborHuud"
              className="w-full pl-10 pr-10 py-2.5 rounded-full neu-inset text-sm outline-none transition-all placeholder:opacity-60"
              style={{ color: 'var(--neu-text)', background: 'transparent' }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center neu-btn transition-all"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-sm" style={{ color: 'var(--neu-text-muted)' }}>close</span>
              </button>
            )}
          </div>
        </form>

        {/* ── Tab Bar ── */}
        {!isSearching ? (
          <div className="relative">
            <div className="flex overflow-x-auto no-scrollbar border-b cursor-grab active:cursor-grabbing" style={{ borderColor: 'var(--neu-shadow-dark)', WebkitOverflowScrolling: 'touch' }}>
              {EXPLORE_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex-shrink-0 px-3 py-3 text-[13px] font-medium transition-colors whitespace-nowrap select-none ${
                      isActive ? 'font-bold' : 'hover:opacity-80'
                    }`}
                    style={{ color: isActive ? 'var(--neu-text)' : 'var(--neu-text-muted)' }}
                  >
                    {tab.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
            {/* Fade hint — signals more tabs offscreen */}
            <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, var(--neu-bg))' }} />
          </div>
        ) : (
          <div className="relative">
            <div className="flex overflow-x-auto no-scrollbar border-b cursor-grab active:cursor-grabbing" style={{ borderColor: 'var(--neu-shadow-dark)', WebkitOverflowScrolling: 'touch' }}>
              {SEARCH_TABS.map((tab) => {
                const count =
                  tab.id === 'all'
                    ? totalResults
                    : results?.[tab.id as keyof typeof results]?.total || 0;
                const isActive = type === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setType(tab.id as any)}
                    className={`relative flex-shrink-0 px-3 py-3 text-[13px] font-medium transition-colors whitespace-nowrap select-none ${
                      isActive ? 'font-bold' : 'hover:opacity-80'
                    }`}
                    style={{ color: isActive ? 'var(--neu-text)' : 'var(--neu-text-muted)' }}
                  >
                    {tab.label}{count > 0 ? ` (${count})` : ''}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, var(--neu-bg))' }} />
          </div>
        )}
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isSearching ? (
          /* ═══ Search Results ═══ */
          <div className="max-w-[680px] mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Searching…</span>
              </div>
            ) : error ? (
              <div className="text-center py-16 px-4">
                <p className="text-sm font-medium text-brand-red">{error}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>Please try again</p>
              </div>
            ) : totalResults === 0 ? (
              <div className="text-center py-16 px-4">
                <span className="material-symbols-outlined text-5xl mb-3 block" style={{ color: 'var(--neu-text-muted)' }}>search_off</span>
                <p className="text-base font-medium" style={{ color: 'var(--neu-text)' }}>No results for &ldquo;{query}&rdquo;</p>
                <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>Try searching for something else</p>
              </div>
            ) : (
              <div>
                {/* Users */}
                {(type === 'all' || type === 'users') &&
                  results?.users?.data &&
                  results.users.data.length > 0 && (
                  <div className="px-4 py-3">
                    {type === 'all' && (
                      <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                        Users
                      </h3>
                    )}
                    <div className="space-y-1">
                      {results.users.data
                        .filter(u => u && u._id && u.username)
                        .map((u) => (
                          <UserSearchResult key={u._id} user={u} onClose={() => saveSearchHistory(query)} />
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Posts */}
                {(type === 'all' || type === 'posts') &&
                  results?.posts?.data &&
                  results.posts.data.length > 0 && (
                  <div className="px-4 py-3">
                    {type === 'all' && (
                      <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                        Posts
                      </h3>
                    )}
                    <div className="space-y-2">
                      {results.posts.data
                        .filter(p => p && p.id)
                        .map((p) => (
                          <PostSearchResult key={p.id} post={p} onClose={() => saveSearchHistory(query)} />
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Locations */}
                {(type === 'all' || type === 'locations') &&
                  results?.locations?.data &&
                  results.locations.data.length > 0 && (
                  <div className="px-4 py-3">
                    {type === 'all' && (
                      <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                        Places
                      </h3>
                    )}
                    <div className="space-y-1">
                      {results.locations.data
                        .filter(l => l && l.city && l.state)
                        .map((l, i) => (
                          <LocationSearchResult key={`${l.city}-${l.state}-${i}`} location={l} onClose={() => saveSearchHistory(query)} />
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ═══ Explore Content (no search query) ═══ */
          <div className="max-w-[680px] mx-auto">
            {/* Browse by Type — always at top */}
            <div className="px-4 pt-4 pb-2">
              <div className="grid grid-cols-2 gap-2.5">
                {BROWSE_TYPES.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handleBrowseType(item.type)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl neu-btn transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
                  >
                    <span className="material-symbols-outlined text-xl text-primary">{item.icon}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="neu-divider mx-4 my-2" />

            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="px-4 pt-2 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Recent</h3>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-0.5">
                  {searchHistory.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => handleHistoryClick(h)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:opacity-80"
                    >
                      <span className="material-symbols-outlined text-lg" style={{ color: 'var(--neu-text-muted)' }}>history</span>
                      <span className="text-sm flex-1 text-left truncate" style={{ color: 'var(--neu-text)' }}>{h}</span>
                      <span className="material-symbols-outlined text-lg" style={{ color: 'var(--neu-text-muted)' }}>north_west</span>
                    </button>
                  ))}
                </div>
                <div className="neu-divider mt-2" />
              </div>
            )}

            {/* ══ Trending Tab Content: Mixed trends + news ══ */}
            {activeTab === 'trending' && (
              <div className="px-4 pt-3 pb-6">
                {(trendingLoading && newsLoading) ? (
                  <div className="space-y-4">
                    {/* Hero skeleton */}
                    <div className="animate-pulse rounded-2xl overflow-hidden" style={{ background: 'var(--neu-shadow-dark)' }}>
                      <div className="h-48 w-full" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 rounded-full w-20" style={{ background: 'var(--neu-shadow-light)' }} />
                        <div className="h-5 rounded-full w-3/4" style={{ background: 'var(--neu-shadow-light)' }} />
                        <div className="h-3 rounded-full w-1/2" style={{ background: 'var(--neu-shadow-light)' }} />
                      </div>
                    </div>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="h-3 rounded-full w-24" style={{ background: 'var(--neu-shadow-dark)' }} />
                          <div className="h-4 rounded-full w-48" style={{ background: 'var(--neu-shadow-dark)' }} />
                          <div className="h-3 rounded-full w-20" style={{ background: 'var(--neu-shadow-dark)' }} />
                        </div>
                        <div className="w-20 h-16 rounded-xl" style={{ background: 'var(--neu-shadow-dark)' }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* ── Hero News Card (first article) ── */}
                    {newsArticles[0] && (
                      <a
                        href={newsArticles[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-2xl overflow-hidden neu-card-sm mb-4 transition-transform active:scale-[0.98]"
                      >
                        {newsArticles[0].image ? (
                          <div className="relative w-full h-48 bg-black/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={newsArticles[0].image}
                              alt={newsArticles[0].title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="px-2 py-0.5 rounded-full bg-red-500/90 text-white text-[10px] font-bold uppercase">Live</span>
                                <span className="text-[11px] text-white/80">{newsArticles[0].source}</span>
                              </div>
                              <h3 className="text-base font-bold text-white leading-snug line-clamp-2">{newsArticles[0].title}</h3>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-gradient-to-r from-primary/10 to-brand-blue/10">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="px-2 py-0.5 rounded-full bg-red-500/90 text-white text-[10px] font-bold uppercase">News</span>
                              <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{newsArticles[0].source}</span>
                            </div>
                            <h3 className="text-base font-bold leading-snug line-clamp-2" style={{ color: 'var(--neu-text)' }}>{newsArticles[0].title}</h3>
                            {newsArticles[0].description && (
                              <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--neu-text-muted)' }}>{newsArticles[0].description}</p>
                            )}
                          </div>
                        )}
                      </a>
                    )}

                    {/* ── Interleaved: Trending topics + News articles ── */}
                    {(() => {
                      const items: Array<{ type: 'trend'; data: string; index: number } | { type: 'news'; data: NewsArticle }> = [];
                      const remainingNews = newsArticles.slice(1);
                      let newsIdx = 0;

                      trendingTopics.forEach((topic, i) => {
                        items.push({ type: 'trend', data: topic, index: i });
                        // Insert a news card after every 2 trending topics
                        if ((i + 1) % 2 === 0 && newsIdx < remainingNews.length) {
                          items.push({ type: 'news', data: remainingNews[newsIdx] });
                          newsIdx++;
                        }
                      });
                      // Add any remaining news
                      while (newsIdx < remainingNews.length) {
                        items.push({ type: 'news', data: remainingNews[newsIdx] });
                        newsIdx++;
                      }

                      return items.map((item, idx) => {
                        if (item.type === 'trend') {
                          return (
                            <button
                              key={`trend-${idx}`}
                              onClick={() => handleTrendingClick(item.data)}
                              className="w-full text-left py-3.5 transition-all hover:opacity-80 border-b flex items-center justify-between group"
                              style={{ borderColor: 'var(--neu-shadow-dark)' }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium" style={{ color: 'var(--neu-text-muted)' }}>
                                  {item.index + 1} · Trending in Nigeria
                                </p>
                                <p className="text-[15px] font-bold mt-0.5 truncate" style={{ color: 'var(--neu-text)' }}>
                                  {item.data}
                                </p>
                                <p className="text-[11px] mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                                  Community · Trending
                                </p>
                              </div>
                              <span className="material-symbols-outlined text-lg opacity-0 group-hover:opacity-60 transition-opacity shrink-0 ml-3" style={{ color: 'var(--neu-text-muted)' }}>
                                north_east
                              </span>
                            </button>
                          );
                        } else {
                          const article = item.data;
                          return (
                            <a
                              key={`news-${idx}`}
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex gap-3 py-3.5 border-b transition-all hover:opacity-80 group"
                              style={{ borderColor: 'var(--neu-shadow-dark)' }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[10px] text-primary">newspaper</span>
                                  </span>
                                  <span className="text-[11px] font-medium" style={{ color: 'var(--neu-text-muted)' }}>{article.source}</span>
                                  <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>· {formatNewsTime(article.publishedAt)}</span>
                                </div>
                                <p className="text-[14px] font-semibold leading-snug line-clamp-2" style={{ color: 'var(--neu-text)' }}>
                                  {article.title}
                                </p>
                                {article.description && (
                                  <p className="text-[12px] mt-0.5 line-clamp-1" style={{ color: 'var(--neu-text-muted)' }}>
                                    {article.description}
                                  </p>
                                )}
                              </div>
                              {article.image && (
                                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-black/10">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={article.image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </a>
                          );
                        }
                      });
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ══ Other Tabs Placeholder ══ */}
            {activeTab !== 'trending' && (
              <div className="px-4 pt-3 pb-6">
                <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--neu-text)' }}>
                  {activeTab === 'fyi' ? 'FYI Bulletins' :
                   activeTab === 'gossip' ? 'Latest Gossip' :
                   activeTab === 'help_request' ? 'Help Requests' :
                   activeTab === 'jobs' ? 'Job Listings' :
                   activeTab === 'events' ? 'Upcoming Events' :
                   'Marketplace'}
                </h2>
                <div className="flex flex-col items-center py-10 gap-3">
                  <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--neu-text-muted)' }}>
                    {activeTab === 'fyi' ? 'campaign' :
                     activeTab === 'gossip' ? 'forum' :
                     activeTab === 'help_request' ? 'help' :
                     activeTab === 'jobs' ? 'work' :
                     activeTab === 'events' ? 'event' :
                     'shopping_bag'}
                  </span>
                  <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
                    Browse {activeTab === 'fyi' ? 'bulletins' : activeTab === 'help_request' ? 'requests' : activeTab.replace('_', ' ')} in the feed
                  </p>
                  <button
                    onClick={() => handleBrowseType(activeTab === 'jobs' ? 'job' : activeTab)}
                    className="px-4 py-2 rounded-full text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
