/**
 * Gossip Page
 * Anonymous community discussions with X.com-style layout
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/navigation/Sidebar';
import { RightSidebar } from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { GossipCard } from '@/components/gossip/GossipCard';
import { CreateGossipModal } from '@/components/gossip/CreateGossipModal';
import { gossipService } from '@/services/gossip.service';
import { GossipPost } from '@/types/gossip';

function GossipPageInner() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const queryClient = useQueryClient();

    // Listen for sidebar state changes
    useEffect(() => {
        const checkSidebarState = () => {
            const saved = localStorage.getItem('sidebar_collapsed');
            setSidebarCollapsed(saved === 'true');
        };

        checkSidebarState();
        window.addEventListener('storage', checkSidebarState);

        // Poll for changes
        const interval = setInterval(checkSidebarState, 500);

        return () => {
            window.removeEventListener('storage', checkSidebarState);
            clearInterval(interval);
        };
    }, []);

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

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
            {/* Sidebar (Desktop + Mobile Drawer) */}
            <Sidebar
                onCreatePost={() => setIsCreateModalOpen(true)}
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
            />

            {/* Right Sidebar - Desktop only */}
            <RightSidebar />

            {/* Main Content - Positioned next to left sidebar, with space for right sidebar */}
            <main className={`min-h-screen transition-all duration-300 border-x border-gray-200 dark:border-gray-800 w-full lg:max-w-[600px] ${sidebarCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[275px]'
                } xl:mr-[350px] 2xl:mr-[400px]`}>
                {/* Header */}
                <header className="sticky top-0 z-20 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between mb-3">
                            {/* Mobile: Hamburger Menu */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsMobileSidebarOpen(true)}
                                    className="lg:hidden w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                                    aria-label="Open menu"
                                >
                                    <i className="bi bi-list text-2xl" />
                                </button>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Gossip</h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Anonymous community discussions</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="lg:hidden w-10 h-10 bg-neon-green text-white rounded-full flex items-center justify-center hover:bg-neon-green/90 transition-colors"
                            >
                                <i className="bi bi-plus-lg text-xl" />
                            </button>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'general', label: 'General' },
                                { value: 'local_gist', label: 'Local Gist' },
                                { value: 'recommendation_request', label: 'Requests' },
                                { value: 'community_question', label: 'Questions' },
                                { value: 'cultural_discussion', label: 'Cultural' },
                                { value: 'business_inquiry', label: 'Business' },
                                { value: 'social_update', label: 'Social' },
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setFilterType(type.value)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === type.value
                                        ? 'bg-neon-green text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-neon-green border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading discussions...</p>
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <div className="flex flex-col items-center justify-center py-12 px-5">
                        <i className="bi bi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                        <p className="text-sm text-gray-800 dark:text-gray-200 text-center mb-2">
                            Failed to load discussions
                        </p>
                        {error && (
                            <p className="text-xs text-gray-500 text-center mb-2">
                                {error instanceof Error ? error.message : 'Unknown error'}
                            </p>
                        )}
                        <button
                            onClick={() => refetch()}
                            className="mt-2 px-6 py-2.5 bg-neon-green text-white rounded-full text-sm font-bold hover:bg-neon-green/90"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !isError && posts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-5">
                        <i className="bi bi-chat-dots text-4xl text-gray-300 dark:text-gray-700 mb-4"></i>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            No discussions yet
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-2 mb-4">
                            Be the first to start a conversation!
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-2.5 bg-neon-green text-white rounded-full text-sm font-bold hover:bg-neon-green/90"
                        >
                            Start Discussion
                        </button>
                    </div>
                )}

                {/* Gossip Feed */}
                <div>
                    {posts.map((post) => (
                        <GossipCard
                            key={post.id}
                            post={post}
                            onClick={() => {
                                // TODO: Navigate to gossip detail page
                                console.log('Open gossip:', post.id);
                            }}
                        />
                    ))}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden">
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
                <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                    <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <GossipPageInner />
        </Suspense>
    );
}
