/**
 * GossipCard Component
 * Neighbourhood discussion card — designed for community gossip, local gist, and cultural discussions.
 */

'use client';

import { GossipPost, DISCUSSION_TYPE_LABELS, DiscussionType } from '@/types/gossip';
import { formatTimeAgo } from '@/utils/timeAgo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MapPinAvatar from '@/components/ui/MapPinAvatar';
import { gossipService } from '@/services/gossip.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface GossipCardProps {
    post: GossipPost;
    currentUserId?: string;
}

const TYPE_META: Record<string, { color: string; icon: string }> = {
    safety:                  { color: 'bg-red-500/15 text-red-400 border border-red-500/20',    icon: 'warning' },
    cultural_discussion:     { color: 'bg-amber-500/15 text-amber-400 border border-amber-500/20', icon: 'public' },
    local_gist:              { color: 'bg-green-500/15 text-green-400 border border-green-500/20',  icon: 'chat' },
    community_question:      { color: 'bg-purple-500/15 text-purple-400 border border-purple-500/20', icon: 'help' },
    recommendation_request:  { color: 'bg-purple-500/15 text-purple-400 border border-purple-500/20', icon: 'thumb_up' },
    business_inquiry:        { color: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',  icon: 'storefront' },
    social_update:           { color: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',  icon: 'celebration' },
    general:                 { color: 'bg-white/5 text-[var(--neu-text-muted)] border border-white/10', icon: 'forum' },
};

export function GossipCard({ post }: GossipCardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const postId = post.id || post._id || '';

    const likeMutation = useMutation({
        mutationFn: () => gossipService.likeGossip(postId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['gossip'] });
            // Optimistic toggle
            queryClient.setQueriesData({ queryKey: ['gossip'] }, (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        gossip: (page.gossip || []).map((p: GossipPost) => {
                            if ((p.id || p._id) !== postId) return p;
                            const wasLiked = p.isLiked === true;
                            return { ...p, isLiked: !wasLiked, likeCount: p.likeCount + (wasLiked ? -1 : 1) };
                        }),
                    })),
                };
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['gossip'] });
            queryClient.invalidateQueries({ queryKey: ['gossip-detail', postId] });
        },
    });

    const isLiked = post.isLiked === true;
    const typeMeta = TYPE_META[post.discussionType] ?? TYPE_META.general;
    const typeLabel =
        DISCUSSION_TYPE_LABELS[post.discussionType as DiscussionType] ||
        post.discussionType?.charAt(0).toUpperCase() + post.discussionType?.slice(1);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        likeMutation.mutate();
    };

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('a') && !target.closest('button')) {
            router.push(`/gossip/${postId}`);
        }
    };

    return (
        <article
            className="neu-card-sm rounded-2xl overflow-hidden hover:opacity-95 active:scale-[0.995] transition-all cursor-pointer"
            onClick={handleCardClick}
        >
            {/* Top accent strip per discussion type */}
            <div className={`h-0.5 w-full ${typeMeta.color.split(' ')[0]}`} />

            <div className="p-4">
                {/* ── Row 1: type badge + time ──────────────────────────── */}
                <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${typeMeta.color}`}>
                        <span className="material-symbols-outlined text-[13px]">{typeMeta.icon}</span>
                        {typeLabel}
                    </span>
                    <div className="flex items-center gap-2">
                        {post.slangEnrichment?.hasSlang && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">🇳🇬 Pidgin</span>
                        )}
                        {post.location && (post.location.lga || post.location.state) && (
                            <span className="text-[11px] flex items-center gap-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                                <span className="material-symbols-outlined text-[13px]">location_on</span>
                                {post.location.lga || post.location.state}
                            </span>
                        )}
                        <span className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>
                            {formatTimeAgo(post.createdAt)}
                        </span>
                    </div>
                </div>

                {/* ── Row 2: avatar + author + identity ─────────────────── */}
                <div className="flex items-center gap-2.5 mb-3">
                    {post.anonymous ? (
                        <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>person</span>
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--neu-base)] flex items-center justify-center">
                                <span className="material-symbols-outlined text-[10px] text-amber-400">lock</span>
                            </span>
                        </div>
                    ) : (
                        <Link href={`/profile/${post.author?.username}`} onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                            <MapPinAvatar src={post.author?.avatarUrl} alt={post.author?.name} size="sm" />
                        </Link>
                    )}
                    <div className="min-w-0">
                        {post.anonymous ? (
                            <div>
                                <span className="text-[13px] font-semibold" style={{ color: 'var(--neu-text)' }}>
                                    Anonymous Neighbor
                                </span>
                                <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">
                                    hidden identity
                                </span>
                            </div>
                        ) : (
                            <Link
                                href={`/profile/${post.author?.username}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[13px] font-semibold hover:underline block truncate"
                                style={{ color: 'var(--neu-text)' }}
                            >
                                {post.author?.name}
                            </Link>
                        )}
                    </div>
                </div>

                {/* ── Row 3: title + body ────────────────────────────────── */}
                <h3 className="font-bold text-[16px] leading-tight mb-1.5" style={{ color: 'var(--neu-text)' }}>
                    {post.title}
                </h3>
                <p className="text-[14px] leading-5 line-clamp-3 whitespace-pre-wrap break-words" style={{ color: 'var(--neu-text-muted)' }}>
                    {post.body}
                </p>

                {/* ── Media grid ────────────────────────────────────────── */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className={`mt-3 grid gap-1.5 rounded-xl overflow-hidden ${post.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {post.mediaUrls.slice(0, 4).map((url, i) => (
                            <div
                                key={i}
                                className={`relative bg-black/10 rounded-xl overflow-hidden ${post.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`media ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                {i === 3 && post.mediaUrls!.length > 4 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">+{post.mediaUrls!.length - 4}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Row 4: tags ───────────────────────────────────────── */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-2.5 flex-wrap">
                        {post.tags.slice(0, 5).map((tag) => (
                            <span key={tag} className="text-[12px] px-2 py-0.5 rounded-full neu-chip text-primary">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Row 5: stats bar ──────────────────────────────────── */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t" style={{ borderColor: 'var(--neu-shadow-light)' }}>
                    {/* Like */}
                    <button
                        onClick={handleLike}
                        disabled={likeMutation.isPending}
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all group ${
                            isLiked
                                ? 'bg-red-500/10 text-red-400'
                                : 'hover:bg-red-500/10 hover:text-red-400'
                        }`}
                        style={!isLiked ? { color: 'var(--neu-text-muted)' } : undefined}
                    >
                        <span className={`material-symbols-outlined text-[18px] transition-colors ${isLiked ? 'fill-1' : ''}`}>
                            favorite
                        </span>
                        <span>{post.likeCount || 0}</span>
                    </button>

                    {/* Comment — navigates to detail */}
                    <div
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-medium hover:bg-white/5 transition-all"
                        style={{ color: 'var(--neu-text-muted)' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                        <span>{post.commentCount || 0}</span>
                    </div>

                    {/* Views */}
                    {(post.viewCount || 0) > 0 && (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px]" style={{ color: 'var(--neu-text-muted)' }}>
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                            <span>{post.viewCount}</span>
                        </div>
                    )}

                    {/* Read more arrow */}
                    <div className="ml-auto flex items-center gap-1 text-[12px] font-medium" style={{ color: 'var(--primary)' }}>
                        <span>Read</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </div>
                </div>
            </div>
        </article>
    );
}
