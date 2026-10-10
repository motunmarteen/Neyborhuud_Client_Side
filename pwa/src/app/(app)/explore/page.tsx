'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  X,
  Radar,
  ShieldCheck,
  ShoppingBag,
  Wrench,
  Calendar,
  Users,
  Megaphone,
  Map as MapIcon,
  MessageSquare,
  TrendingUp,
  Clock,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { UserSearchResult } from '@/components/search/UserSearchResult';
import { PostSearchResult } from '@/components/search/PostSearchResult';
import { LocationSearchResult } from '@/components/search/LocationSearchResult';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { searchService } from '@/services/search.service';
import { DEMO_MODE } from '@/lib/demoMode';

const DEMO_TRENDING = [
  '#LekkiLight', '#AdmiraltyTraffic', '#PlumberNearMe', '#GeneratorForSale',
  '#SecurityPatrol', '#CleanUpSaturday',
];
import { newsService } from '@/services/news.service';
import { WhoIsInMyHuudDrawer } from '@/components/neighborhood/WhoIsInMyHuudDrawer';
import { AskMyHuudDrawer } from '@/components/assistant/AskMyHuudDrawer';
import type { RssArticle } from '@/types/incident';

// ── BC.Game 3-Column / 2-Column Discovery Game Cards ────────────────────────
const DISCOVERY_HUBS = [
  {
    id: 'radar',
    title: 'Street Radar',
    badge: 'Live 2km',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200/80',
    description: 'Real-time power, transit slowdowns & street patrol signals.',
    icon: Radar,
    iconColor: 'text-[#00B82E]',
    bgColor: 'bg-emerald-50/70',
    borderColor: 'border-emerald-200/70',
    href: '/feed',
  },
  {
    id: 'map',
    title: 'Discovery Map',
    badge: 'Vector Radar',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200/80',
    description: 'Pulsing neighborhood pins, safety zones & verified places.',
    icon: MapIcon,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50/70',
    borderColor: 'border-blue-200/70',
    href: '/map',
  },
  {
    id: 'marketplace',
    title: 'Huud Market',
    badge: 'Zero-Escrow',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200/80',
    description: 'Face-to-face handshake deals & nearby resident bargains.',
    icon: ShoppingBag,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50/70',
    borderColor: 'border-amber-200/70',
    href: '/marketplace',
  },
  {
    id: 'services',
    title: 'Verified Artisans',
    badge: 'TrustOS Vouched',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200/80',
    description: 'Background-checked estate plumbers, electricians & auto technicians.',
    icon: Wrench,
    iconColor: 'text-teal-600',
    bgColor: 'bg-teal-50/70',
    borderColor: 'border-teal-200/70',
    href: '/services',
  },
  {
    id: 'events',
    title: 'Events & Watch',
    badge: 'Local Hub',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200/80',
    description: 'Community clean-ups, HOA meetings & sports watch-parties.',
    icon: Calendar,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50/70',
    borderColor: 'border-purple-200/70',
    href: '/events',
  },
  {
    id: 'communities',
    title: 'Estate Hubs',
    badge: 'Wards & Gates',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200/80',
    description: 'Official estate gates, HOA guidelines & verified resident rosters.',
    icon: Users,
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50/70',
    borderColor: 'border-indigo-200/70',
    href: '/communities',
  },
  {
    id: 'fyi',
    title: 'Official Bulletins',
    badge: 'High Priority',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200/80',
    description: 'DisCo power schedules, fumigation notices & road repairs.',
    icon: Megaphone,
    iconColor: 'text-rose-600',
    bgColor: 'bg-rose-50/70',
    borderColor: 'border-rose-200/70',
    href: '/fyi',
  },
  {
    id: 'gist',
    title: 'Huud Gist',
    badge: 'Watercooler',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200/80',
    description: 'Casual neighborhood conversations, polls & local buzz.',
    icon: MessageSquare,
    iconColor: 'text-cyan-600',
    bgColor: 'bg-cyan-50/70',
    borderColor: 'border-cyan-200/70',
    href: '/gist',
  },
];

