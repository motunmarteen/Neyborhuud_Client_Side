/**
 * FYICard — Community bulletin card
 * iOS 26 Liquid Glass action rail + ambient sphere background (amber/gold palette).
 * Supports text-only and mixed (text + media) modes.
 */

'use client';

import { Post } from '@/types/api';
import { formatTimeAgo } from '@/utils/timeAgo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { contentService } from '@/services/content.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FYICardProps {
    post: Post;
    currentUserId?: string;
    onComment?: (postId: string) => void;
}

// Amber / gold / warm-orange spheres
const SPHERES: [string, string, string] = [
    'rgba(245,158,11,0.45)',
    'rgba(234,179,8,0.38)',
    'rgba(249,115,22,0.28)',
];

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

export function FYICard({ post, onComment }: FYICardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const postId = post.id || '';

    const likeMutation = useMutation({
        mutationFn: () =>
            post.isLiked ? contentService.unlikePost(postId) : contentService.likePost(postId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['fyi'] });
            queryClient.setQueriesData({ queryKey: ['fyi'] }, (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        fyi: (page.fyi || []).map((p: Post) => {
                            if (p.id !== postId) return p;
                            const wasLiked = p.isLiked === true;
                            return { ...p, isLiked: !wasLiked, likes: p.likes + (wasLiked ? -1 : 1) };
                        }),
                    })),
                };
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['fyi'] });
            queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
        },
    });

    const isLiked = post.isLiked === true;
    const mediaUrls = (Array.isArray(post.media) ? post.media : []) as string[];
    const hasMedia = mediaUrls.length > 0;
    const contactInfo = (post.metadata as any)?.contactInfo || (post as any).contactInfo;
    const textContent = post.content || post.body || '';
    const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;
    const textSizeClass =
        wordCount <= 6  ? 'text-[32px] leading-tight' :
        wordCount <= 15 ? 'text-[24px] leading-snug' :
        wordCount <= 35 ? 'text-[19px] leading-snug' :
        wordCount <= 70 ? 'text-[16px] leading-relaxed' :
        'text-[14px] leading-relaxed';

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('a') && !target.closest('button')) {
            // Keep existing immersive behavior: FYI card tap should open comments sheet on feed.
            if (onComment) {
                onComment(postId);
                return;
            }
            router.push(`/feed`);
        }
    };

    // ── Action rail ────────────────────────────────────────────────────────────
    const actionRail = (
        <div className="absolute right-3 bottom-5 z-30 flex flex-col items-center gap-3 sm:bottom-6">
            <GlassBtn
                icon="favorite"
                count={post.likes || undefined}
                active={isLiked}
                activeIconClass="text-brand-blue"
                filled
                onClick={(e) => { e.stopPropagation(); likeMutation.mutate(); }}
            />
            <GlassBtn
                icon="chat_bubble"
                count={post.comments || undefined}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onComment) {
                        onComment(postId);
                    }
                }}
            />
            <GlassBtn
                icon="send"
                onClick={(e) => {
                    e.stopPropagation();
                    if (navigator.share) {
                        navigator.share({ title: textContent.substring(0, 50), url: `${window.location.origin}/fyi/${postId}` }).catch(() => {});
                    }
                }}
            />
            {(post.views || 0) > 0 && (
                <div className="flex flex-col items-center gap-0.5">
                    <span className="material-symbols-outlined text-[18px] text-white/30">visibility</span>
                    <span className="text-[10px] text-white/35 font-medium">{post.views}</span>
                </div>
            )}
        </div>
    );

    // ── Top type badges ───────────────────────────────────────────────────────
    const topBadges = (
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 bg-gradient-to-b from-black/65 via-black/20 to-transparent px-4 pb-16 pt-4">
            <div className="pointer-events-auto flex items-center gap-1.5">
                <span
                    className="text-[9px] px-2 py-[3px] rounded-full font-bold tracking-wider uppercase text-white/90"
                    style={{ background: 'rgba(245,158,11,0.20)', border: '1px solid rgba(245,158,11,0.25)', backdropFilter: 'blur(12px)' }}
                >
                    FYI
                </span>
                {post.fyiSubtype && (
                    <span
                        className="text-[9px] px-2 py-[3px] rounded-full font-bold uppercase text-white/65"
                        style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
                    >
                        {post.fyiSubtype.replace(/_/g, ' ')}
                    </span>
                )}
            </div>
        </div>
    );

    // ── Bottom author cluster ─────────────────────────────────────────────────
    const bottomAuthorPanel = (
        <div className="absolute bottom-5 left-4 right-[76px] z-30 sm:bottom-6 sm:left-5 sm:right-24">
            <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
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
                </div>
                <div className="min-w-0">
                    <Link
                        href={`/profile/${post.author?.username}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block max-w-[150px] whitespace-normal text-[12px] font-black leading-[1.05] text-white hover:underline"
                        style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}
                    >
                        {post.author?.name || 'Anonymous Neyborh'}
                    </Link>
                    <div className="mt-1 text-[10px] font-bold leading-none text-white/58">
                        {formatTimeAgo(post.createdAt)}
                    </div>
                </div>
            </div>
            {hasMedia && textContent.trim().length > 0 && (
                <p
                    className="mt-3 text-[14px] font-semibold leading-snug text-white whitespace-pre-wrap break-words"
                    style={{ textShadow: '0 1px 8px rgba(0,0,0,0.65)' }}
                >
                    <span className="text-status-warning font-black mr-1.5">#fyi</span>
                    {textContent}
                </p>
            )}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (onComment) {
                        onComment(postId);
                    }
                }}
                className="mt-3 flex h-8 w-full max-w-[210px] items-center rounded-full border border-white/12 bg-white/8 px-3 text-left text-[11px] font-semibold text-white/55 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/12 hover:text-white/75 active:scale-[0.98]"
                aria-label="Add comment"
            >
                Add comment...
            </button>
        </div>
    );

    // ── TEXT-ONLY MODE ────────────────────────────────────────────────────────
    if (!hasMedia) {
        return (
            <article
                className="relative overflow-hidden cursor-pointer rounded-none border-y border-white/10 sm:rounded-3xl sm:border"
                style={{ background: '#07070f', height: CARD_HEIGHT, minHeight: CARD_HEIGHT }}
                onClick={handleCardClick}
            >
                {/* Ambient spheres */}
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-28 -left-28 w-[340px] h-[340px] rounded-full" style={{ background: SPHERES[0], filter: 'blur(90px)' }} />
                    <div className="absolute top-[35%] -right-20 w-[300px] h-[300px] rounded-full" style={{ background: SPHERES[1], filter: 'blur(80px)' }} />
                    <div className="absolute -bottom-24 left-[15%] w-[280px] h-[280px] rounded-full" style={{ background: SPHERES[2], filter: 'blur(75px)' }} />
                </div>
                <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />

                {topBadges}
                {actionRail}
                {bottomAuthorPanel}

                {/* Center: text */}
                <div
                    className="absolute inset-x-0 z-20 px-6 pr-20 flex flex-col justify-center gap-4"
                    style={{ top: '88px', bottom: '148px' }}
                >
                    <p
                        className={`font-bold whitespace-pre-wrap break-words text-white ${textSizeClass}`}
                        style={{ textShadow: '0 2px 24px rgba(0,0,0,0.4)' }}
                    >
                        <span className="text-status-warning mr-1.5 font-black">
                            #fyi{post.tags?.filter(t => t !== 'fyi').slice(0, 2).map(t => ` #${t}`).join('')}
                        </span>
                        {textContent}
                    </p>

                    {contactInfo && (
                        <div
                            className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)' }}
                        >
                            <span className="material-symbols-outlined text-[16px] text-status-warning/70">contact_phone</span>
                            <span className="text-[12px] text-white/65">{contactInfo}</span>
                        </div>
                    )}

                    {post.fyiStatus && post.fyiStatus !== 'active' && (
                        <span
                            className={`self-start text-[10px] px-2.5 py-1 rounded-full font-bold backdrop-blur-sm border ${
                                ['found', 'returned', 'resolved'].includes(post.fyiStatus)
                                    ? 'bg-primary/25 text-primary border-brand-green-dark/20'
                                    : 'bg-white/10 text-white/60 border-white/10'
                            }`}
                        >
                            {post.fyiStatus.charAt(0).toUpperCase() + post.fyiStatus.slice(1)}
                        </span>
                    )}

                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <span className="text-[10px] italic text-white/25">edited</span>
                    )}
                </div>

            </article>
        );
    }

    // ── MIXED MODE (text + media) ─────────────────────────────────────────────
    return (
        <article
            className="relative overflow-hidden cursor-pointer rounded-none border-y border-white/10 bg-black sm:rounded-3xl sm:border"
            style={{ height: CARD_HEIGHT, minHeight: CARD_HEIGHT }}
            onClick={handleCardClick}
        >
            {/* Full-bleed media */}
            <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={mediaUrls[0]}
                    alt="FYI media"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://i.pravatar.cc/600?u=fyi'; }}
                />
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, transparent 28%, rgba(0,0,0,0.88) 68%, rgba(0,0,0,0.97) 100%)' }}
                />
            </div>

            {/* Multi-image indicator */}
            {mediaUrls.length > 1 && (
                <div
                    className="absolute top-4 right-14 z-30 flex items-center gap-1 px-2.5 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.14)' }}
                >
                    <span className="material-symbols-outlined text-white text-[14px]">photo_library</span>
                    <span className="text-white text-[11px] font-bold">{mediaUrls.length}</span>
                </div>
            )}

            {topBadges}
            {actionRail}
            {bottomAuthorPanel}

            {/* Bottom details panel */}
            <div className="absolute bottom-[160px] left-0 right-0 z-20 px-5 pr-20">
                {contactInfo && (
                    <div
                        className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)' }}
                    >
                        <span className="material-symbols-outlined text-[15px] text-status-warning/70">contact_phone</span>
                        <span className="text-[12px] text-white/65">{contactInfo}</span>
                    </div>
                )}

                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {post.tags.filter(t => t !== 'fyi').slice(0, 4).map((tag, i) => (
                            <span
                                key={i}
                                className="text-[11px] px-2.5 py-1 rounded-full text-white/65 font-medium"
                                style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)' }}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {post.updatedAt && post.updatedAt !== post.createdAt && (
                    <span className="mt-2 block text-[10px] italic text-white/25">edited</span>
                )}
            </div>
        </article>
    );
}
