/**
 * GossipCard Component
 * Neighbourhood discussion card — quote-style gradient card matching feed design.
 */

'use client';

import { GossipPost, DISCUSSION_TYPE_LABELS, DiscussionType } from '@/types/gossip';
import { formatTimeAgo } from '@/utils/timeAgo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MapPinAvatar from '@/components/ui/MapPinAvatar';
import { gossipService } from '@/services/gossip.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface GossipCardProps {
    post: GossipPost;
    currentUserId?: string;
}

const TYPE_ACCENT: Record<string, string> = {
    safety:                 '#f87171',
    cultural_discussion:    '#fbbf24',
    local_gist:             '#4ade80',
    community_question:     '#a78bfa',
    recommendation_request: '#a78bfa',
    business_inquiry:       '#60a5fa',
    social_update:          '#22d3ee',
    general:                '#e879a8',
};

const GRADIENT = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

export function GossipCard({ post }: GossipCardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showMenu, setShowMenu] = useState(false);
    const postId = post.id || post._id || '';

    const likeMutation = useMutation({
        mutationFn: () => gossipService.likeGossip(postId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['gossip'] });
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
    const accentColor = TYPE_ACCENT[post.discussionType] ?? TYPE_ACCENT.general;
    const typeLabel =
        DISCUSSION_TYPE_LABELS[post.discussionType as DiscussionType] ||
        post.discussionType?.charAt(0).toUpperCase() + post.discussionType?.slice(1);

    const textContent = (post.title ? post.title + (post.body ? '\n' + post.body : '') : post.body) || '';
    const wordCount = textContent.trim().split(/\s+/).length;
    const fontSize = wordCount <= 10 ? '28px' : wordCount <= 20 ? '22px' : wordCount <= 50 ? '17px' : '14px';

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

    const hasMedia = (post.mediaUrls?.length ?? 0) > 0;

    return (
        <article
            className="relative overflow-hidden cursor-pointer rounded-2xl"
            style={{ background: GRADIENT, minHeight: '70vh' }}
            onClick={handleCardClick}
        >
            {/* ── RIGHT SIDE: Vertical action rail ── */}
            <div className="absolute right-3 top-2/3 -translate-y-1/2 z-20 flex flex-col items-center gap-4">
                {/* Like */}
                <button onClick={handleLike} disabled={likeMutation.isPending} aria-label={isLiked ? 'Unlike' : 'Like'} className="flex flex-col items-center gap-0.5 group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isLiked ? 'bg-pink-500/30 backdrop-blur-md' : 'bg-black/30 backdrop-blur-md hover:bg-black/50'
                    }`}>
                        <span className={`material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform ${
                            isLiked ? 'text-pink-400 fill-1' : 'text-white'
                        }`}>favorite</span>
                    </div>
                    {(post.likeCount || 0) > 0 && <span className="text-[11px] font-bold text-white drop-shadow-md">{post.likeCount}</span>}
                </button>
                {/* Comment */}
                <button onClick={(e) => { e.stopPropagation(); router.push(`/gossip/${postId}`); }} className="flex flex-col items-center gap-0.5 group">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md hover:bg-black/50 transition-all">
                        <span className="material-symbols-outlined text-[22px] text-white group-hover:scale-110 transition-transform">chat_bubble</span>
                    </div>
                    {(post.commentCount || 0) > 0 && <span className="text-[11px] font-bold text-white drop-shadow-md">{post.commentCount}</span>}
                </button>
                {/* Views */}
                {(post.viewCount || 0) > 0 && (
                    <div className="flex flex-col items-center gap-0.5">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent">
                            <span className="material-symbols-outlined text-[20px] text-white/40">visibility</span>
                        </div>
                        <span className="text-[11px] text-white/40">{post.viewCount}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col" style={{ minHeight: '70vh' }}>

                {/* ── TOP: Author header ── */}
                <div className="p-4 pt-5">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            {post.anonymous ? (
                                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px] text-white/60">person</span>
                                </div>
                            ) : (
                                <Link href={`/profile/${post.author?.username}`} onClick={(e) => e.stopPropagation()}>
                                    <MapPinAvatar src={post.author?.avatarUrl} alt={post.author?.name} size="lg" />
                                </Link>
                            )}
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                            {post.anonymous ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-[14px] text-white">Anonymous Neighbor</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">hidden</span>
                                </div>
                            ) : (
                                <Link
                                    href={`/profile/${post.author?.username}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-bold text-[14px] text-white hover:underline truncate block"
                                >
                                    {post.author?.name}
                                </Link>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-white/50">{formatTimeAgo(post.createdAt)}</span>
                                {post.location && (post.location.lga || post.location.state) && (
                                    <>
                                        <span className="text-white/25 text-[10px]">·</span>
                                        <span className="material-symbols-outlined text-[12px] text-white/40">location_on</span>
                                        <span className="text-[11px] text-white/50 truncate max-w-[100px]">
                                            {post.location.lga || post.location.state}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Type badge + menu */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span
                                className="text-[9px] px-2 py-[3px] rounded-full font-bold uppercase tracking-wider"
                                style={{ color: accentColor, background: `${accentColor}20`, border: `1px solid ${accentColor}30` }}
                            >
                                {typeLabel}
                            </span>
                            {post.slangEnrichment?.hasSlang && (
                                <span className="text-[9px] px-1.5 py-[3px] rounded-full bg-green-500/15 text-green-400 font-bold">🇳🇬</span>
                            )}
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors text-white/60"
                                >
                                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                </button>
                                {showMenu && (
                                    <div
                                        className="absolute right-0 top-10 z-30 w-40 rounded-2xl overflow-hidden bg-black/70 backdrop-blur-2xl border border-white/10 shadow-2xl"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => { setShowMenu(false); router.push(`/gossip/${postId}`); }}
                                            className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-white/10 transition-colors text-white/60"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">open_in_new</span> Open
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── CENTER: Big quote text ── */}
                <div className="px-8 pr-14 py-6 flex-1 flex flex-col justify-center items-center">
                    <span className="text-5xl leading-none mb-3 font-serif self-start opacity-20" style={{ color: accentColor }}>&ldquo;</span>
                    <p
                        className="font-extrabold leading-snug whitespace-pre-wrap break-words text-center"
                        style={{ color: accentColor, fontSize }}
                    >
                        {textContent}
                    </p>
                    <span className="text-5xl leading-none mt-3 font-serif self-end opacity-20" style={{ color: accentColor }}>&rdquo;</span>

                    {/* Edited badge */}
                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <span className="mt-2 text-[10px] italic text-white/30">edited</span>
                    )}
                </div>

                {/* Media grid (if any) */}
                {hasMedia && (
                    <div className={`mx-4 mb-2 grid gap-1.5 rounded-xl overflow-hidden ${post.mediaUrls!.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {post.mediaUrls!.slice(0, 4).map((url, i) => (
                            <div
                                key={i}
                                className={`relative bg-black/20 rounded-xl overflow-hidden ${post.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'}`}
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

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="px-6 pb-2 flex flex-wrap justify-center gap-1.5">
                        {post.tags.slice(0, 5).map((tag) => (
                            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/70">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Bottom spacing */}
                <div className="pb-5" />
            </div>
        </article>
    );
}