// ── Search Result Tabs ────────────────────────────────────────────────────────
const SEARCH_TABS = [
  { id: 'all', label: 'All' },
  { id: 'users', label: 'Neighbors' },
  { id: 'posts', label: 'Feed' },
  { id: 'locations', label: 'Places' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'event', label: 'Events' },
  { id: 'services', label: 'Artisans' },
  { id: 'fyi', label: 'Bulletins' },
] as const;

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

  const {
    query,
    setQuery,
    results,
    loading: searchLoading,
    error: searchError,
    totalResults,
  } = useSearch(initialQuery);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isWhoIsInMyHuudOpen, setIsWhoIsInMyHuudOpen] = useState(false);
  const [isAskSentinelOpen, setIsAskSentinelOpen] = useState(false);

  const isSearching = query.length > 0;

  // Load trending topics
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const topics = await searchService.getTrendingSearches(8);
        // Only real trends — invented hashtags are shown in demo mode only.
        setTrendingTopics(topics.length > 0 ? topics : DEMO_MODE ? DEMO_TRENDING : []);
      } catch {
        setTrendingTopics(DEMO_MODE ? DEMO_TRENDING : []);
      }
    };
    loadTrending();
  }, []);

  // Load verified local news
  useEffect(() => {
    const loadNews = async () => {
      try {
        const articles = await newsService.getArticles({ region: 'nigeria', limit: 4 });
        setNewsArticles(
          articles.map((a: RssArticle) => ({
            title: a.title || '',
            description: a.description?.replace(/<[^>]*>/g, '').slice(0, 150) || '',
            url: a.link || '#',
            image: a.imageUrl || null,
            source: a.sourceName || a.source || 'Lagos Huud Desk',
            publishedAt: a.pubDate || new Date().toISOString(),
          }))
        );
      } catch {
        setNewsArticles([]);
      }
    };
    loadNews();
  }, []);

  // Search history
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

  return (
    <AppBrowseLayout
      className="!bg-slate-50 !px-0 !pt-0 !min-h-[100dvh]"
      header={
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-black/[0.06] shadow-2xs select-none">
          <div className="mx-auto max-w-2xl px-4 py-3 space-y-2.5">
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
              <Search
                size={18}
                className="absolute left-4 text-slate-400 pointer-events-none"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search neighbors, artisans, radar, items..."
                className="w-full h-11 pl-11 pr-11 bg-slate-100 rounded-full text-[14px] font-medium text-slate-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#00B82E]/40 placeholder:text-slate-400 border border-black/[0.05]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={15} strokeWidth={2.4} />
                </button>
              )}
            </form>

            {/* Search Result Tabs */}
            {isSearching && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-1">
                {SEARCH_TABS.map((t) => {
                  let count = 0;
                  if (t.id === 'all') count = totalResults;
                  else if (t.id === 'users') count = results?.users?.total || 0;
                  else if (t.id === 'locations') count = results?.locations?.total || 0;
                  else if (t.id === 'posts') {
                    count = results?.posts?.data?.filter((p: any) => !p.contentType || p.contentType === 'post').length || 0;
                  } else {
                    count = results?.posts?.data?.filter((p: any) => p.contentType === t.id).length || 0;
                  }

                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t.label} {count > 0 && <span className="opacity-70 ml-0.5">({count})</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="flex-1 bg-slate-50 pb-24">
        {isSearching ? (
          /* ═══ Active Search Results ═══ */
          <div className="mx-auto max-w-2xl px-4 py-4 space-y-4">
            {searchLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={24} className="animate-spin text-[#00B82E]" />
                <span className="text-xs font-bold text-slate-500">Scanning neighborhood records...</span>
              </div>
            ) : searchError ? (
              <div className="p-6 text-center rounded-2xl bg-rose-50 text-rose-700 border border-rose-200">
                <p className="text-xs font-bold">{searchError}</p>
              </div>
            ) : totalResults === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-white border border-black/[0.06] p-6">
                <Search size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-800">No matching signals found</p>
                <p className="text-xs text-slate-500 mt-1">Try another keyword or browse the discovery hubs below.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Users Section */}
                {(activeTab === 'all' || activeTab === 'users') && results?.users?.data && results.users.data.length > 0 && (
                  <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-2xs">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Neighbors</h3>
                    <div className="space-y-3">
                      {results.users.data.map((u: any) => (
                        <UserSearchResult key={u.id} user={u} onClose={() => saveSearchHistory(query)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Locations Section */}
                {(activeTab === 'all' || activeTab === 'locations') && results?.locations?.data && results.locations.data.length > 0 && (
                  <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-2xs">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Places</h3>
                    <div className="space-y-3">
                      {results.locations.data.map((l: any, i: number) => (
                        <LocationSearchResult key={`${l.city}-${l.state}-${i}`} location={l} onClose={() => saveSearchHistory(query)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts Section */}
                {(activeTab !== 'users' && activeTab !== 'locations') && results?.posts?.data && results.posts.data.length > 0 && (
                  <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-2xs">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Posts & Signals</h3>
                    <div className="space-y-4">
                      {results.posts.data.map((p: any) => (
                        <PostSearchResult key={p.id} post={p} onClose={() => saveSearchHistory(query)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ═══ BC.Game Hyperlocal Discovery Dashboard ═══ */
          <div className="mx-auto max-w-2xl px-4 py-5 space-y-6 select-none">
            {/* Quick Hero Banner: Spatial Sentinel Drawer Triggers */}
            <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#00B82E] text-white shadow-xs">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">Sentinel Spatial Radar</h2>
                    <p className="text-[11px] font-medium text-slate-500">Live street conditions & verified density</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800">
                  Active Mesh
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsWhoIsInMyHuudOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  <Users size={14} className="text-[#00B82E]" />
                  Who is in my Huud?
                </button>
                <button
                  type="button"
                  onClick={() => setIsAskSentinelOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#00B82E] px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#00B82E] active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles size={14} />
                  Ask Sentinel AI
                </button>
              </div>
            </div>

            {/* ── BC.Game 3-Column / 2-Column Discovery Game Cards Grid ── */}
            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Hyperlocal Discovery</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Browse what is happening within your 2km radius</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">8 Hubs</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {DISCOVERY_HUBS.map((hub) => {
                  const Icon = hub.icon;
                  return (
                    <Link
                      key={hub.id}
                      href={hub.href}
                      className={`group relative flex flex-col justify-between rounded-2xl border ${hub.borderColor} ${hub.bgColor} p-3.5 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all no-underline text-slate-900`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs ${hub.iconColor}`}>
                            <Icon size={18} strokeWidth={2.4} />
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${hub.badgeColor}`}>
                            {hub.badge}
                          </span>
                        </div>
                        <h4 className="text-[13px] font-extrabold text-slate-900 tracking-tight leading-snug group-hover:text-emerald-700 transition-colors">
                          {hub.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-snug">
                          {hub.description}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-end text-slate-400 group-hover:text-slate-700 transition-colors">
                        <ArrowRight size={13} strokeWidth={2.5} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* ── Trending Local Topics ── */}
            {trendingTopics.length > 0 && (
              <section className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-2xs">
                <div className="flex items-center gap-2 mb-2.5">
                  <TrendingUp size={16} className="text-[#00B82E]" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Trending in your Huud</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {trendingTopics.map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const clean = topic.startsWith('#') ? topic.slice(1) : topic;
                        setQuery(clean);
                        saveSearchHistory(clean);
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-[11px] font-bold text-slate-700 transition-colors active:scale-95 cursor-pointer border border-black/[0.04]"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ── Verified Local News Edge Cards ── */}
            {newsArticles.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-extrabold text-slate-900">Verified Local News</h3>
                  <Link href="/local-news" className="text-xs font-bold text-emerald-700 hover:text-emerald-900">
                    All News →
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {newsArticles.slice(0, 3).map((article, idx) => (
                    <a
                      key={idx}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3.5 rounded-2xl border border-black/[0.06] bg-white p-3 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all no-underline text-slate-900"
                    >
                      {article.image && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          <Image src={article.image} alt={article.title} fill className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
                          {article.source}
                        </span>
                        <h4 className="text-[13px] font-bold text-slate-900 line-clamp-2 leading-snug mt-0.5">
                          {article.title}
                        </h4>
                      </div>
                      <ExternalLink size={14} className="text-slate-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* ── Mounted Sentinel Spatial Drawers ── */}
      <WhoIsInMyHuudDrawer
        isOpen={isWhoIsInMyHuudOpen}
        onClose={() => setIsWhoIsInMyHuudOpen(false)}
      />
      <AskMyHuudDrawer
        isOpen={isAskSentinelOpen}
        onClose={() => setIsAskSentinelOpen(false)}
      />
    </AppBrowseLayout>
  );
}
