/**
 * Gossip Page
 * Anonymous community discussions with unified feed tab layout
 */

'use client';

import { useState, useCallback, useRef, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { FeedTabs } from '@/components/feed/FeedTabs';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { GossipCard } from '@/components/gossip/GossipCard';
import { useGossipList } from '@/hooks/useGossip';
import { useAuth } from '@/hooks/useAuth';
import { GossipPost } from '@/types/gossip';
import { FeedTab } from '@/types/api';

function GossipPageInner() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [feedTab, setFeedTab] = useState<FeedTab>('your_huud');
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const observerRef = useRef<IntersectionObserver | null>(null);

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useGossipList({ feedTab });

    const posts: GossipPost[] = data?.pages?.flatMap((page) => page?.gossip || []) || [];

    const handleCreateSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['gossip'] });
    };

    // Infinite scroll sentinel
    const lastPostRef = useCallback(
        (node: HTMLElement | null) => {
            if (isFetchingNextPage) return;
            if (observerRef.current) observerRef.current.disconnect();
            observerRef.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasNextPage) {
                    fetchNextPage();
                }
            });
            if (node) observerRef.current.observe(node);
        },
        [isFetchingNextPage, hasNextPage, fetchNextPage],
    );

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden">
            <TopNav />

            <div className="flex flex-1 overflow-hidden">
                <LeftSidebar />

                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-[680px] mx-auto flex flex-col pb-20">
                        {/* Page Header */}
                        <div className="flex items-center justify-between px-4 pt-6 pb-3">
                            <div>
                                <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>Local News</h1>
                                <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Anonymous community discussions</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="neu-fab w-10 h-10 rounded-2xl flex items-center justify-center text-primary transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-xl">add</span>
                            </button>
                        </div>

                        {/* Feed Tabs — same as main Feed page */}
                        <FeedTabs activeTab={feedTab} onTabChange={setFeedTab} />

                        <div className="px-4 pt-4 flex flex-col gap-4">
                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm mt-4" style={{ color: 'var(--neu-text-muted)' }}>Loading discussions...</p>
                            </div>
                        )}

                        {/* Error State */}
                        {isError && (
                            <div className="neu-card-sm rounded-2xl flex flex-col items-center justify-center py-12 px-5">
                                <div className="w-14 h-14 neu-socket rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl text-red-400">warning</span>
                                </div>
                                <p className="text-sm text-center mb-2" style={{ color: 'var(--neu-text)' }}>
                                    Failed to load discussions
                                </p>
                                {error && (
                                    <p className="text-xs text-center mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                                        {error instanceof Error ? error.message : 'Unknown error'}
                                    </p>
                                )}
                                <button
                                    onClick={() => refetch()}
                                    className="mt-2 px-6 py-2.5 neu-btn rounded-2xl text-sm font-bold text-primary transition-all"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && !isError && posts.length === 0 && (
                            <div className="neu-card-sm rounded-2xl flex flex-col items-center justify-center py-12 px-5">
                                <div className="w-14 h-14 neu-socket rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl opacity-40" style={{ color: 'var(--neu-text-muted)' }}>chat_bubble_outline</span>
                                </div>
                                <p className="text-sm text-center" style={{ color: 'var(--neu-text)' }}>
                                    No discussions yet
                                </p>
                                <p className="text-xs text-center mt-2 mb-4" style={{ color: 'var(--neu-text-muted)' }}>
                                    Be the first to start a conversation!
                                </p>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="px-6 py-2.5 neu-btn-active rounded-2xl text-sm font-bold text-primary transition-all"
                                >
                                    Start Discussion
                                </button>
                            </div>
                        )}

                        {/* Gossip Feed */}
                        <div className="flex flex-col gap-4">
                            {posts.map((post, index) => {
                                const postId = post.id || post._id || `${index}`;
                                const isLast = index === posts.length - 1;
                                return (
                                    <div key={postId} ref={isLast ? lastPostRef : undefined}>
                                        <GossipCard
                                            post={post}
                                            currentUserId={user?.id}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Loading more indicator */}
                        {isFetchingNextPage && (
                            <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        </div>
                    </div>
                </main>

                <RightSidebar />
            </div>

            <div className="md:hidden">
                <BottomNav />
            </div>

            {/* Gossip-locked post creation modal */}
            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                defaultContentType="gossip"
                lockContentType={true}
            />
        </div>
    );
}

export default function GossipPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen neu-base flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <GossipPageInner />
        </Suspense>
    );
}
