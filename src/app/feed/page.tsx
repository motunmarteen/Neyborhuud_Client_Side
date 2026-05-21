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
import { FeedTabs } from '@/components/feed/FeedTabs';
import { FeedSkyHero } from '@/components/feed/FeedSkyHero';
import { XPostCard } from '@/components/feed/XPostCard';
import { ReportModal } from '@/components/feed/ReportModal';
import { FeedSkeleton } from '@/components/feed/PostSkeleton';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { BottomNav } from '@/components/feed/BottomNav';
import { PostDetailsModal } from '@/components/feed/PostDetailsModal';
import { useLocationFeed, usePostMutations } from '@/hooks/usePosts';
import { useGossipList } from '@/hooks/useGossip';
import { GossipCard } from '@/components/gossip/GossipCard';
import { GossipPost } from '@/types/gossip';
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
import { mergeDiscoveryIntoFeed, type DiscoveryFeedItem } from '@/lib/feedDiscoveryMerge';
import { useFeedDiscoveryPools } from '@/hooks/useFeedDiscoveryPools';
import { useFeedTabSwipe } from '@/hooks/useFeedTabSwipe';

function XFeedInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useTranslation();
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
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
    const lastScrollY = useRef(0);
    const [navHidden, setNavHidden] = useState(false);
    const feedSwipe = useFeedTabSwipe(feedTab, setFeedTab);

    // Derive contentTypeFilter from URL search params (set by sidebar / search overlay)
    const CONTENT_TYPE_TABS: string[] = ['post', 'fyi', 'help_request', 'job', 'event', 'marketplace', 'emergency'];
    const typeParam = searchParams.get('type') || '';
    const contentTypeFilter: ContentType | undefined = CONTENT_TYPE_TABS.includes(typeParam) ? (typeParam as ContentType) : undefined;

    // Gossip has its own dedicated page — redirect when ?type=gossip is set
    useEffect(() => {
        if (typeParam === 'gossip') {
            router.replace('/gossip');
        }
    }, [typeParam, router]);

    // Listen for create-post event from TopNav
    useEffect(() => {
        const handler = () => setIsCreatePostOpen(true);
        window.addEventListener('open-create-post', handler);
        return () => window.removeEventListener('open-create-post', handler);
    }, []);

    // Auto-hide navs on scroll down, show on scroll up
    useEffect(() => {
        const el = mainRef.current;
        if (!el) return;
        const THRESHOLD = 10;
        const handleScroll = () => {
            const y = el.scrollTop;
            if (y - lastScrollY.current > THRESHOLD) {
                setNavHidden(true);
            } else if (lastScrollY.current - y > THRESHOLD) {
                setNavHidden(false);
            }
            lastScrollY.current = y;
        };
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
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

    // Fetch user location on mount
    useEffect(() => {
        if (locationFetched.current) return;
        locationFetched.current = true;

        const fetchLocation = async () => {
            try {
                const loc = await getCurrentLocation();
                if (loc) {
                    setLocation({ lat: loc.lat, lng: loc.lng });
                    triggerSmartLocationSync(loc.lat, loc.lng, loc.accuracy);
                } else {
                    setLocationError('Location access required for feed');
                }
            } catch (error) {
                console.error('Location error:', error);
                setLocationError('Failed to get location');
            }
        };

        fetchLocation();
    }, []);

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
    const [commentsTarget, setCommentsTarget] = useState<{ kind: 'post' | 'gossip'; id: string } | null>(null);
    const [commentsAnchor, setCommentsAnchor] = useState<{ left: number; width: number } | null>(null);
    const pinPost = usePinPost();

    const openCommentsFromElement = (target: { kind: 'post' | 'gossip'; id: string }, element: HTMLElement | null) => {
        if (element) {
            const rect = element.getBoundingClientRect();
            setCommentsAnchor({ left: rect.left, width: rect.width });
        } else {
            setCommentsAnchor(null);
        }
        setCommentsTarget(target);
    };

    // Flatten posts from all pages
    const posts: Post[] = useMemo(
        () =>
            feedData?.pages.flatMap((page: any) => page.content ?? page.data?.content ?? []) ?? [],
        [feedData?.pages],
    );

    // Fetch gossip posts for the same feed tab and merge into timeline
    const { data: gossipData } = useGossipList({ feedTab });
    const gossipPosts: GossipPost[] = useMemo(
        () => gossipData?.pages?.flatMap((page) => page?.gossip || []) ?? [],
        [gossipData?.pages],
    );

    // Merge and sort by createdAt descending
    type FeedItem = { _type: 'post'; data: Post } | { _type: 'gossip'; data: GossipPost };
    const mergedFeed: FeedItem[] = useMemo(
        () =>
            [
                ...posts.map((p): FeedItem => ({ _type: 'post', data: p })),
                ...gossipPosts.map((g): FeedItem => ({ _type: 'gossip', data: g })),
            ].sort((a, b) => {
                const dateA = new Date(a.data.createdAt || 0).getTime();
                const dateB = new Date(b.data.createdAt || 0).getTime();
                return dateB - dateA;
            }),
        [posts, gossipPosts],
    );
    const missedAlerts = feedData?.pages?.[0]?.meta?.missedAlerts ?? null;
    const placeContext = feedData?.pages?.[0]?.meta?.placeContext ?? null;

    /** Mixed marketplace / events / jobs when not using a content-type sidebar filter */
    const discoveryEnabled = !contentTypeFilter;
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
        <div className="relative flex h-screen w-full overflow-hidden text-white neu-base">
            {/* Left Sidebar */}
            <Suspense fallback={<div className="w-64" />}>
                <LeftSidebar />
            </Suspense>

            {/* Main scroll area: TopNav + Feed */}
            <main ref={mainRef} className="flex flex-1 flex-col overflow-y-auto scroll-smooth md:snap-y md:snap-proximity" onTouchStart={feedSwipe.onTouchStart} onTouchEnd={feedSwipe.onTouchEnd}>
                {/* Top Navigation — scrolls with content */}
                <TopNav />

                <div className="flex flex-col pb-20">
                        {/* Full-width ambient sky hero — pulled up behind the transparent TopNav */}
                        <div className="-mt-[60px]">
                          <FeedSkyHero />
                        </div>
                        <div className="px-4 flex flex-col gap-4 pt-3">
                            {/* Active content-type filter chip */}
                            {contentTypeFilter && (
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold mod-chip mod-chip-active text-primary">
                                        {t(`contentType.${contentTypeFilter}`)}
                                        <button
                                            onClick={() => router.replace('/feed')}
                                            className="ml-1 hover:opacity-70 transition-opacity"
                                            aria-label="Clear filter"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </span>
                                </div>
                            )}

                            {/* Feed Layer Selector */}
                            <FeedTabs
                                activeTab={feedTab}
                                onTabChange={(tab) => setFeedTab(tab)}
                            />

                            {feedTab === 'your_huud' && placeContext && (
                                <FrequentPlaceContextBanner context={placeContext} />
                            )}

                            {/* FYI Subtype Filter — only when FYI type active */}
                            {contentTypeFilter === 'fyi' && (
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {['all', 'safety_notice', 'lost_found', 'community_announcement', 'local_news', 'alert'].map(st => (
                                        <button key={st} onClick={() => setFyiSubtypeFilter(st === 'all' ? '' : st)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${fyiSubtypeFilter === (st === 'all' ? '' : st) ? 'mod-chip mod-chip-active text-primary' : 'mod-chip'}`}>
                                            {st === 'all' ? 'All' : st.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </button>
                                    ))}
                                </div>
                            )}

                        {missedAlerts && missedAlerts.count > 0 && (
                            <div className="mod-card rounded-2xl px-4 py-3 border border-brand-red/15">
                                <div className="flex items-start gap-3">
                                    <div className="mod-inset rounded-xl size-10 shrink-0 flex items-center justify-center text-brand-red">
                                        <span className="material-symbols-outlined text-xl">warning</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                                            {missedAlerts.count === 1
                                                ? 'You missed 1 nearby alert'
                                                : `You missed ${missedAlerts.count} nearby alerts`}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                                            Highest severity: {missedAlerts.highestSeverity}. Areas: {missedAlerts.lgas.join(', ')}.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading && <FeedSkeleton count={5} />}

                        {/* Error State */}
                        {isError && (
                            <div className="flex flex-col items-center justify-center py-12 px-5 mod-card rounded-2xl">
                                <div className="w-16 h-16 rounded-full mod-inset flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl text-brand-red">warning</span>
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
                        )}

                        {/* Empty State */}
                        {!isLoading && !isError && mergedFeed.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 px-5 mod-card rounded-2xl">
                                <div className="w-16 h-16 rounded-full mod-inset flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--neu-text-muted)' }}>inbox</span>
                                </div>
                                <p className="text-sm text-center" style={{ color: 'var(--neu-text-secondary)' }}>
                                    {t('feed.noPostsTitle')}
                                </p>
                                <p className="text-xs text-center mt-2" style={{ color: 'var(--neu-text-muted)' }}>
                                    {t('feed.noPostsSubtitle')}
                                </p>
                            </div>
                        )}
                        </div>

                        {/* Posts Feed — full width, outside px-4 container */}
                        <div
                            className="mt-3 flex flex-col gap-5 pb-4 md:items-center"
                            style={{
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015)), radial-gradient(circle at 50% 0%, rgba(0,111,53,0.12), transparent 34%)',
                                backdropFilter: 'blur(18px) saturate(150%)',
                                WebkitBackdropFilter: 'blur(18px) saturate(150%)',
                            }}
                        >
                            {timeline.map((item) => {
                                if (
                                    item._type === 'discovery_marketplace' ||
                                    item._type === 'discovery_event' ||
                                    item._type === 'discovery_job'
                                ) {
                                    return (
                                        <div
                                            key={item.key}
                                            className={
                                                item._type === 'discovery_marketplace'
                                                    ? 'w-full max-w-[min(640px,calc(100vw-1rem))] md:mx-auto md:max-w-[580px] md:snap-center'
                                                    : 'w-full md:max-w-[480px] md:snap-center'
                                            }
                                        >
                                            <FeedDiscoveryBlock
                                                item={item}
                                                userLocation={location}
                                                currentUserId={currentUserId}
                                            />
                                        </div>
                                    );
                                }
                                if (item._type === 'gossip') {
                                    const gossipId = item.data.id || item.data._id;
                                    return (
                                    <div
                                        key={`gossip-${gossipId}`}
                                        className="w-full md:max-w-[480px] md:snap-center"
                                        data-comment-anchor={`gossip-${gossipId}`}
                                    >
                                        <GossipCard
                                            post={item.data}
                                            onComment={(id) => {
                                                const el = document.querySelector(`[data-comment-anchor="gossip-${id}"]`) as HTMLElement | null;
                                                openCommentsFromElement({ kind: 'gossip', id }, el);
                                            }}
                                        />
                                    </div>
                                    );
                                }
                                const post = item.data;
                                if (post.contentType === 'fyi') {
                                    return (
                                        <div key={post.id} className="w-full md:max-w-[480px] md:snap-center" data-comment-anchor={`post-${post.id}`}>
                                            <FYICard
                                                post={post}
                                                currentUserId={currentUserId || undefined}
                                                onComment={(id) => {
                                                    const el = document.querySelector(`[data-comment-anchor="post-${id}"]`) as HTMLElement | null;
                                                    openCommentsFromElement({ kind: 'post', id }, el);
                                                }}
                                            />
                                        </div>
                                    );
                                }
                                if (post.contentType === 'help_request') {
                                    return (
                                        <div key={post.id} className="w-full md:max-w-[480px] md:snap-center" data-comment-anchor={`post-${post.id}`}>
                                            <HelpRequestCard
                                                post={post}
                                                onComment={(id) => {
                                                    const el = document.querySelector(`[data-comment-anchor="post-${id}"]`) as HTMLElement | null;
                                                    openCommentsFromElement({ kind: 'post', id }, el);
                                                }}
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
                                            onCardClick={() => openPostDetails(post.id)}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Load More Trigger */}
                        {hasNextPage && (
                            <div ref={loadMoreRef} className="flex justify-center py-4">
                                {isFetchingNextPage && (
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Sidebar */}
                <RightSidebar />

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden">
                <Suspense fallback={<div className="h-16" />}>
                    <BottomNav hidden={navHidden} />
                </Suspense>
            </div>

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={isCreatePostOpen}
                onClose={() => setIsCreatePostOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
                    queryClient.invalidateQueries({ queryKey: ['gossip'] });
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
