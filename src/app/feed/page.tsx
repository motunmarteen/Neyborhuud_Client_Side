'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/navigation/Sidebar';
import { RightSidebar } from '@/components/navigation/RightSidebar';
import { FeedTabs } from '@/components/feed/FeedTabs';
import { XPostCard } from '@/components/feed/XPostCard';
import { FeedSkeleton } from '@/components/feed/PostSkeleton';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { BottomNav } from '@/components/feed/BottomNav';
import { PostDetailsModal } from '@/components/feed/PostDetailsModal';
import { useLocationFeed, usePostMutations } from '@/hooks/usePosts';
import { getCurrentLocation } from '@/lib/geolocation';
import { Post } from '@/types/api';
import { useInView } from 'react-intersection-observer';
import { useQueryClient } from '@tanstack/react-query';

function XFeedInner() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [isPostDetailsOpen, setIsPostDetailsOpen] = useState(false);
    const [feedTab, setFeedTab] = useState<'for-you' | 'following'>('following');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const locationFetched = useRef(false);
    const queryClient = useQueryClient();

    // Listen for sidebar state changes
    useEffect(() => {
        const checkSidebarState = () => {
            const saved = localStorage.getItem('sidebar_collapsed');
            setSidebarCollapsed(saved === 'true');
        };

        checkSidebarState();
        window.addEventListener('storage', checkSidebarState);

        // Poll for changes (in case storage event doesn't fire)
        const interval = setInterval(checkSidebarState, 500);

        return () => {
            window.removeEventListener('storage', checkSidebarState);
            clearInterval(interval);
        };
    }, []);

    // Fetch user location on mount
    useEffect(() => {
        if (locationFetched.current) return;
        locationFetched.current = true;

        const fetchLocation = async () => {
            try {
                const loc = await getCurrentLocation();
                if (loc) {
                    setLocation({ lat: loc.lat, lng: loc.lng });
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

    // Fetch feed with location - tab determines ranked mode
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
        ranked: feedTab === 'for-you',
    });

    // Post mutations
    const { likePost, unlikePost, savePost, unsavePost } = usePostMutations();

    // Flatten posts from all pages
    const posts: Post[] =
        feedData?.pages.flatMap((page: any) => page.content ?? page.data?.content ?? []) ?? [];

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

    const openPostDetails = (postId: string) => {
        setSelectedPostId(postId);
        setIsPostDetailsOpen(true);
    };

    // Helper to format time ago
    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
            {/* Sidebar (Desktop + Mobile Drawer) */}
            <Sidebar
                onCreatePost={() => setIsCreatePostOpen(true)}
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
            />

            {/* Right Sidebar - Desktop only */}
            <RightSidebar />

            {/* Main Content - Positioned next to left sidebar, with space for right sidebar */}
            <main className={`min-h-screen transition-all duration-300 border-x border-gray-200 dark:border-gray-800 w-full lg:max-w-[600px] ${sidebarCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[275px]'
                } xl:mr-[350px] 2xl:mr-[400px]`}>
                {/* Mobile Header */}
                <header className="sticky top-0 z-20 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 lg:hidden">
                    <div className="flex items-center justify-between px-4 h-14">
                        {/* Hamburger Menu Button */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                            aria-label="Open menu"
                        >
                            <i className="bi bi-list text-2xl" />
                        </button>
                        <img src="/icon.png" alt="NeyborHuud" className="w-8 h-8 rounded-lg" />
                        <button className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green to-brand-blue" />
                    </div>
                </header>

                {/* Feed Tabs */}
                <FeedTabs
                    activeTab={feedTab}
                    onTabChange={(tab) => setFeedTab(tab)}
                />

                {/* Loading State */}
                {isLoading && <FeedSkeleton count={5} />}

                {/* Error State */}
                {isError && (
                    <div className="flex flex-col items-center justify-center py-12 px-5">
                        <i className="bi bi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                        <p className="text-sm text-gray-800 dark:text-gray-200 text-center mb-2">
                            {locationError || 'Failed to load feed'}
                        </p>
                        {error && (
                            <p className="text-xs text-gray-500 text-center mb-2">
                                {error instanceof Error ? error.message : 'Unknown error'}
                            </p>
                        )}
                        <button
                            onClick={() => refetchFeed()}
                            disabled={isRefetching}
                            className="mt-2 px-6 py-2.5 bg-neon-green text-white rounded-full text-sm font-bold hover:bg-neon-green/90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isRefetching ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Retrying…
                                </>
                            ) : (
                                'Retry'
                            )}
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !isError && posts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-5">
                        <i className="bi bi-inbox text-4xl text-gray-300 dark:text-gray-700 mb-4"></i>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            No posts found in your area
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-2">
                            Be the first to post something!
                        </p>
                    </div>
                )}

                {/* Posts Feed */}
                <div>
                    {posts.map((post) => (
                        <XPostCard
                            key={post.id}
                            post={post}
                            onLike={() => handleLike(post)}
                            onComment={() => openPostDetails(post.id)}
                            onShare={() => { }}
                            onSave={() => handleSave(post)}
                            formatTimeAgo={formatTimeAgo}
                            onCardClick={() => openPostDetails(post.id)}
                        />
                    ))}
                </div>

                {/* Load More Trigger */}
                {hasNextPage && (
                    <div ref={loadMoreRef} className="flex justify-center py-4 border-b border-gray-200 dark:border-gray-800">
                        {isFetchingNextPage && (
                            <div className="w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full animate-spin"></div>
                        )}
                    </div>
                )}
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden">
                <BottomNav onCreatePost={() => setIsCreatePostOpen(true)} />
            </div>

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={isCreatePostOpen}
                onClose={() => setIsCreatePostOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
                }}
            />

            {/* Post Details Modal */}
            <PostDetailsModal
                postId={selectedPostId}
                isOpen={isPostDetailsOpen}
                onClose={() => setIsPostDetailsOpen(false)}
            />
        </div>
    );
}

export default function XFeed() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" aria-hidden />
            </div>
        }>
            <XFeedInner />
        </Suspense>
    );
}
