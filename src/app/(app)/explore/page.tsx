/**
 * Explore Page — Premium feed-style search & discovery hub.
 * Shows category shortcuts, trending content, and filtered posts immediately.
 * Search input is available but NOT auto-focused.
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useSearch } from '@/hooks/useSearch';
import { UserSearchResult } from '@/components/search/UserSearchResult';
import { PostSearchResult } from '@/components/search/PostSearchResult';
import { LocationSearchResult } from '@/components/search/LocationSearchResult';
import { BottomNav } from '@/components/feed/BottomNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import TopNav from '@/components/navigation/TopNav';
import { searchService } from '@/services/search.service';
import { newsService } from '@/services/news.service';
import { fyiService } from '@/services/fyi.service';
import type { RssArticle } from '@/types/incident';
import { LocalHuudMenu } from '@/components/navigation/LocalHuudMenu';
import { contentService } from '@/services/content.service';
import { XPostCard } from '@/components/feed/XPostCard';
import type { Post } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { usePostMutations, useLocationFeed } from '@/hooks/usePosts';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentLocation } from '@/lib/geolocation';

// ── Explore Tabs ──────────────────────────────────────────────
const EXPLORE_TABS = [
  { id: 'trending', label: 'For You', icon: 'local_fire_department' },
  { id: 'marketplace', label: 'Market', icon: 'storefront' },
  { id: 'services', label: 'Services', icon: 'handyman' },
  { id: 'jobs', label: 'Jobs', icon: 'work' },
  { id: 'events', label: 'Events', icon: 'event' },
  { id: 'fyi', label: 'FYI', icon: 'campaign' },
  { id: 'help_request', label: 'Help', icon: 'volunteer_activism' },
] as const;

type ExploreTab = typeof EXPLORE_TABS[number]['id'];

const SHORTCUTS = [
  { type: 'marketplace', label: 'Marketplace', imgSrc: '/illustration_marketplace.png', gradient: 'linear-gradient(135deg, #1a4a28 0%, #0d8a3e 50%, #00c431 100%)' },
  { type: 'services', label: 'Services', imgSrc: '/illustration_services.png', gradient: 'linear-gradient(135deg, #1a3a2a 0%, #2a6a4a 50%, #00a555 100%)' },
  { type: 'job', label: 'Jobs', imgSrc: '/illustration_jobs.png', gradient: 'linear-gradient(135deg, #2a1a4a 0%, #6a3a9a 50%, #9a5acf 100%)' },
  { type: 'event', label: 'Events', imgSrc: '/illustration_events.png', gradient: 'linear-gradient(135deg, #1a2a4a 0%, #2a4a8a 50%, #1a56ff 100%)' },
  { type: 'fyi', label: 'FYI', imgSrc: '/illustration_fyi.png', gradient: 'linear-gradient(135deg, #1a2a3a 0%, #2a4a6a 50%, #3a6a9a 100%)' },
  { type: 'help_request', label: 'Help', imgSrc: '/illustration_help.png', gradient: 'linear-gradient(135deg, #4a1a1a 0%, #8a2a2a 50%, #cc3333 100%)' },
  { type: 'incident_report', label: 'Safety', imgSrc: '/illustration_safety.png', gradient: 'linear-gradient(135deg, #300a0a 0%, #601a1a 50%, #a82020 100%)' },
];

// ── News article type ─────────────────────────────────────────
interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string | null;
  source: string;
  publishedAt: string;
}

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

// ── Tab Posts Hook ─────────────────────────────────────────────
function useTabPosts(tab: ExploreTab) {
  const { data, isLoading, error } = useLocationFeed(
    null,
    null,
    {
      feedTab: tab === 'trending' ? undefined : undefined,
      contentType: tab === 'trending' ? undefined : (tab as any),
    }
  );

  const posts = useMemo(() => {
    return data?.pages.flatMap((page: any) => page.content ?? page.data?.content ?? []) ?? [];
  }, [data]);

  return {
    posts,
    loading: isLoading,
    error: error ? 'Failed to load posts' : null,
  };
}

function ExplorePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Search state
  const {
    query, setQuery, type, setType,
    results, loading: searchLoading, error: searchError, totalResults,
  } = useSearch(initialQuery);

  // Explore tab state (shown when not searching)
  const [activeTab, setActiveTab] = useState<ExploreTab>('trending');
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Tab posts
  const { posts: tabPosts, loading: tabPostsLoading, error: tabPostsError } = useTabPosts(activeTab);

  const queryClient = useQueryClient();
  const { likePost, unlikePost, savePost, unsavePost } = usePostMutations();

  // Post interactions
  const handleLike = async (post: Post) => {
    try {
        if (post.isLiked) {
            await unlikePost(post.id);
        } else {
            await likePost(post.id);
        }
    } catch (error) {
        console.error('Like error:', error);
    }
  };

  const handleSave = async (post: Post) => {
    try {
        if (post.isSaved) {
            await unsavePost(post.id);
        } else {
            await savePost(post.id);
        }
    } catch (error) {
        console.error('Save error:', error);
    }
  };

  const handleComment = (postId: string) => {
    router.push(`/feed?post=${postId}`);
  };

  const handleHelpful = async (postId: string) => {
    try {
        await fyiService.markHelpful(postId);
        queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
    } catch (error) {
        console.error('Helpful error:', error);
    }
  };

  const handleEmergencyAction = async (post: Post, action: string) => {
    try {
        switch (action) {
            case 'acknowledge':
                await contentService.acknowledgePost(post.id);
                break;
            case 'aware':
                await contentService.toggleImAware(post.id);
                break;
            case 'nearby':
                await contentService.toggleImNearby(post.id);
                break;
            case 'safe':
                await contentService.toggleSafeMark(post.id);
                break;
            case 'confirm':
                await contentService.confirmOrDispute(post.id, 'confirm');
                break;
            case 'dispute':
                await contentService.confirmOrDispute(post.id, 'dispute');
                break;
        }
        queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
    } catch (error) {
        console.error(`Emergency action '${action}' error:`, error);
    }
  };

  const isSearching = query.length > 0;

  // DO NOT auto-focus the input on mount (user wants discovery content first)

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

  // Load Nigeria news
  useEffect(() => {
    const loadNews = async () => {
      setNewsLoading(true);
      try {
        const articles = await newsService.getArticles({
          region: 'nigeria',
          limit: 10,
        });
        setNewsArticles(
          articles.map((a: RssArticle) => ({
            title: a.title || '',
            description: a.description?.replace(/<[^>]*>/g, '').slice(0, 150) || '',
            url: a.link || '#',
            image: a.imageUrl || null,
            source: a.sourceName || a.source || 'News',
            publishedAt: a.pubDate || new Date().toISOString(),
          })),
        );
      } catch {
        setNewsArticles([]);
      } finally {
        setNewsLoading(false);
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

  // ── Post card rendering ─────────────────────────────────────
  const renderPostCard = useCallback((post: Post, index: number) => (
    <XPostCard
      key={`${post.id || post._id}-${index}`}
      post={post}
      onLike={() => handleLike(post)}
      onComment={() => handleComment(post.id || post._id || '')}
      onShare={() => {}}
      onSave={() => handleSave(post)}
      onEmergencyAction={(a) => handleEmergencyAction(post, a)}
      onHelpful={post.contentType === 'fyi' ? () => handleHelpful(post.id || post._id || '') : undefined}
      onCardClick={() => router.push(`/feed?post=${post.id || post._id}`)}
      currentUserId={user?.id || (user as any)?._id}
    />
  ), [handleLike, handleComment, handleSave, handleEmergencyAction, handleHelpful, router, user]);

  // ── Skeleton posts ──────────────────────────────────────────
  const postSkeletons = useMemo(() => (
    <div className="space-y-0">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse p-5 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 rounded-full" style={{ background: 'var(--neu-shadow-dark)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 rounded-full w-28" style={{ background: 'var(--neu-shadow-dark)' }} />
              <div className="h-2.5 rounded-full w-20" style={{ background: 'var(--neu-shadow-dark)' }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 rounded-full w-full" style={{ background: 'var(--neu-shadow-dark)' }} />
            <div className="h-3 rounded-full w-3/4" style={{ background: 'var(--neu-shadow-dark)' }} />
          </div>
        </div>
      ))}
    </div>
  ), []);

  return (
    <div className="flex flex-col h-screen neu-base">
      <TopNav />
      <div className="app-chrome-below-topnav">
      {/* ── Top Bar: Back + Search Input ── */}
      <div className="sticky top-0 z-50 neu-base shrink-0" style={{ boxShadow: '0 2px 8px var(--neu-shadow-dark)' }}>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center mod-chip transition-all"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-sm" style={{ color: 'var(--neu-text-muted)' }}>close</span>
              </button>
            )}
          </div>
        </form>

        {/* ── Tab Bar ── */}
        {!isSearching ? (
          <div className="relative px-3 pb-2">
            <div role="tablist" aria-label="Explore" className="flex items-center gap-0.5 overflow-x-auto no-scrollbar rounded-full border border-black/[0.05] bg-brand-surface/60 p-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              {EXPLORE_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive ? 'true' : 'false'}
                    onClick={() => setActiveTab(tab.id)}
                    className={`segmented-tab ${isActive ? 'segmented-tab--active' : 'segmented-tab--inactive'} flex-shrink-0 px-3.5 py-2 text-[12px] font-semibold rounded-full whitespace-nowrap select-none active:scale-[0.97] flex items-center gap-1.5`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="relative px-3 pb-2">
            <div role="tablist" aria-label="Search results" className="flex items-center gap-0.5 overflow-x-auto no-scrollbar rounded-full border border-black/[0.05] bg-brand-surface/60 p-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              {SEARCH_TABS.map((tab) => {
                const count =
                  tab.id === 'all'
                    ? totalResults
                    : results?.[tab.id as keyof typeof results]?.total || 0;
                const isActive = type === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive ? 'true' : 'false'}
                    onClick={() => setType(tab.id as any)}
                    className={`segmented-tab ${isActive ? 'segmented-tab--active' : 'segmented-tab--inactive'} flex-shrink-0 px-4 py-2 text-[13px] font-semibold rounded-full whitespace-nowrap select-none active:scale-[0.97]`}
                  >
                    {tab.label}{count > 0 ? ` (${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Content Area ── */}
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div data-app-scroll-root className="flex-1 overflow-y-auto pb-20">
        {isSearching ? (
          /* ═══ Search Results ═══ */
          <div className="max-w-[680px] mx-auto">
            {searchLoading ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Searching…</span>
              </div>
            ) : searchError ? (
              <div className="text-center py-16 px-4">
                <p className="text-sm font-medium text-brand-red">{searchError}</p>
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
                        .filter(u => u && ((u as any).id || (u as any)._id) && u.username)
                        .map((u) => (
                          <UserSearchResult key={(u as any).id || (u as any)._id} user={u} onClose={() => saveSearchHistory(query)} />
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
            {/* Category Shortcuts row */}
            <div className="w-full px-4 pt-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none items-start">
              {SHORTCUTS.map((s) => (
                <button
                  key={s.type}
                  onClick={() => router.push(`/feed?type=${s.type}`)}
                  className="flex-shrink-0 relative w-[100px] aspect-[4/5] rounded-[18px] overflow-hidden group/card shadow-sm cursor-pointer select-none transition-all duration-300 hover:opacity-100 hover:scale-[1.02] active:scale-[0.98] opacity-90"
                  style={{ background: s.gradient }}
                  type="button"
                >
                  <div className="absolute inset-0 w-full h-full">
                    <Image
                      src={s.imgSrc}
                      alt={s.label}
                      fill
                      sizes="100px"
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 z-10 p-2 space-y-0.5 flex flex-col justify-end min-h-[50%]">
                    <h4 className="text-[10px] font-black text-white leading-tight uppercase tracking-wider text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                      {s.label}
                    </h4>
                  </div>
                </button>
              ))}
            </div>

            {/* Local Huud — community utilities */}
            <div className="px-4 pt-2 pb-2">
              <LocalHuudMenu variant="panel" />
            </div>

            {/* Divider */}
            <div className="neu-divider mx-4 my-2" />

            {/* Search History (only when no tab content is loading) */}
            {searchHistory.length > 0 && (
              <div className="px-4 pt-2 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Recent Searches</h3>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {searchHistory.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => handleHistoryClick(h)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 border border-black/[0.06] dark:border-white/[0.06]"
                      style={{ color: 'var(--neu-text)', background: 'var(--brand-surface)' }}
                    >
                      <span className="material-symbols-outlined text-[13px]" style={{ color: 'var(--neu-text-muted)' }}>history</span>
                      {h}
                    </button>
                  ))}
                </div>
                <div className="neu-divider mt-3" />
              </div>
            )}

            {/* ══ Trending Topics — compact pill cloud ══ */}
            {activeTab === 'trending' && trendingTopics.length > 0 && (
              <div className="px-4 pt-2 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                  <span className="material-symbols-outlined text-[13px] align-middle mr-1 text-primary">trending_up</span>
                  Trending in Nigeria
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {trendingTopics.slice(0, 8).map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTrendingClick(topic)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] border border-black/[0.06] dark:border-white/[0.06]"
                      style={{ color: 'var(--neu-text)', background: 'var(--brand-surface)' }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══ News Hero (trending tab only) ══ */}
            {activeTab === 'trending' && newsArticles.length > 0 && (
              <div className="px-4 pb-3">
                <a
                  href={newsArticles[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl overflow-hidden neu-card-sm transition-transform active:scale-[0.98]"
                >
                  {newsArticles[0].image ? (
                    <div className="relative w-full h-40 bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newsArticles[0].image}
                        alt={newsArticles[0].title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-brand-red/90 text-white text-[10px] font-bold uppercase">Live</span>
                          <span className="text-[11px] text-white/80">{newsArticles[0].source}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{newsArticles[0].title}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-brand-blue/10">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-brand-red/90 text-white text-[10px] font-bold uppercase">News</span>
                        <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{newsArticles[0].source}</span>
                      </div>
                      <h3 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: 'var(--neu-text)' }}>{newsArticles[0].title}</h3>
                    </div>
                  )}
                </a>
              </div>
            )}

            {/* ══ Tab Section Header ══ */}
            <div className="px-4 pt-1 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--neu-text)' }}>
                <span className="material-symbols-outlined text-[16px] text-primary">
                  {EXPLORE_TABS.find(t => t.id === activeTab)?.icon || 'explore'}
                </span>
                {activeTab === 'trending' ? 'Latest in Your Huud' :
                 activeTab === 'marketplace' ? 'Marketplace Listings' :
                 activeTab === 'services' ? 'Local Services' :
                 activeTab === 'jobs' ? 'Job Opportunities' :
                 activeTab === 'events' ? 'Upcoming Events' :
                 activeTab === 'fyi' ? 'FYI Bulletins' :
                 'Help Requests'}
              </h2>
            </div>

            {/* ══ Tab Posts ══ */}
            {tabPostsLoading ? (
              postSkeletons
            ) : tabPostsError ? (
              <div className="text-center py-12 px-4">
                <span className="material-symbols-outlined text-4xl mb-2 block" style={{ color: 'var(--neu-text-muted)' }}>error_outline</span>
                <p className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>{tabPostsError}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>Pull down to refresh</p>
              </div>
            ) : tabPosts.length === 0 ? (
              <div className="text-center py-12 px-4">
                <span className="material-symbols-outlined text-4xl mb-2 block" style={{ color: 'var(--neu-text-muted)' }}>
                  {activeTab === 'marketplace' ? 'storefront' :
                   activeTab === 'services' ? 'handyman' :
                   activeTab === 'jobs' ? 'work' :
                   activeTab === 'events' ? 'event' :
                   activeTab === 'fyi' ? 'campaign' :
                   activeTab === 'help_request' ? 'volunteer_activism' :
                   'explore'}
                </span>
                <p className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>
                  No {activeTab === 'trending' ? 'posts' :
                       activeTab === 'marketplace' ? 'listings' :
                       activeTab === 'services' ? 'services' :
                       activeTab === 'jobs' ? 'jobs' :
                       activeTab === 'events' ? 'events' :
                       activeTab === 'fyi' ? 'bulletins' :
                       'requests'} yet
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>Be the first to share in your neighborhood!</p>
              </div>
            ) : (
              <div className="space-y-0">
                {tabPosts.map(renderPostCard)}
              </div>
            )}

            {/* ── Inline news articles (trending tab) ── */}
            {activeTab === 'trending' && newsArticles.length > 1 && tabPosts.length > 0 && (
              <div className="px-4 pt-4 pb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--neu-text-muted)' }}>
                  <span className="material-symbols-outlined text-[13px] align-middle mr-1">newspaper</span>
                  More Headlines
                </h3>
                <div className="space-y-0">
                  {newsArticles.slice(1, 6).map((article, idx) => (
                    <a
                      key={idx}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-3 py-3 border-b transition-all hover:opacity-80 group"
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
                        <p className="text-[13px] font-semibold leading-snug line-clamp-2" style={{ color: 'var(--neu-text)' }}>
                          {article.title}
                        </p>
                      </div>
                      {article.image && (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={article.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
        <RightSidebar />
      </div>
      </div>

      {/* Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
