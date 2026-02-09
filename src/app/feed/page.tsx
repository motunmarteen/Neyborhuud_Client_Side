'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
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

function Composer({ onOpenCreate }: { onOpenCreate: () => void }) {
    return (
        <div className="flex flex-col neu-card-sm rounded-2xl p-4">
            <div className="flex gap-4">
                <div className="neu-socket rounded-full size-12 shrink-0 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl">person</span>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                    <button
                        onClick={onOpenCreate}
                        className="w-full text-left resize-none overflow-hidden bg-transparent border-0 focus:ring-0 p-0 text-base cursor-pointer transition-colors pt-2"
                        style={{ color: 'var(--neu-text-muted)' }}
                    >
                        What&apos;s happening in your neighborhood?
                    </button>
                </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3">
                <div className="neu-divider absolute left-0 right-0" style={{ top: 0 }} />
                <div className="flex items-center gap-2">
                    <button onClick={onOpenCreate} className="flex items-center justify-center p-2 rounded-xl neu-btn transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] text-primary" title="Add Image">
                        <span className="material-symbols-outlined text-[20px]">image</span>
                    </button>
                    <button onClick={onOpenCreate} className="flex items-center justify-center p-2 rounded-xl neu-btn transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] text-primary" title="Add Video">
                        <span className="material-symbols-outlined text-[20px]">videocam</span>
                    </button>
                    <button onClick={onOpenCreate} className="flex items-center justify-center p-2 rounded-xl neu-btn transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] text-primary" title="Add Location">
                        <span className="material-symbols-outlined text-[20px]">location_on</span>
                    </button>
                </div>
                <button
                    onClick={onOpenCreate}
                    className="neu-btn rounded-xl py-2 px-6 text-sm font-bold transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
                    style={{ color: 'var(--neu-text)' }}
                >
                    POST
                </button>
            </div>
        </div>
    );
}

function XFeedInner() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [isPostDetailsOpen, setIsPostDetailsOpen] = useState(false);
    const [feedTab, setFeedTab] = useState<'for-you' | 'following'>('following');
    const locationFetched = useRef(false);
    const queryClient = useQueryClient();

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
        <div className="relative flex h-screen w-full flex-col overflow-hidden neu-base">
            {/* Top Navigation */}
            <TopNav />

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <LeftSidebar />

                {/* Main Feed */}
                <main className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="max-w-[680px] mx-auto flex flex-col gap-6 pb-20">
                        {/* Composer */}
                        <Composer onOpenCreate={() => setIsCreatePostOpen(true)} />

                        {/* Feed Tabs */}
                        <FeedTabs
                            activeTab={feedTab}
                            onTabChange={(tab) => setFeedTab(tab)}
                        />

                        {/* Loading State */}
                        {isLoading && <FeedSkeleton count={5} />}

                        {/* Error State */}
                        {isError && (
                            <div className="flex flex-col items-center justify-center py-12 px-5 neu-card-sm rounded-2xl">
                                <div className="w-16 h-16 rounded-full neu-socket flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl text-brand-red">warning</span>
                                </div>
                                <p className="text-sm text-center mb-2" style={{ color: 'var(--neu-text)' }}>
                                    {locationError || 'Failed to load feed'}
                                </p>
                                {error && (
                                    <p className="text-xs text-center mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                                        {error instanceof Error ? error.message : 'Unknown error'}
                                    </p>
                                )}
                                <button
                                    onClick={() => refetchFeed()}
                                    disabled={isRefetching}
                                    className="mt-2 px-6 py-2.5 neu-btn rounded-xl text-sm font-bold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]"
                                    style={{ color: 'var(--neu-text)' }}
                                >
                                    {isRefetching ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
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
                            <div className="flex flex-col items-center justify-center py-12 px-5 neu-card-sm rounded-2xl">
                                <div className="w-16 h-16 rounded-full neu-socket flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--neu-text-muted)' }}>inbox</span>
                                </div>
                                <p className="text-sm text-center" style={{ color: 'var(--neu-text-secondary)' }}>
                                    No posts found in your area
                                </p>
                                <p className="text-xs text-center mt-2" style={{ color: 'var(--neu-text-muted)' }}>
                                    Be the first to post something!
                                </p>
                            </div>
                        )}

                        {/* Posts Feed */}
                        <div className="flex flex-col gap-4">
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
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsCreatePostOpen(true)}
                className="fixed bottom-8 right-8 md:bottom-10 md:right-10 z-40 neu-fab rounded-2xl p-4 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
            >
                <span className="material-symbols-outlined text-2xl text-primary">edit_square</span>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--neu-text)' }}>New Post</span>
            </button>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden">
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
            <div className="min-h-screen flex items-center justify-center neu-base">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" aria-hidden />
            </div>
        }>
            <XFeedInner />
        </Suspense>
    );
}
