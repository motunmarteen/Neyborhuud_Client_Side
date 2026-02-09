/**
 * Gossip Page
 * Anonymous community discussions with Stitch dark-green layout
 */

'use client';

import { useState, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { GossipCard } from '@/components/gossip/GossipCard';
import { CreateGossipModal } from '@/components/gossip/CreateGossipModal';
import { gossipService } from '@/services/gossip.service';
import { GossipPost } from '@/types/gossip';

function GossipPageInner() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const queryClient = useQueryClient();

    // Fetch gossip posts
    const {
        data: gossipData,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['gossip', filterType],
        queryFn: async () => {
            const filters = filterType !== 'all' ? { type: filterType } : {};
            const response = await gossipService.listGossip(filters);
            return response.data?.gossip || [];
        },
    });

    const posts: GossipPost[] = gossipData || [];

    const handleCreateSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['gossip'] });
    };

    const filterTabs = [
        { value: 'all', label: 'All' },
        { value: 'general', label: 'General' },
        { value: 'local_gist', label: 'Local Gist' },
        { value: 'recommendation_request', label: 'Requests' },
        { value: 'community_question', label: 'Questions' },
        { value: 'cultural_discussion', label: 'Cultural' },
        { value: 'business_inquiry', label: 'Business' },
        { value: 'social_update', label: 'Social' },
    ];

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden">
            {/* Top Navigation */}
            <TopNav />

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <LeftSidebar />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="max-w-[680px] mx-auto flex flex-col gap-4 pb-20">
                        {/* Page Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>Gossip</h1>
                                <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Anonymous community discussions</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="neu-fab w-10 h-10 rounded-2xl flex items-center justify-center text-primary transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-xl">add</span>
                            </button>
                        </div>

                        {/* Filter Tabs */}
                        <div className="neu-socket rounded-2xl p-1.5 flex gap-1 overflow-x-auto no-scrollbar">
                            {filterTabs.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setFilterType(type.value)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                        filterType === type.value
                                            ? 'neu-card-sm text-primary'
                                            : ''
                                    }`}
                                    style={filterType !== type.value ? { color: 'var(--neu-text-muted)' } : undefined}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

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
                            {posts.map((post) => (
                                <GossipCard
                                    key={post.id}
                                    post={post}
                                    onClick={() => {
                                        console.log('Open gossip:', post.id);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </main>

                {/* Right Sidebar */}
                <RightSidebar />
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden">
                <BottomNav onCreatePost={() => setIsCreateModalOpen(true)} />
            </div>

            {/* Create Gossip Modal */}
            <CreateGossipModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
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
