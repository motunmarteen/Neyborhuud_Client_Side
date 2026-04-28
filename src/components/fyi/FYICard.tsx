/**
 * FYICard Component
 * Community bulletin card with rich metadata display.
 */

'use client';

import { Post } from '@/types/api';
import { formatTimeAgo } from '@/utils/timeAgo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MapPinAvatar from '@/components/ui/MapPinAvatar';
import { contentService } from '@/services/content.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FYICardProps {
    post: Post;
    currentUserId?: string;
}

export function FYICard({ post }: FYICardProps) {
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
    const location = post.location as any;
    const contactInfo = (post.metadata as any)?.contactInfo || (post as any).contactInfo;

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('a') && !target.closest('button')) {
            router.push(`/fyi/${postId}`);
        }
    };

    return (
        <article
            className="neu-card-sm rounded-2xl overflow-hidden hover:opacity-95 active:scale-[0.995] transition-all cursor-pointer"
            onClick={handleCardClick}
        >

            <div className="p-4">
                {/* Row 1: time/location */}
                <div className="flex items-center justify-end mb-3">
                    <div className="flex items-center gap-1.5">
                        {location && (location.lga || location.state) && (
                            <span className="text-[11px] flex items-center gap-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                                <span className="material-symbols-outlined text-[13px]">location_on</span>
                                {location.lga || location.state}
                            </span>
                        )}
                        <span className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>
                            {formatTimeAgo(post.createdAt)}
                        </span>
                    </div>
                </div>

                {/* Row 2: avatar + author */}
                <div className="flex items-center gap-2.5 mb-3">
                    <Link href={`/profile/${post.author?.username}`} onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                        <MapPinAvatar src={post.author?.avatarUrl} alt={post.author?.name} size="sm" />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/profile/${post.author?.username}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[13px] font-semibold hover:underline block truncate"
                            style={{ color: 'var(--neu-text)' }}
                        >
                            {post.author?.name}
                        </Link>
                        {post.author?.username && (
                            <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                                @{post.author.username}
                            </span>
                        )}
                    </div>
                </div>

                {/* Row 3: hashtags + body inline */}
                <div className="mb-3">
                    <p className="text-[14px] leading-6 line-clamp-4 whitespace-pre-wrap break-words" style={{ color: 'var(--neu-text-muted)' }}>
                        <span className="font-semibold mr-1" style={{ color: 'var(--primary)' }}>
                            #fyi
                            {post.tags?.filter(t => t !== 'fyi').slice(0, 3).map(tag => ` #${tag}`).join('')}
                        </span>
                        {post.content || post.body}
                    </p>
                </div>

                {/* Media grid */}
                {mediaUrls.length > 0 && (
                    <div className={`mb-3 grid gap-1.5 rounded-xl overflow-hidden ${mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {mediaUrls.slice(0, 4).map((url, i) => (
                            <div
                                key={i}
                                className={`relative bg-black/10 rounded-xl overflow-hidden ${mediaUrls.length === 1 ? 'aspect-video' : 'aspect-square'}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`media ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                {i === 3 && mediaUrls.length > 4 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">+{mediaUrls.length - 4}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Contact info row */}
                {contactInfo && (
                    <div className="flex items-center gap-1.5 mb-2.5 px-2 py-1.5 rounded-xl" style={{ background: 'var(--neu-bg-offset, rgba(0,0,0,0.04))' }}>
                        <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--neu-text-muted)' }}>contact_phone</span>
                        <span className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>{contactInfo}</span>
                    </div>
                )}

                {/* Stats bar */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t" style={{ borderColor: 'var(--neu-shadow-light)' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); likeMutation.mutate(); }}
                        disabled={likeMutation.isPending}
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all group ${
                            isLiked ? 'bg-red-500/10 text-red-400' : 'hover:bg-red-500/10 hover:text-red-400'
                        }`}
                        style={!isLiked ? { color: 'var(--neu-text-muted)' } : undefined}
                    >
                        <span className={`material-symbols-outlined text-[18px] transition-colors ${isLiked ? 'fill-1' : ''}`}>favorite</span>
                        <span>{post.likes || 0}</span>
                    </button>

                    <div
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-medium hover:bg-white/5 transition-all"
                        style={{ color: 'var(--neu-text-muted)' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                        <span>{post.comments || 0}</span>
                    </div>

                    {(post.views || 0) > 0 && (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px]" style={{ color: 'var(--neu-text-muted)' }}>
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                            <span>{post.views}</span>
                        </div>
                    )}

                    <div className="ml-auto flex items-center gap-1 text-[12px] font-medium" style={{ color: 'var(--primary)' }}>
                        <span>Read</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </div>
                </div>
            </div>
        </article>
    );
}
