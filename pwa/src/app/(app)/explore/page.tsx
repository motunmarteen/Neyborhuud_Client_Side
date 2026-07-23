'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useSearch } from '@/hooks/useSearch';
import { UserSearchResult } from '@/components/search/UserSearchResult';
import { PostSearchResult } from '@/components/search/PostSearchResult';
import { LocationSearchResult } from '@/components/search/LocationSearchResult';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { searchService } from '@/services/search.service';
import { newsService } from '@/services/news.service';
import type { RssArticle } from '@/types/incident';

// ── Sentinel Design Standard Shortcuts ─────────────────────────
const EXPLORE_CATEGORIES = [
  { id: 'emergency', label: 'Safety Watch', icon: 'shield', color: 'bg-brand-red', text: 'text-brand-red', bgSoft: 'bg-brand-red/10' },
  { id: 'marketplace', label: 'Marketplace', icon: 'storefront', color: 'bg-green-600', text: 'text-green-600', bgSoft: 'bg-green-600/10' },
  { id: 'services', label: 'Local Services', icon: 'handyman', color: 'bg-blue-600', text: 'text-blue-600', bgSoft: 'bg-blue-600/10' },
  { id: 'event', label: 'Events', icon: 'event', color: 'bg-purple-600', text: 'text-purple-600', bgSoft: 'bg-purple-600/10' },
  { id: 'job', label: 'Jobs', icon: 'work', color: 'bg-orange-600', text: 'text-orange-600', bgSoft: 'bg-orange-600/10' },
  { id: 'fyi', label: 'FYI', icon: 'campaign', color: 'bg-slate-700', text: 'text-slate-700', bgSoft: 'bg-slate-700/10' },
  { id: 'help_request', label: 'Requests', icon: 'volunteer_activism', color: 'bg-teal-600', text: 'text-teal-600', bgSoft: 'bg-teal-600/10' },
];

// ── Search result tabs ────────────────────────────────────────
const SEARCH_TABS = [
  { id: 'all', label: 'All' },
  { id: 'users', label: 'Users' },
  { id: 'posts', label: 'Posts' },
  { id: 'locations', label: 'Places' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'event', label: 'Events' },
  { id: 'job', label: 'Jobs' },
  { id: 'fyi', label: 'FYI' },
  { id: 'help_request', label: 'Requests' },
  { id: 'services', label: 'Services' },
  { id: 'emergency', label: 'Safety Watch' },
] as const;

