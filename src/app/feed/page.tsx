'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NeumorphicCard } from '@/components/ui/PremiumCards';
import { StackedGallery } from '@/components/feed/StackedGallery';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { useLocationFeed, usePostMutations } from '@/hooks/usePosts';
import { useComments, useCommentMutations } from '@/hooks/useComments';
import { getCurrentLocation } from '@/lib/geolocation';
import { Post } from '@/types/api';
import { useInView } from 'react-intersection-observer';
import { useQueryClient } from '@tanstack/react-query';

export default function FortressFeed() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
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

    // Fetch feed with location
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
        category: selectedCategory,
    });

    // Post mutations
    const { likePost, unlikePost, savePost, unsavePost } = usePostMutations();

    // Flatten posts from all pages – backend returns response.data.content (or res.data.content)
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

    // Toggle comments section
    const toggleComments = (postId: string) => {
        setExpandedComments((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
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

    // Helper to get category from post (map API types to UI categories)
    const getPostCategory = (post: Post): string => {
        // Check if post has tags that indicate category
        if (post.tags?.some((tag) => tag.toLowerCase().includes('safety'))) return 'SAFETY';
        if (post.tags?.some((tag) => tag.toLowerCase().includes('event'))) return 'EVENT';
        if (post.tags?.some((tag) => tag.toLowerCase().includes('marketplace'))) return 'MARKETPLACE';
        if (post.tags?.some((tag) => tag.toLowerCase().includes('bulletin'))) return 'BULLETIN';
        // Default based on post type
        if (post.type === 'event') return 'EVENT';
        return 'BULLETIN';
    };


    // Get post type for rendering (media can be URLs or media items)
    const getPostType = (post: Post): 'TWEET' | 'INSTA' | 'GALLERY' => {
        const mediaUrls = getMediaUrls(post.media);
        if (mediaUrls.length > 1) return 'GALLERY';
        if (mediaUrls.length === 1) return 'INSTA';
        return 'TWEET';
    };

    // Mock Data for "Statuses" (Instagram Stories) - Keep for now
    const statuses = [
        { id: 0, user: "You", img: "https://i.pravatar.cc/100?u=me", isLive: false },
        { id: 1, user: "Sarah", img: "https://i.pravatar.cc/100?u=sarah", isLive: true },
        { id: 2, user: "Mike", img: "https://i.pravatar.cc/100?u=mike", isLive: false },
        { id: 3, user: "Tunde", img: "https://i.pravatar.cc/100?u=tunde", isLive: false },
        { id: 4, user: "Aisha", img: "https://i.pravatar.cc/100?u=aisha", isLive: true },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground animate-in fade-in duration-700 overflow-x-hidden">
            {/* Mobile-First Header: Optimized Height */}
            <header className="fixed top-0 w-full z-50 glass px-5 py-4 flex justify-between items-center border-b border-charcoal/5">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 overflow-hidden rounded-xl shadow-lg border-2 border-white p-1 bg-white">
                        <img
                            src="/icon.png"
                            alt="NeyborHuud Logo"
                            className="w-full h-full object-cover rounded-lg"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-light tracking-tighter leading-none uppercase text-charcoal">
                            SURULERE<span className="text-neon-green">CORE</span>
                        </span>
                        <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${location ? 'bg-neon-green animate-pulse' : 'bg-charcoal/30'} animate-pulse`}></span>
                            <span className="text-[8px] font-light tracking-[0.2em] text-charcoal/50 uppercase">
                                {location ? 'LIVE FEED' : 'LOADING...'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-xl glass flex items-center justify-center text-charcoal active:scale-95 transition-all">
                        <i className="bi bi-search text-lg"></i>
                    </button>
                    <button className="relative w-10 h-10 rounded-xl glass flex items-center justify-center text-charcoal active:scale-95 transition-all">
                        <div className="absolute top-2 right-2 w-2 h-2 bg-brand-red rounded-full border border-white"></div>
                        <i className="bi bi-bell-fill text-lg"></i>
                    </button>
                </div>
            </header>

            <main className="flex-grow pt-28 pb-32 max-w-md mx-auto w-full flex flex-col gap-8">
                {/* Category Filters */}
                <div className="flex gap-2 px-5 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory(undefined)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                            !selectedCategory
                                ? 'bg-neon-green text-white'
                                : 'bg-white/50 text-charcoal/60 hover:bg-white/70'
                        }`}
                    >
                        All
                    </button>
                    {['SAFETY', 'EVENT', 'MARKETPLACE', 'BULLETIN'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                selectedCategory === cat
                                    ? 'bg-neon-green text-white'
                                    : 'bg-white/50 text-charcoal/60 hover:bg-white/70'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Status Reel (Instagram Stories) */}
                <div className="w-full overflow-x-auto no-scrollbar flex gap-4 pb-2 pl-5">
                    <div className="flex flex-col items-center gap-2 flex-shrink-0 group">
                        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center border border-dashed border-charcoal/30 text-charcoal/40 active:scale-95 transition-all">
                            <i className="bi bi-plus-lg text-2xl"></i>
                        </div>
                        <span className="text-[9px] font-light uppercase tracking-tight text-charcoal/50">Add</span>
                    </div>
                    {statuses.map((status) => (
                        <div key={status.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group active:scale-95 transition-all">
                            <div className={`w-16 h-16 rounded-2xl p-[3px] transition-all duration-300 ${status.isLive ? 'bg-gradient-to-tr from-brand-blue to-neon-green shadow-lg' : 'border border-white/60 glass'}`}>
                                <div className="w-full h-full rounded-[0.8rem] overflow-hidden bg-white border-2 border-white">
                                    <img src={status.img} alt={status.user} className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <span className="text-[9px] font-light uppercase tracking-tight text-charcoal/60">{status.user}</span>
                        </div>
                    ))}
                    <div className="w-1 flex-shrink-0"></div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-neon-green border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-charcoal/60 mt-4">Loading feed...</p>
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <div className="flex flex-col items-center justify-center py-12 px-5">
                        <i className="bi bi-exclamation-triangle text-4xl text-brand-red mb-4"></i>
                        <p className="text-sm text-charcoal/80 text-center mb-2">
                            {locationError || 'Failed to load feed'}
                        </p>
                        {error && (
                            <p className="text-xs text-charcoal/50 text-center mb-2">
                                {error instanceof Error ? error.message : 'Unknown error'}
                            </p>
                        )}
                        <p className="text-xs text-charcoal/40 text-center mb-4">
                            Tap Retry to try again. If the problem continues, check your connection.
                        </p>
                        <button
                            onClick={() => refetchFeed()}
                            disabled={isRefetching}
                            className="mt-2 px-6 py-2.5 bg-neon-green text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neon-green/90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
                        <i className="bi bi-inbox text-4xl text-charcoal/30 mb-4"></i>
                        <p className="text-sm text-charcoal/60 text-center">
                            No posts found in your area
                        </p>
                        <p className="text-xs text-charcoal/40 text-center mt-2">
                            Be the first to post something!
                        </p>
                    </div>
                )}

                {/* Hybrid Feed Stream */}
                <div className="flex flex-col gap-6">
                    {posts.map((post) => {
                        const category = getPostCategory(post);
                        const styles = getCategoryStyles(category);
                        const postType = getPostType(post);
                        const isCommentsOpen = expandedComments.has(post.id);

                        return (
                            <PostCard
                                key={post.id}
                                post={post}
                                category={category}
                                styles={styles}
                                postType={postType}
                                formatTimeAgo={formatTimeAgo}
                                isCommentsOpen={isCommentsOpen}
                                commentInput={commentInputs[post.id] || ''}
                                onLike={() => handleLike(post)}
                                onSave={() => handleSave(post)}
                                onToggleComments={() => toggleComments(post.id)}
                                onCommentInputChange={(value) =>
                                    setCommentInputs((prev) => ({ ...prev, [post.id]: value }))
                                }
                            />
                        );
                    })}
                </div>

                {/* Load More Trigger */}
                {hasNextPage && (
                    <div ref={loadMoreRef} className="flex justify-center py-4">
                        {isFetchingNextPage && (
                            <div className="w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full animate-spin"></div>
                        )}
                    </div>
                )}
            </main>

            {/* Mobile Bottom Nav: Native Ergonomics */}
            <nav className="fixed bottom-6 left-6 right-6 z-50">
                <div className="glass border border-white/60 p-3 flex justify-between items-center rounded-[2rem] shadow-2xl backdrop-blur-3xl px-8">
                    <div className="text-neon-green flex flex-col items-center cursor-pointer">
                        <i className="bi bi-grid-fill text-2xl"></i>
                    </div>

                    {/* Center Call to Action */}
                    <button
                        onClick={() => setIsCreatePostOpen(true)}
                        className="w-14 h-14 rounded-full bg-brand-red flex items-center justify-center text-white shadow-xl -translate-y-6 border-[6px] border-background active:scale-90 transition-all cursor-pointer hover:bg-brand-red/90"
                    >
                        <i className="bi bi-megaphone-fill text-xl"></i>
                    </button>

                    <div className="text-charcoal/20 flex flex-col items-center cursor-pointer hover:text-charcoal/60 transition-colors">
                        <i className="bi bi-person-fill text-2xl"></i>
                    </div>
                </div>
            </nav>

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={isCreatePostOpen}
                onClose={() => setIsCreatePostOpen(false)}
                onSuccess={() => {
                    // Refresh feed after successful post creation
                    queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
                }}
            />
        </div>
    );
}

// Backend returns author with id, name, username, avatarUrl (same shape for feed and create-post)
function getAuthorDisplayName(author: Post['author'] | undefined): string {
    if (!author) return 'Anonymous';
    if ('name' in author && author.name) return author.name;
    if ('firstName' in author && 'lastName' in author) {
        const first = (author as any).firstName;
        const last = (author as any).lastName;
        if (first || last) return [first, last].filter(Boolean).join(' ').trim();
    }
    return (author as any).username || 'Anonymous';
}

function getAuthorAvatar(author: Post['author'] | undefined): string {
    if (!author) return 'https://i.pravatar.cc/100?u=user';
    if ('avatarUrl' in author && author.avatarUrl) return author.avatarUrl;
    return (author as any).profilePicture || 'https://i.pravatar.cc/100?u=user';
}

// Backend returns media as array of image URLs (strings) or media items with url
function getMediaUrls(media: Post['media'] | undefined): string[] {
    if (!media || !Array.isArray(media)) return [];
    return media.map((m) => (typeof m === 'string' ? m : m.url));
}

// Helper to get styles based on category (moved outside component)
const getCategoryStyles = (category: string) => {
    switch (category) {
        case 'SAFETY':
            return {
                border: 'border-brand-red/30',
                bg: 'bg-brand-red/5',
                badge: 'text-brand-red bg-brand-red/10 border-brand-red/20',
                icon: 'bi-exclamation-triangle-fill'
            };
        case 'MARKETPLACE':
            return {
                border: 'border-brand-blue/30',
                bg: 'bg-brand-blue/5',
                badge: 'text-brand-blue bg-brand-blue/10 border-brand-blue/20',
                icon: 'bi-shop'
            };
        case 'EVENT':
            return {
                border: 'border-neon-green/30',
                bg: 'bg-neon-green/5',
                badge: 'text-neon-green bg-neon-green/10 border-neon-green/20',
                icon: 'bi-calendar-event-fill'
            };
        default: // BULLETIN
            return {
                border: 'border-deep-text/10',
                bg: 'bg-transparent',
                badge: 'text-deep-text/60 bg-deep-text/5 border-deep-text/10',
                icon: 'bi-pin-angle-fill'
            };
    }
};

// Post Card Component
function PostCard({
    post,
    category,
    styles,
    postType,
    formatTimeAgo,
    isCommentsOpen,
    commentInput,
    onLike,
    onSave,
    onToggleComments,
    onCommentInputChange,
}: {
    post: Post;
    category: string;
    styles: ReturnType<typeof getCategoryStyles>;
    postType: 'TWEET' | 'INSTA' | 'GALLERY';
    formatTimeAgo: (date: string) => string;
    isCommentsOpen: boolean;
    commentInput: string;
    onLike: () => void;
    onSave: () => void;
    onToggleComments: () => void;
    onCommentInputChange: (value: string) => void;
}) {
    const { data: commentsData, isLoading: commentsLoading } = useComments(
        isCommentsOpen ? post.id : null
    );
    const { createComment, isCreating } = useCommentMutations(post.id);

    const comments = commentsData?.pages.flatMap((page) => page.data?.data || []) || [];

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentInput.trim()) return;

        try {
            await createComment({ content: commentInput.trim() });
            onCommentInputChange('');
        } catch (error) {
            console.error('Comment error:', error);
        }
    };

    return (
        <NeumorphicCard
            className={`flex flex-col gap-0 border border-white/40 overflow-hidden p-0 rounded-none bg-white shadow-[0_4px_30px_rgba(0,255,42,0.1)] hover:shadow-[0_4px_30px_rgba(0,255,42,0.2)] transition-shadow duration-500`}
        >
            {/* Header (UserInfo) – backend: author.id, author.name, author.username, author.avatarUrl */}
            <div className="flex justify-between items-start p-6 pb-2">
                <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md border border-white">
                        <img
                            src={getAuthorAvatar(post.author)}
                            alt={getAuthorDisplayName(post.author)}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                        <span className="text-sm font-black italic uppercase text-charcoal leading-none tracking-tight">
                            {getAuthorDisplayName(post.author)}
                        </span>
                            {/* Add verified check if needed */}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-charcoal/40 uppercase tracking-widest mt-0.5">
                            <span>@{(post.author as any)?.username || 'user'}</span>
                            <span className="w-1 h-1 rounded-full bg-charcoal/20"></span>
                            <span>{formatTimeAgo(post.createdAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Meta & Badge */}
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${styles.badge}`}>
                        <i className={`bi ${styles.icon} text-[9px]`}></i>
                        <span className="text-[7px] font-black uppercase tracking-widest">{category}</span>
                    </div>
                    <div className="flex items-center gap-1 text-charcoal/30">
                        <i className="bi bi-bar-chart-fill text-[10px]"></i>
                        <span className="text-[9px] font-light">
                            {post.views >= 1000 ? (post.views / 1000).toFixed(1) + 'k' : post.views}
                        </span>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            {postType === 'TWEET' && (
                <div className="px-6 pb-2">
                    <p className="text-sm font-light text-charcoal/80 leading-relaxed">
                        {post.content}
                    </p>
                </div>
            )}

            {postType === 'INSTA' && (() => {
                const urls = getMediaUrls(post.media);
                return urls[0] ? (
                <div className="flex flex-col gap-4">
                    <div className="w-full h-80 overflow-hidden bg-charcoal/5 relative">
                        <img
                            src={urls[0]}
                            alt="Post content"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <p className="text-sm font-light text-charcoal/80 leading-relaxed px-6">
                        <span className="font-light text-charcoal mr-2 uppercase">
                            @{(post.author as any)?.username || 'user'}
                        </span>
                        {post.content}
                    </p>
                </div>
                ) : null;
            })()}

            {postType === 'GALLERY' && (() => {
                const urls = getMediaUrls(post.media);
                return urls.length > 0 ? (
                <div className="flex flex-col gap-1">
                    <StackedGallery images={urls} />
                    <p className="text-sm font-light text-charcoal/80 leading-relaxed px-6">
                        <span className="font-light text-charcoal mr-2 uppercase">
                            @{(post.author as any)?.username || 'user'}
                        </span>
                        {post.content}
                    </p>
                </div>
                ) : null;
            })()}

            {/* Interactions Footer */}
            <div className="p-6 pt-4 mt-2">
                {/* Primary Actions Row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-4">
                        {/* Like */}
                        <button
                            onClick={onLike}
                            className={`flex items-center gap-1.5 active:scale-90 transition-all ${
                                post.isLiked || post.likes > 100
                                    ? 'text-neon-green'
                                    : 'text-charcoal/40 hover:text-charcoal'
                            }`}
                        >
                            <i className={`bi bi-heart${post.isLiked ? '-fill' : ''} text-lg`}></i>
                            <span className="text-xs font-light">{post.likes || 0}</span>
                        </button>

                        {/* Comment */}
                        <button
                            onClick={onToggleComments}
                            className="flex items-center gap-1.5 text-charcoal/40 hover:text-charcoal active:scale-90 transition-all"
                        >
                            <i className="bi bi-chat text-lg"></i>
                            <span className="text-xs font-light">{post.comments || 0}</span>
                        </button>

                        {/* Share */}
                        <button className="flex items-center gap-1.5 text-charcoal/40 hover:text-charcoal active:scale-90 transition-all">
                            <i className="bi bi-arrow-repeat text-xl"></i>
                            <span className="text-xs font-light">{post.shares || 0}</span>
                        </button>
                    </div>

                    {/* External Share & Save */}
                    <div className="flex gap-4">
                        <button
                            className="text-charcoal/40 hover:text-charcoal active:scale-90 transition-all"
                            title="Share Externally"
                        >
                            <i className="bi bi-share-fill text-lg"></i>
                        </button>
                        <button
                            onClick={onSave}
                            className={`active:scale-90 transition-all ${
                                post.isSaved ? 'text-neon-green' : 'text-charcoal/40 hover:text-charcoal'
                            }`}
                            title="Save"
                        >
                            <i className={`bi bi-bookmark${post.isSaved ? '-fill' : ''} text-lg`}></i>
                        </button>
                    </div>
                </div>

                {/* Comments Section */}
                {isCommentsOpen && (
                    <div className="border-t border-charcoal/5 pt-4 mt-4">
                        {commentsLoading ? (
                            <div className="flex justify-center py-4">
                                <div className="w-5 h-5 border-2 border-neon-green border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto mb-4">
                                    {comments.length === 0 ? (
                                        <p className="text-xs text-charcoal/50 text-center py-4">
                                            No comments yet. Be the first!
                                        </p>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} className="flex gap-2">
                                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={getAuthorAvatar(comment.author as Post['author'])}
                                                        alt={getAuthorDisplayName(comment.author as Post['author'])}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-charcoal/5 rounded-lg p-2">
                                                        <p className="text-xs font-bold text-charcoal">
                                                            {getAuthorDisplayName(comment.author as Post['author'])}
                                                        </p>
                                                        <p className="text-xs text-charcoal/80 mt-1">
                                                            {comment.content}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 px-2">
                                                        <span className="text-[10px] text-charcoal/40">
                                                            {formatTimeAgo(comment.createdAt)}
                                                        </span>
                                                        <button className="text-[10px] text-charcoal/40 hover:text-charcoal">
                                                            Like ({comment.likes || 0})
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <form onSubmit={handleSubmitComment} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={commentInput}
                                        onChange={(e) => onCommentInputChange(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="flex-1 px-3 py-2 bg-charcoal/5 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-neon-green/50"
                                        disabled={isCreating}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!commentInput.trim() || isCreating}
                                        className="px-4 py-2 bg-neon-green text-white rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCreating ? '...' : 'Post'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                )}
            </div>
        </NeumorphicCard>
    );
}
