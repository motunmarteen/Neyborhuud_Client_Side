/**
 * GossipCard — Community discussion card
 * iOS 26 Liquid Glass action rail + ambient sphere background.
 */

'use client';

import { GossipPost, DISCUSSION_TYPE_LABELS, DiscussionType } from '@/types/gossip';
import { formatTimeAgo } from '@/utils/timeAgo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gossipService } from '@/services/gossip.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface GossipCardProps {
    post: GossipPost;
    currentUserId?: string;
    onComment?: (gossipId: string) => void;
}

// Sphere palette: pink / purple / indigo (gossip vibe)
const SPHERES: [string, string, string] = [
    'rgba(236,72,153,0.45)',
    'rgba(168,85,247,0.38)',
    'rgba(99,102,241,0.28)',
];

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

const CARD_HEIGHT = '90vh';

// ── iOS 26 Liquid Glass button ─────────────────────────────────────────────────
function GlassBtn({
    icon, count, active, activeIconClass, onClick, filled,
}: {
    icon: string; count?: number; active?: boolean;
    activeIconClass?: string; onClick: (e: React.MouseEvent) => void; filled?: boolean;
}) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-full p-1 transition-transform duration-150 hover:scale-110 active:scale-[0.88] group">
            <span
                className={`material-symbols-outlined text-[22px] transition-transform duration-150 ${active ? (activeIconClass || 'text-white') : 'text-white'}`}
                style={{
                    ...(filled && active ? { fontVariationSettings: '"FILL" 1' } : {}),
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.85))',
                }}
            >
                {icon}
            </span>
            {(count !== undefined && count > 0) && (
                <span className="text-[10px] font-bold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {count}
                </span>
            )}
        </button>
    );
}