const SEARCH_TAB_ACCENTS: Record<string, string> = {
  all: 'bg-slate-900 shadow-[0_1px_6px_rgba(15,23,42,0.25)]',
  users: 'bg-blue-600 shadow-[0_1px_6px_rgba(37,99,235,0.25)]',
  posts: 'bg-slate-900 shadow-[0_1px_6px_rgba(15,23,42,0.25)]',
  locations: 'bg-emerald-600 shadow-[0_1px_6px_rgba(5,150,105,0.25)]',
  marketplace: 'bg-emerald-600 shadow-[0_1px_6px_rgba(5,150,105,0.25)]',
  event: 'bg-purple-600 shadow-[0_1px_6px_rgba(147,51,234,0.25)]',
  job: 'bg-orange-600 shadow-[0_1px_6px_rgba(249,115,22,0.25)]',
  fyi: 'bg-slate-700 shadow-[0_1px_6px_rgba(71,85,105,0.25)]',
  help_request: 'bg-teal-650 shadow-[0_1px_6px_rgba(13,148,136,0.25)]',
  services: 'bg-blue-600 shadow-[0_1px_6px_rgba(37,99,235,0.25)]',
  emergency: 'bg-brand-red shadow-[0_1px_6px_rgba(220,38,38,0.25)]',
};

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string | null;
  source: string;
  publishedAt: string;
}

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

  // Search state - we keep useSearch type as 'all' and filter locally
  const {
    query, setQuery,
    results, loading: searchLoading, error: searchError, totalResults,
  } = useSearch(initialQuery);

  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Explore state
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const isSearching = query.length > 0;

  // Load trending topics
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const res = await searchService.getTrendingSearches(10);
        const data = (res as any)?.data || res;
        if (Array.isArray(data)) {
          setTrendingTopics(data);
        }
      } catch {
        setTrendingTopics([
          '#SafetyFirst', '#LocalJobs', '#MarketDay', '#CommunityAlert',
          '#HelpNeeded', '#NaijaHuud',
        ]);
      }
    };
    loadTrending();
  }, []);

  // Load Nigeria news
  useEffect(() => {
    const loadNews = async () => {
      try {
        const articles = await newsService.getArticles({ region: 'nigeria', limit: 5 });
        setNewsArticles(
          articles.map((a: RssArticle) => ({
            title: a.title || '',
            description: a.description?.replace(/<[^>]*>/g, '').slice(0, 150) || '',
            url: a.link || '#',
            image: a.imageUrl || null,
            source: a.sourceName || a.source || 'News',
            publishedAt: a.pubDate || new Date().toISOString(),
          }))
        );
      } catch {
        setNewsArticles([]);
      }
    };
    loadNews();
  }, []);

  // Load search history
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

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/feed?type=${categoryId}`);
  };

  const clearHistory = () => {
    localStorage.removeItem('searchHistory');
    setSearchHistory([]);
  };

  return (
    <AppBrowseLayout
      className="!bg-white !px-0 !pt-0 !min-h-[100dvh]"
      header={
        <div className="sticky top-0 z-50 bg-white">
          <div className="relative bg-white py-3 flex flex-col gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center mx-auto w-[calc(100%-1.5rem)] max-w-[600px] h-[3.2rem]">
              <span className="material-symbols-outlined absolute left-5 text-gray-400 text-[22px]" style={{ fontVariationSettings: "'wght' 300" }}>search</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search NeyborHuud..."
                className="w-full h-full pl-[52px] pr-12 bg-[#F4F5F6] rounded-full text-[15px] font-medium text-gray-900 outline-none transition-all focus:bg-[#EDEDEE] placeholder:text-gray-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">cancel</span>
                </button>
              )}
            </form>

            {/* Search Tabs when actively searching */}
            {isSearching && (
              <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px]">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-3">
                  {SEARCH_TABS.map((t) => {
                    let count = 0;
                    if (t.id === 'all') count = totalResults;
                    else if (t.id === 'users') count = results?.users?.total || 0;
                    else if (t.id === 'locations') count = results?.locations?.total || 0;
                    else if (t.id === 'posts') {
                      count = results?.posts?.data?.filter((p: any) => !p.contentType || p.contentType === 'post' || p.contentType === 'gossip').length || 0;
                    } else {
                      count = results?.posts?.data?.filter((p: any) => p.contentType === t.id).length || 0;
                    }

                    const isActive = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                          isActive ? 'bg-slate-900 text-white shadow-[0_2px_8px_rgba(15,23,42,0.15)]' : 'bg-[#F4F5F6] text-gray-500 hover:bg-[#EDEDEE]'
                        }`}
                      >
                        {t.label} {count > 0 && <span className="opacity-70 font-medium ml-1">({count})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Dynamic Accent Line */}
            <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] transition-all duration-300 ${isSearching ? (SEARCH_TAB_ACCENTS[activeTab] ?? 'bg-slate-900') : 'bg-gray-100'}`} />
          </div>
        </div>
      }
    >
      <div className="flex-1 bg-white pb-24">
        {isSearching ? (
          /* ═══ Search Results ═══ */
          <div className="w-full">
            {searchLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm font-medium text-gray-500">Searching...</span>
              </div>
            ) : searchError ? (
              <div className="px-4 py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-brand-red mb-2">error</span>
                <p className="text-sm font-medium text-brand-red">{searchError}</p>
              </div>
            ) : totalResults === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-[15px] text-gray-800">Your search - <span className="font-bold">{query}</span> - did not match any documents.</p>
                <p className="text-[14px] text-gray-500 mt-3">Suggestions:</p>
                <ul className="text-[14px] text-gray-500 mt-1 list-disc list-inside">
                  <li>Make sure all words are spelled correctly.</li>
                  <li>Try different keywords.</li>
                  <li>Try more general keywords.</li>
                </ul>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Users Section */}
                {(activeTab === 'all' || activeTab === 'users') && results?.users?.data && results.users.data.length > 0 && (
                  <div className="px-4 py-5 border-b border-gray-100 bg-white">
                    <h3 className="text-[16px] font-bold text-gray-900 mb-3 ml-1">People</h3>
                    <div className="space-y-4">
                      {results.users.data.map((u) => (
                        <UserSearchResult key={(u as any).id || (u as any)._id} user={u} onClose={() => saveSearchHistory(query)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Locations Section */}
                {(activeTab === 'all' || activeTab === 'locations') && results?.locations?.data && results.locations.data.length > 0 && (
                  <div className="px-4 py-5 border-b border-gray-100 bg-white">
                    <h3 className="text-[16px] font-bold text-gray-900 mb-3 ml-1">Places</h3>
                    <div className="space-y-4">
                      {results.locations.data.map((l, i) => (
                        <LocationSearchResult key={`${l.city}-${l.state}-${i}`} location={l} onClose={() => saveSearchHistory(query)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts Section */}
                {(activeTab !== 'users' && activeTab !== 'locations') && results?.posts?.data && results.posts.data.length > 0 && (
                  <div className="px-4 py-5">
                    <h3 className="text-[16px] font-bold text-gray-900 mb-4 ml-1">
                      {activeTab === 'all' ? 'Content & Updates' : SEARCH_TABS.find(t => t.id === activeTab)?.label || 'Content'}
                    </h3>
                    <div className="space-y-6">
                      {results.posts.data
                        .filter((p: any) => {
                          if (activeTab === 'all') return true;
                          if (activeTab === 'posts') return !p.contentType || p.contentType === 'post' || p.contentType === 'gossip';
                          return p.contentType === activeTab;
                        })
                        .map((p) => (
                        <PostSearchResult key={p.id} post={p} onClose={() => saveSearchHistory(query)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ═══ Explore Dashboard (Clean state) ═══ */
          <div className="w-full pt-4 space-y-6">

            {/* Trending Topics - Google Mobile Style */}
            {trendingTopics.length > 0 && (
              <section className="px-4 border-b border-gray-100 pb-4">
                <h3 className="text-[16px] font-normal text-gray-800 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-gray-600" style={{ fontVariationSettings: "'wght' 300" }}>trending_up</span>
                  Trending searches
                </h3>
                <div className="flex flex-col">
                  {trendingTopics.map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTrendingClick(topic)}
                      className="w-full py-3 flex items-center gap-4 bg-transparent hover:bg-gray-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-gray-400" style={{ fontVariationSettings: "'wght' 300" }}>search</span>
                      <span className="text-[15px] font-normal text-gray-700">{topic}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Recent History - Google Mobile Style */}
            {searchHistory.length > 0 && (
              <section className="px-4 pb-4">
                <div className="flex flex-col">
                  {searchHistory.map((h, i) => (
                    <div key={i} className="flex items-center w-full hover:bg-gray-50 transition-colors">
                      <button
                        onClick={() => handleHistoryClick(h)}
                        className="flex-1 py-3 flex items-center gap-4 bg-transparent"
                      >
                        <span className="material-symbols-outlined text-[18px] text-gray-400" style={{ fontVariationSettings: "'wght' 300" }}>history</span>
                        <span className="text-[15px] font-normal text-[#1a0dab]">{h}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* News Hero - Edge to Edge */}
            {newsArticles.length > 0 && (
              <section className="border-t border-gray-100">
                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-[18px] font-normal text-gray-800">Discover</h3>
                </div>
                <a
                  href={newsArticles[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative w-full h-[320px] overflow-hidden bg-black"
                >
                  {newsArticles[0].image && (
                    <Image src={newsArticles[0].image} alt={newsArticles[0].title} fill sizes="100vw" className="object-cover opacity-80" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium text-white bg-white/20 backdrop-blur-md mb-2">{newsArticles[0].source}</span>
                    <h3 className="text-[22px] font-normal text-white leading-tight drop-shadow-md">{newsArticles[0].title}</h3>
                  </div>
                </a>
              </section>
            )}

          </div>
        )}
      </div>
    </AppBrowseLayout>
  );
}
