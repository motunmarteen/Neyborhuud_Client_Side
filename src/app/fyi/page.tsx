/**
 * FYI Bulletin Page
 * Community bulletins with unified feed tab layout — mirrors Gossip page architecture.
 */

'use client';

import { useState, useCallback, useRef, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { FYISubtypeTabs, FYISubtype } from '@/components/fyi/FYISubtypeTabs';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { FYICard } from '@/components/fyi/FYICard';
import { useFYIList } from '@/hooks/useFYI';
import { useAuth } from '@/hooks/useAuth';
import { Post } from '@/types/api';

function FYIPageInner() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [subtypeFilter, setSubtypeFilter] = useState<FYISubtype>('');
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
    } = useFYIList({ type: subtypeFilter || undefined });

    const posts: Post[] = data?.pages?.flatMap((page) => page?.fyi || []) || [];

    const handleCreateSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['fyi'] });
        queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
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
                <Suspense fallback={<div className="w-64" />}>
                    <LeftSidebar />
                </Suspense>

                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-[680px] mx-auto flex flex-col pb-20">
                        {/* Page Header */}
                        <div className="flex items-center justify-between px-4 pt-6 pb-3">
                            <div>
                                <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>FYI Bulletins</h1>
                                <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Community announcements & notices</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="neu-fab w-10 h-10 rounded-2xl flex items-center justify-center text-primary transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-xl">add</span>
                            </button>
                        </div>

                        {/* Subtype Tabs */}
                        <FYISubtypeTabs activeSubtype={subtypeFilter} onSubtypeChange={setSubtypeFilter} />

                        <div className="px-4 pt-4 flex flex-col gap-4">
                            {/* Loading State */}
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm mt-4" style={{ color: 'var(--neu-text-muted)' }}>Loading bulletins...</p>
                                </div>
                            )}

                            {/* Error State */}
                            {isError && (
                                <div className="neu-card-sm rounded-2xl flex flex-col items-center justify-center py-12 px-5">
                                    <div className="w-14 h-14 neu-socket rounded-full flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-3xl text-red-400">warning</span>
                                    </div>
                                    <p className="text-sm text-center mb-2" style={{ color: 'var(--neu-text)' }}>
                                        Failed to load bulletins
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
                                        <span className="material-symbols-outlined text-3xl opacity-40" style={{ color: 'var(--neu-text-muted)' }}>campaign</span>
                                    </div>
                                    <p className="text-sm text-center" style={{ color: 'var(--neu-text)' }}>
                                        No bulletins yet
                                    </p>
                                    <p className="text-xs text-center mt-2 mb-4" style={{ color: 'var(--neu-text-muted)' }}>
                                        Be the first to share a community announcement!
                                    </p>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="px-6 py-2.5 neu-btn-active rounded-2xl text-sm font-bold text-primary transition-all"
                                    >
                                        Post Bulletin
                                    </button>
                                </div>
                            )}

                            {/* FYI Feed */}
                            <div className="flex flex-col gap-4">
                                {posts.map((post, index) => {
                                    const postId = post.id || `${index}`;
                                    const isLast = index === posts.length - 1;
                                    return (
                                        <div key={postId} ref={isLast ? lastPostRef : undefined}>
                                            <FYICard
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
                <Suspense fallback={<div className="h-16" />}>
                    <BottomNav />
                </Suspense>
            </div>

            {/* FYI post creation modal — locked to FYI type, subtype follows active tab */}
            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                defaultContentType="fyi"
                lockContentType={true}
                defaultFyiSubtype={subtypeFilter || undefined}
            />
        </div>
    );
}

export default function FYIPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen neu-base flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <FYIPageInner />
        </Suspense>
    );
}