export function GossipCard({ post, onComment }: GossipCardProps) {
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
        (post.discussionType?.charAt(0).toUpperCase() + post.discussionType?.slice(1)) ||
        'Gossip';

    const textContent = (post.title ? post.title + (post.body ? '\n' + post.body : '') : post.body) || '';
    const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;
    const textSizeClass =
        wordCount <= 6  ? 'text-[32px] leading-tight' :
        wordCount <= 15 ? 'text-[24px] leading-snug' :
        wordCount <= 35 ? 'text-[19px] leading-snug' :
        wordCount <= 70 ? 'text-[16px] leading-relaxed' :
        'text-[14px] leading-relaxed';

    const hasMedia = (post.mediaUrls?.length ?? 0) > 0;

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('a') && !target.closest('button')) {
            router.push(`/local-news/${postId}`);
        }
    };

    return (
        <article
            className="relative overflow-hidden cursor-pointer rounded-none border-y border-white/10 sm:rounded-3xl sm:border"
            style={{ background: '#07070f', height: CARD_HEIGHT, minHeight: CARD_HEIGHT }}
            onClick={handleCardClick}
        >
            {/* Ambient sphere background */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-28 -left-28 w-[340px] h-[340px] rounded-full" style={{ background: SPHERES[0], filter: 'blur(90px)' }} />
                <div className="absolute top-[35%] -right-20 w-[300px] h-[300px] rounded-full" style={{ background: SPHERES[1], filter: 'blur(80px)' }} />
                <div className="absolute -bottom-24 left-[15%] w-[280px] h-[280px] rounded-full" style={{ background: SPHERES[2], filter: 'blur(75px)' }} />
            </div>
            {/* Vignette */}
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />

            {/* ── Action rail ── */}
            <div className="absolute right-3 bottom-5 z-30 flex flex-col items-center gap-3 sm:bottom-6">
                <GlassBtn
                    icon="favorite"
                    count={post.likeCount || undefined}
                    active={isLiked}
                    activeIconClass="text-pink-300"
                    filled
                    onClick={(e) => { e.stopPropagation(); likeMutation.mutate(); }}
                />
                <GlassBtn
                    icon="chat_bubble"
                    count={post.commentCount || undefined}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onComment) {
                            onComment(postId);
                            return;
                        }
                        router.push(`/local-news/${postId}`);
                    }}
                />
                {(post.viewCount || 0) > 0 && (
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="material-symbols-outlined text-[18px] text-white/30">visibility</span>
                        <span className="text-[10px] text-white/35 font-medium">{post.viewCount}</span>
                    </div>
                )}
            </div>

            {/* ── Top badges + menu ── */}
            <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 pb-16 bg-gradient-to-b from-black/65 via-black/20 to-transparent pointer-events-none">
                <div className="flex items-center justify-between gap-3 pointer-events-auto">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span
                            className="text-[9px] px-2 py-[3px] rounded-full font-bold uppercase tracking-wider"
                            style={{
                                color: accentColor,
                                background: `${accentColor}1a`,
                                border: `1px solid ${accentColor}2e`,
                                backdropFilter: 'blur(12px)',
                            }}
                        >
                            {typeLabel}
                        </span>
                        {post.slangEnrichment?.hasSlang && (
                            <span
                                className="text-[9px] px-1.5 py-[3px] rounded-full font-bold text-green-400"
                                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.22)' }}
                            >
                                🇳🇬
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-white/65 hover:text-white transition-colors"
                                style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.14)' }}
                            >
                                <span className="material-symbols-outlined text-[18px]">more_vert</span>
                            </button>
                            {showMenu && (
                                <div
                                    className="absolute right-0 top-10 z-40 w-40 rounded-2xl overflow-hidden shadow-2xl"
                                    style={{ background: 'rgba(8,8,20,0.88)', backdropFilter: 'blur(28px) saturate(180%)', border: '1px solid rgba(255,255,255,0.10)' }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => { setShowMenu(false); router.push(`/local-news/${postId}`); }}
                                        className="w-full text-left px-4 py-3 text-[13px] flex items-center gap-3 hover:bg-white/8 transition-colors text-white/70"
                                    >
                                        <span className="material-symbols-outlined text-[17px]">open_in_new</span> Open
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom author cluster ── */}
            <div className="absolute bottom-5 left-4 right-[76px] z-30 sm:bottom-6 sm:left-5 sm:right-24">
                <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                        {post.anonymous ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10">
                                <span className="material-symbols-outlined text-[18px] text-white/55">person</span>
                            </div>
                        ) : (
                            <Link href={`/profile/${post.author?.username}`} onClick={(e) => e.stopPropagation()}>
                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10">
                                    {post.author?.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={post.author.avatarUrl} alt={post.author?.name || 'Author'} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-[18px] text-white/55">person</span>
                                    )}
                                </div>
                            </Link>
                        )}
                    </div>
                    <div className="min-w-0">
                        {post.anonymous ? (
                            <span className="block max-w-[150px] whitespace-normal text-[12px] font-black leading-[1.05] text-white" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}>
                                Anonymous Neyborh
                            </span>
                        ) : (
                            <Link
                                href={`/profile/${post.author?.username}`}
                                onClick={(e) => e.stopPropagation()}
                                className="block max-w-[150px] whitespace-normal text-[12px] font-black leading-[1.05] text-white hover:underline"
                                style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}
                            >
                                {post.author?.name || 'Anonymous Neyborh'}
                            </Link>
                        )}
                        <div className="mt-1 text-[10px] font-bold leading-none text-white/58">
                            {formatTimeAgo(post.createdAt)}
                        </div>
                    </div>
                </div>
                {textContent.trim().length > 0 && (
                    <p
                        className="mt-3 text-[14px] font-semibold leading-snug whitespace-pre-wrap break-words text-white"
                        style={{ textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}
                    >
                        {textContent}
                    </p>
                )}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onComment) {
                            onComment(postId);
                            return;
                        }
                        router.push(`/local-news/${postId}`);
                    }}
                    className="mt-3 flex h-8 w-full max-w-[210px] items-center rounded-full border border-white/12 bg-white/8 px-3 text-left text-[11px] font-semibold text-white/55 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/12 hover:text-white/75 active:scale-[0.98]"
                    aria-label="Add comment"
                >
                    Add comment...
                </button>
            </div>

            {/* ── Center media/tags block ── */}
            <div
                className="absolute inset-x-0 z-20 px-7 pr-20 flex flex-col justify-center items-center gap-4"
                style={{ top: '88px', bottom: '205px' }}
            >
                {/* Media grid */}
                {hasMedia && (
                    <div className={`w-full grid gap-1.5 rounded-2xl overflow-hidden ${post.mediaUrls!.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {post.mediaUrls!.slice(0, 4).map((url, i) => (
                            <div
                                key={i}
                                className={`relative bg-black/20 rounded-2xl overflow-hidden ${post.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'}`}
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
                    <div className="flex flex-wrap justify-center gap-1.5 w-full">
                        {post.tags.slice(0, 5).map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold text-white/65"
                                style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)' }}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {post.updatedAt && post.updatedAt !== post.createdAt && (
                    <span className="text-[10px] italic text-white/25">edited</span>
                )}
            </div>
        </article>
    );
}
