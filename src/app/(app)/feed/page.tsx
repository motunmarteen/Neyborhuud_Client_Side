'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getNeedsCommunitySelection,
  getNeedsGpsLocationVerification,
} from '@/lib/communityContext';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { FeedSkyHero } from '@/components/feed/FeedSkyHero';
import { XPostCard } from '@/components/feed/XPostCard';
import { ReportModal } from '@/components/feed/ReportModal';
import { FeedSkeleton } from '@/components/feed/PostSkeleton';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { BottomNav } from '@/components/feed/BottomNav';
import { PostDetailsModal } from '@/components/feed/PostDetailsModal';
import { useLocationFeed, usePostMutations } from '@/hooks/usePosts';
import { FYICard } from '@/components/fyi/FYICard';
import { HelpRequestCard } from '@/components/help-request/HelpRequestCard';
import { useDepartments } from '@/hooks/useDepartments';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { contentService } from '@/services/content.service';
import { fyiService } from '@/services/fyi.service';
import { getCurrentLocation } from '@/lib/geolocation';
import { triggerSmartLocationSync } from '@/hooks/useSmartLocationSync';
import { isUserInNigeria } from '@/lib/nigeriaCheck';
import { useTranslation } from '@/lib/i18n';
import { FeedTab, Post, ContentType } from '@/types/api';
import { useInView } from 'react-intersection-observer';
import { useQueryClient } from '@tanstack/react-query';
import { usePinPost } from '@/hooks/useGamification';
import { BoostModal } from '@/components/gamification/BoostModal';
import { FeedCommentsSheet } from '@/components/feed/FeedCommentsSheet';
import { FeedDiscoveryBlock } from '@/components/feed/FeedDiscoveryBlock';
import { FrequentPlaceContextBanner } from '@/components/feed/FrequentPlaceContextBanner';
import { mergeDiscoveryIntoFeed, type BaseFeedItem, type DiscoveryFeedItem } from '@/lib/feedDiscoveryMerge';
import { useFeedDiscoveryPools } from '@/hooks/useFeedDiscoveryPools';
import { FeedWelcomeSheet } from '@/components/feed/FeedWelcomeSheet';
import { FeedProfilePrompt } from '@/components/feed/FeedProfilePrompt';
import { FeedNewsTicker } from '@/components/feed/FeedNewsTicker';
import { FeedSentinelRow } from '@/components/feed/FeedSentinelRow';

const getFilterBannerData = (type: string) => {
    switch (type) {
        case 'marketplace':
            return {
                imageSrc: '/illustration_marketplace.png',
                title: 'Local Marketplace',
                desc: 'Browse items offered by neighbors in your area. Secure transactions and direct handovers.',
                borderCls: 'border-primary/20',
                bgCls: 'bg-primary/5',
            };
        case 'emergency':
            return {
                imageSrc: '/illustration_safety.png',
                title: 'Sentinel Safety Watch',
                desc: 'Active neighborhood safety watches, incident reports, and real-time security alerts.',
                borderCls: 'border-brand-red/25',
                bgCls: 'bg-brand-red/5 text-brand-red',
            };
        case 'incident_report':
            return {
                imageSrc: '/illustration_safety.png',
                title: 'Incident Reports',
                desc: 'View and track neighborhood incident reports, security updates, and witness accounts.',
                borderCls: 'border-brand-red/25',
                bgCls: 'bg-brand-red/5 text-brand-red',
            };
        case 'job':
            return {
                imageSrc: '/illustration_jobs.png',
                title: 'Local Careers & Opportunities',
                desc: 'Find part-time work, gig jobs, co-working alerts, and local service hiring nearby.',
                borderCls: 'border-brand-blue/20',
                bgCls: 'bg-brand-blue/5',
            };
        case 'event':
            return {
                imageSrc: '/illustration_events.png',
                title: 'Gatherings & Events',
                desc: 'Neighborhood block parties, community cleanup drives, and fun gatherings near you.',
                borderCls: 'border-status-warning/20',
                bgCls: 'bg-status-warning/5',
            };
        case 'services':
            return {
                imageSrc: '/illustration_services.png',
                title: 'Huud Services & Experts',
                desc: 'Find handymen, plumbers, technicians, and local service providers recommended by neighbors.',
                borderCls: 'border-primary/20',
                bgCls: 'bg-primary/5',
            };
        case 'help_request':
            return {
                imageSrc: '/illustration_help.png',
                title: 'Mutual Help & Requests',
                desc: 'Neighbors helping neighbors. Offer a hand or request assistance from local volunteers.',
                borderCls: 'border-brand-blue/20',
                bgCls: 'bg-brand-blue/5',
            };
        default:
            return null;
    }
};

function XFeedInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useTranslation();
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [createPostFocusMedia, setCreatePostFocusMedia] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [isPostDetailsOpen, setIsPostDetailsOpen] = useState(false);
    const [feedTab, setFeedTab] = useState<FeedTab>('your_huud');
    const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
    const [fyiSubtypeFilter, setFyiSubtypeFilter] = useState<string>('');
    const [priorityFilter, setPriorityFilter] = useState<string>('');
    const locationFetched = useRef(false);
    const queryClient = useQueryClient();
    const canPost = isUserInNigeria();
    const mainRef = useRef<HTMLElement>(null);

    // Derive contentTypeFilter from URL search params (set by sidebar / search overlay)
    const CONTENT_TYPE_TABS: string[] = ['post', 'fyi', 'help_request', 'job', 'event', 'marketplace', 'emergency', 'incident_report'];
    const typeParam = searchParams.get('type') || '';
    const contentTypeFilter: ContentType | undefined =
        (typeParam === 'incident_report')
            ? 'emergency'
            : CONTENT_TYPE_TABS.includes(typeParam)
            ? (typeParam as ContentType)
            : undefined;

    // Legacy gossip filter → Huud Gist pillar
    useEffect(() => {
        if (typeParam === 'gossip') {
            router.replace('/gist');
        }
    }, [typeParam, router]);

    // Listen for create-post event from TopNav / sky hero
    useEffect(() => {
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<{ focusMedia?: boolean }>).detail;
            setCreatePostFocusMedia(!!detail?.focusMedia);
            setIsCreatePostOpen(true);
        };
        window.addEventListener('open-create-post', handler);
        return () => window.removeEventListener('open-create-post', handler);
    }, []);

    // Fetch departments for filter dropdown
    const { data: departments = [] } = useDepartments();

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_access_token') : null;
        if (!token) return;
        void authService.syncCommunityFromProfile().finally(() => {
            if (getNeedsCommunitySelection()) {
                router.replace('/pick-community');
                return;
            }
            if (getNeedsGpsLocationVerification()) {
                router.replace('/verify-location');
            }
        });
    }, [router]);

    // ── Location logic removed: Feed defaults to the user's saved community ──
    // The feed relies on the user's saved location from registration unless they explicitly request otherwise.

    // Fetch feed with location - tab maps directly to the backend feed layers
    const {
        data: feedData,
        isLoading,
        isError,
        error,
        refetch: refetchFeed,
        isRefetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useLocationFeed(location?.lat || null, location?.lng || null, {
        radius: 5000,
        feedTab,
        contentType: contentTypeFilter,
        departmentId: departmentFilter,
        priority: priorityFilter || undefined,
        fyiSubtype: contentTypeFilter === 'fyi' ? (fyiSubtypeFilter || undefined) : undefined,
    });

    // Post mutations
    const { likePost, unlikePost, savePost, unsavePost, deletePost } = usePostMutations();

    // Current user ID for ownership checks
    const { user: currentAuthUser } = useAuth();
    const currentUserId = currentAuthUser?.id || null;
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
    const [reportingPostId, setReportingPostId] = useState<string | null>(null);
    const [pinningPostId, setPinningPostId] = useState<string | null>(null);
    const [commentsTarget, setCommentsTarget] = useState<{ kind: 'post'; id: string } | null>(null);
    const [commentsAnchor, setCommentsAnchor] = useState<{ left: number; width: number } | null>(null);
    const pinPost = usePinPost();

    const openCommentsFromElement = (target: { kind: 'post'; id: string }, element: HTMLElement | null) => {
        if (element) {
            const rect = element.getBoundingClientRect();
            setCommentsAnchor({ left: rect.left, width: rect.width });
        } else {
            setCommentsAnchor(null);
        }
        setCommentsTarget(target);
    };

    /** Mixed marketplace / events / jobs when not using a content-type sidebar filter */
    const discoveryEnabled = !contentTypeFilter;

    // Flatten posts from all pages (deduplicate by ID to avoid duplicate React keys
    // when backend returns overlapping results across paginated pages)
    const posts: Post[] = useMemo(() => {
        const all = feedData?.pages.flatMap((page: any) => page.content ?? page.data?.content ?? []) ?? [];
        const seen = new Set<string>();
        return all.filter((p: Post) => {
            const id = p.id || (p as any)._id;
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }, [feedData?.pages]);

    const mergedFeed: BaseFeedItem[] = useMemo(
        () => posts
                .filter(p => !(discoveryEnabled && p.contentType === 'help_request'))
                .map((p) => ({ _type: 'post' as const, data: p })),
        [posts, discoveryEnabled],
    );
    const missedAlerts = feedData?.pages?.[0]?.meta?.missedAlerts ?? null;
    const placeContext = feedData?.pages?.[0]?.meta?.placeContext ?? null;

    const { pools: discoveryPools } = useFeedDiscoveryPools(discoveryEnabled, {
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
    });

    const timeline: DiscoveryFeedItem[] = useMemo(
        () => mergeDiscoveryIntoFeed(mergedFeed, discoveryPools, discoveryEnabled),
        [mergedFeed, discoveryPools, discoveryEnabled],
    );

    // Infinite scroll
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0,
        rootMargin: '400px',
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Handle like/unlike
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

    // Handle save/unsave
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

    // Handle helpful for FYI bulletins
    const handleHelpful = async (postId: string) => {
        try {
            await fyiService.markHelpful(postId);
            queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
        } catch (error) {
            console.error('Helpful error:', error);
        }
    };

    // Handle share via Web Share API
    const handleShare = async (post: Post) => {
        const shareData = {
            title: post.content?.substring(0, 50) || 'NeyborHuud Post',
            text: post.content || '',
            url: `${window.location.origin}/post/${post.id}`,
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(shareData.url);
        }
    };

    // Handle emergency actions (Acknowledge, Aware, Nearby, Safe, Confirm, Dispute)
    const handleEmergencyAction = async (post: Post, action: string) => {
        // Optimistic update helper: instantly toggle the button state in the cache
        const optimisticUpdate = (updater: (p: Post) => Partial<Post>) => {
            queryClient.setQueriesData<any>({ queryKey: ['locationFeed'] }, (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        content: (page.content ?? []).map((p: Post) =>
                            p.id === post.id ? { ...p, ...updater(p) } : p
                        ),
                    })),
                };
            });
        };

        // Apply optimistic state immediately
        switch (action) {
            case 'acknowledge':
                optimisticUpdate((p) => ({ isAcknowledged: !p.isAcknowledged }));
                break;
            case 'aware':
                optimisticUpdate((p) => ({ isAware: !p.isAware }));
                break;
            case 'nearby':
                optimisticUpdate((p) => ({ isNearby: !p.isNearby }));
                break;
            case 'safe':
                optimisticUpdate((p) => ({ isSafe: !p.isSafe }));
                break;
            case 'confirm':
                optimisticUpdate(() => ({ confirmDisputeAction: post.confirmDisputeAction === 'confirm' ? null : 'confirm' as const }));
                break;
            case 'dispute':
                optimisticUpdate(() => ({ confirmDisputeAction: post.confirmDisputeAction === 'dispute' ? null : 'dispute' as const }));
                break;
        }

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
            // Background revalidate to sync with server state
            queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
        } catch (error) {
            // Revert optimistic update on error
            queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
            console.error(`Emergency action '${action}' error:`, error);
        }
    };

    const openPostDetails = (postId: string) => {
        setSelectedPostId(postId);
        setIsPostDetailsOpen(true);
    };

    const handleDeletePost = async () => {
        if (!deletingPostId) return;
        try {
            await deletePost(deletingPostId);
            setDeletingPostId(null);
        } catch (error) {
            console.error('Delete post error:', error);
        }
    };

    const handleEditPost = (post: Post) => {
        setEditingPost(post);
    };

    // Helper to format time ago


    return (
        <div className="relative flex h-app w-full max-w-[100vw] overflow-hidden neu-base">
            {/* Left Sidebar */}
            <Suspense fallback={<div className="hidden lg:block lg:w-80 shrink-0" />}>
                <LeftSidebar mode="both" />
            </Suspense>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {/* TopNav moved inside main to scroll with page */}

            {/* Main scroll area */}
            <main
              ref={mainRef}
              data-app-scroll-root
              className="feed-scroll-main feed-scroll-main--sky-feed min-h-0 flex-1 overflow-y-auto scroll-smooth"
            >
                <div className="feed-page-scroll flex flex-col pb-[var(--app-scroll-bottom)] relative">
                    <TopNav />
                    <div className="feed-hero-stack shrink-0">
                      <FeedSkyHero
                        below={
                          <>
                            <FeedNewsTicker />
                          </>
                        }
                      />
                    </div>
                        <div className="feed-sky-feed-body flex flex-col gap-0 pt-0">
                            {/* Active content-type filter chip */}
                            {contentTypeFilter && (() => {
                                const banner = getFilterBannerData(contentTypeFilter);
                                if (!banner) return null;
                                return (
                                    <div className="w-full">
                                        <div className={`glass-card p-4 flex gap-4 items-center border ${banner.borderCls} ${banner.bgCls} w-full`}>
                                            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-black/[0.02] border border-glass-border">
                                                <img src={banner.imageSrc} alt={banner.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-black text-neu-text dark:text-white leading-tight flex items-center gap-1.5 flex-wrap">
                                                    {banner.title}
                                                    <button
                                                        onClick={() => router.replace('/feed')}
                                                        className="ml-auto flex items-center justify-center h-6 w-6 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-neu-text-secondary dark:text-white/60 cursor-pointer text-xs"
                                                        aria-label="Clear filter"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                                    </button>
                                                </h3>
                                                <p className="text-[11px] font-medium text-neu-text-secondary dark:text-white/60 mt-1.5 leading-snug">{banner.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {feedTab === 'your_huud' && (
                                <div className="w-full">
                                    <FeedProfilePrompt />
                                </div>
                            )}

                            {feedTab === 'your_huud' && placeContext && (
                                <div className="w-full">
                                    <FrequentPlaceContextBanner context={placeContext} />
                                </div>
                            )}

                            {/* FYI Subtype Filter — only when FYI type active */}
                            {contentTypeFilter === 'fyi' && (
                                <div className="w-full px-5">
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                        {['all', 'safety_notice', 'lost_found', 'community_announcement', 'local_news', 'alert'].map(st => (
                                            <button key={st} onClick={() => setFyiSubtypeFilter(st === 'all' ? '' : st)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${fyiSubtypeFilter === (st === 'all' ? '' : st) ? 'mod-chip mod-chip-active text-primary' : 'mod-chip'}`}>
                                                {st === 'all' ? 'All' : st.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {missedAlerts && missedAlerts.count > 0 && (
                                <div className="w-full">
                                    <div
                                        className="px-5 py-3.5 animate-fade-in"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,0,0,0.06), rgba(255,255,255,0.9))',
                                            borderBottom: '1px solid rgba(255,0,0,0.16)',
                                            boxShadow: '0 4px 16px rgba(255,0,0,0.06)',
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="rounded-xl size-10 shrink-0 flex items-center justify-center text-brand-red"
                                                style={{ background: 'rgba(255,0,0,0.1)' }}
                                            >
                                                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>shield</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                                                    {missedAlerts.count === 1
                                                        ? '1 nearby alert while you were away'
                                                        : `${missedAlerts.count} nearby alerts while you were away`}
                                                </p>
                                                <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                                                    Highest severity: {missedAlerts.highestSeverity}. Areas: {missedAlerts.lgas.join(', ')}.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Loading State */}
                            {isLoading && (
                                <div className="w-full">
                                    <FeedSkeleton count={5} />
                                </div>
                            )}

                            {/* Error State */}
                            {isError && (
                                <div className="w-full">
                                    <div className="flex flex-col items-center justify-center py-12 px-5 mod-card w-full">
                                        <div className="w-16 h-16 rounded-full mod-inset flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined text-[32px] text-brand-red">warning</span>
                                        </div>
                                        <p className="text-sm text-center mb-2" style={{ color: 'var(--neu-text)' }}>
                                            {locationError || t('feed.failedToLoad')}
                                        </p>
                                        {error && (
                                            <p className="text-xs text-center mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                                                {error instanceof Error ? error.message : 'Unknown error'}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => refetchFeed()}
                                            disabled={isRefetching}
                                            className="mt-2 px-6 py-2.5 mod-chip rounded-xl text-sm font-bold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                                            style={{ color: 'var(--neu-text)' }}
                                        >
                                            {isRefetching ? (
                                                <>
                                                    <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                                    {t('feed.retrying')}
                                                </>
                                            ) : (
                                                t('feed.retry')
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Empty State: No Location and No Posts */}
                            {!isLoading && !isError && !location && locationError && timeline.length === 0 && mergedFeed.length === 0 && (
                                <div className="w-full">
                                    <div className="flex flex-col items-center justify-center py-12 px-5 mod-card w-full">
                                        <div className="w-16 h-16 rounded-full mod-inset flex items-center justify-center mb-4">
                                            <span className="material-symbols-outlined text-[32px] text-brand-red">location_off</span>
                                        </div>
                                        <p className="text-sm text-center" style={{ color: 'var(--neu-text)' }}>
                                            {locationError}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!isLoading && !isError && location && mergedFeed.length === 0 && timeline.length === 0 && (
                                <div className="w-full">
                                    <div className="glass-card flex flex-col items-center justify-center py-12 px-6 text-center w-full border border-glass-border shadow-md">
                                        <div className="w-full max-w-[280px] h-[140px] rounded-2xl overflow-hidden mb-6 border border-glass-border/30 bg-black/[0.02]">
                                            <img src="/illustration_services.png" alt="Welcome" className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-base font-bold text-neu-text dark:text-white">
                                            {t('feed.noPostsTitle')}
                                        </p>
                                        <p className="text-sm mt-2 max-w-xs text-neu-text-secondary dark:text-white/60">
                                            {t('feed.noPostsSubtitle')}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => window.dispatchEvent(new CustomEvent('open-create-post'))}
                                            className="mt-6 px-6 py-3 text-xs bg-primary hover:bg-brand-green-dark text-black hover:text-white font-black rounded-xl transition-all shadow-sm cursor-pointer"
                                        >
                                            Start a conversation
                                        </button>
                                    </div>
                                </div>
                            )}

                        {/* Posts stream */}
                        {timeline.length > 0 && (
                        <div className="feed-posts-stream flex flex-col gap-0 pb-0">
                            {timeline.map((item, index) => {
                                const renderItem = () => {
                                    if (
                                        item._type === 'discovery_marketplace' ||
                                        item._type === 'discovery_event' ||
                                        item._type === 'discovery_job' ||
                                        item._type === 'discovery_help' ||
                                        item._type === 'discovery_services' ||
                                        item._type === 'discovery_news' ||
                                        item._type === 'discovery_neighbors'
                                    ) {
                                        return (
                                            <div
                                                key={item.key}
                                                className="w-full"
                                            >
                                                <FeedDiscoveryBlock
                                                    item={item}
                                                    userLocation={location}
                                                    currentUserId={currentUserId}
                                                />
                                            </div>
                                        );
                                    }
                                    const post = item.data;
                                    if (post.contentType === 'help_request') {
                                        return (
                                            <div key={post.id} className="w-full md:snap-center" data-comment-anchor={`post-${post.id}`}>
                                                <HelpRequestCard
                                                    post={post}
                                                    onComment={(id) => {
                                                        const el = document.querySelector(`[data-comment-anchor="post-${id}"]`) as HTMLElement | null;
                                                        openCommentsFromElement({ kind: 'post', id }, el);
                                                    }}
                                                    onEdit={handleEditPost}
                                                    onDelete={(id) => setDeletingPostId(id)}
                                                    onReport={(id) => setReportingPostId(id)}
                                                    onPin={(id) => setPinningPostId(id)}
                                                />
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={post.id} className="w-full md:snap-center" data-comment-anchor={`post-${post.id}`}>
                                            <XPostCard
                                                post={post}
                                                currentUserId={currentUserId || undefined}
                                                userLocation={location}
                                                onLike={() => handleLike(post)}
                                                onComment={() => {
                                                    const el = document.querySelector(`[data-comment-anchor="post-${post.id}"]`) as HTMLElement | null;
                                                    openCommentsFromElement({ kind: 'post', id: post.id }, el);
                                                }}
                                                onShare={() => handleShare(post)}
                                                onSave={() => handleSave(post)}
                                                onEdit={() => handleEditPost(post)}
                                                onDelete={() => setDeletingPostId(post.id)}
                                                onReport={(id) => setReportingPostId(id)}
                                                onPin={(id) => setPinningPostId(id)}
                                                onEmergencyAction={(action) => handleEmergencyAction(post, action)}
                                                onReposted={() => queryClient.invalidateQueries({ queryKey: ['locationFeed'] })}
                                                onCardClick={() => openPostDetails(post.id)}
                                            />
                                        </div>
                                    );
                                };

                                return (
                                    <React.Fragment key={(item as any).data?.repostId ?? (item as any).key ?? (item as any).data?.id ?? `feed-item-${index}`}>
                                        {renderItem()}
                                    </React.Fragment>
                                );
                            })}
                            </div>
                            )}

                        {/* Load More Trigger — branded pulsing dots, no generic spinner */}
                        {hasNextPage && (
                            <div ref={loadMoreRef} className="flex justify-center py-5">
                                {isFetchingNextPage && (
                                    <div className="flex items-center gap-1.5" aria-label="Loading more">
                                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '180ms' }} />
                                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '360ms' }} />
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Mobile bottom nav spacing clearance */}
                        <div className="shrink-0 md:hidden" style={{ height: 'var(--app-nav-bottom)' }} />
                        </div>
                    </div>
                </main>
            </div>

                {/* Right Sidebar */}
                <RightSidebar />

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden">
                <Suspense fallback={<div className="h-16" />}>
                    <BottomNav />
                </Suspense>
            </div>

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={isCreatePostOpen}
                onClose={() => {
                    setIsCreatePostOpen(false);
                    setCreatePostFocusMedia(false);
                }}
                focusMediaOnOpen={createPostFocusMedia}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
                    queryClient.invalidateQueries({ queryKey: ['fyi'] });
                    queryClient.invalidateQueries({ queryKey: ['helpRequest'] });
                }}
            />

            {/* Post Details Modal */}
            <PostDetailsModal
                postId={selectedPostId}
                isOpen={isPostDetailsOpen}
                onClose={() => setIsPostDetailsOpen(false)}
            />

            <FeedCommentsSheet
                isOpen={!!commentsTarget}
                target={commentsTarget}
                desktopAnchor={commentsAnchor}
                onClose={() => {
                    setCommentsTarget(null);
                    setCommentsAnchor(null);
                }}
            />

            {/* Report Modal */}
            {reportingPostId && (
                <ReportModal
                    postId={reportingPostId}
                    onClose={() => setReportingPostId(null)}
                    onSubmit={async (postId, reason, description) => {
                        await contentService.reportPost(postId, reason, description);
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            {deletingPostId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeletingPostId(null)}>
                    <div className="mod-modal rounded-2xl p-6 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--neu-text)' }}>Delete Post</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--neu-text-muted)' }}>
                            Are you sure you want to delete this post? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeletingPostId(null)}
                                className="px-4 py-2 rounded-xl text-sm font-bold mod-chip"
                                style={{ color: 'var(--neu-text-muted)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeletePost}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-brand-red/20 text-brand-red mod-chip hover:bg-brand-red/30 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pin Post Modal */}
            {pinningPostId && (
                <BoostModal
                    type="post"
                    itemTitle="Pin Post to Feed"
                    options={[
                        { days: 1, coins: 100, label: "24 Hours" },
                        { days: 7, coins: 300, label: "7 Days", badge: "Popular" },
                    ]}
                    defaultDays={1}
                    isPending={pinPost.isPending}
                    onConfirm={(days) => pinPost.mutate({ postId: pinningPostId, days: days as 1 | 7 })}
                    onClose={() => setPinningPostId(null)}
                />
            )}

            <FeedWelcomeSheet />
        </div>
    );
}

export default function XFeed() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center neu-base">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" aria-hidden />
            </div>
        }>
            <XFeedInner />
        </Suspense>
    );
}
