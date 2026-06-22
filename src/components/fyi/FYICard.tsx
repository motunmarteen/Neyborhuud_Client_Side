/**
 * FYICard — Community bulletin card
 * Formatted to match the standard XPostCard UI look and feel.
 */

'use client';

import { MediaItem, Post, PostAuthor } from '@/types/api';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { contentService } from '@/services/content.service';
import { fyiService } from '@/services/fyi.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useFollow } from '@/hooks/useFollow';
import ShareModal from '../feed/ShareModal';
import { useLongPress } from '@/hooks/useLongPress';
import { PostCardActionsSheet } from '@/components/feed/PostCardActionsSheet';
import { PostCardMenuIcon } from '@/components/feed/PostCardMenuIcon';
import { usePostCardMenuActions } from '@/hooks/usePostCardMenuActions';
import { XReplyIcon, XLikeIcon, XViewIcon, XBookmarkIcon, XShareIcon, XThumbUpIcon } from '@/components/icons/XIcons';
import { PostSentinelLink } from '@/components/feed/PostSentinelLink';
import { PostCardFollowButton } from '@/components/feed/PostCardFollowButton';
import { PostCardAuthorLines } from '@/components/feed/PostCardAuthorLines';
import { PostCardVerificationBadge } from '@/components/feed/PostCardVerificationBadge';
import { PostCardMediaSlider } from '@/components/feed/PostCardMediaSlider';
import { getPostAuthorUserId } from '@/lib/postAuthor';
import { resolveUserAvatarUrl } from '@/lib/userAvatar';

const formatCompactCount = (value?: number) => {
    if (!value) return undefined;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
    return `${value}`;
};

interface FYICardProps {
    post: Post;
    currentUserId?: string;
    onComment?: (postId: string) => void;
    onEdit?: (post: Post) => void;
    onDelete?: (postId: string) => void;
    onReport?: (postId: string) => void;
    onPin?: (postId: string) => void;
    onFeedPreferenceApplied?: (postId: string, signal: 'not_interested' | 'hide') => void;
}

export function FYICard({
    post,
    currentUserId,
    onComment,
    onEdit,
    onDelete,
    onReport,
    onPin,
    onFeedPreferenceApplied,
}: FYICardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user: currentAuthUser } = useAuth();
    const postId = post.id || '';
    const [expanded, setExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showShare, setShowShare] = useState(false);

    const longPress = useLongPress(() => setMenuOpen(true));

    const author = post.author as PostAuthor;
    const fullName = author ? [author.firstName, author.lastName].filter(Boolean).join(' ') : '';
    const authorName = fullName || author?.name || author?.username || 'Anonymous';
    const authorUsername = author?.username || 'user';
    const authorAvatar = resolveUserAvatarUrl(author);

    const isAnonymousAuthor = !author?.id || author.id === 'anonymous';
    const isOwner = !!(currentAuthUser && (currentAuthUser.id === author?.id || (currentAuthUser as any)._id === author?.id || post.authorId === currentAuthUser.id));
    const authorUserId = getPostAuthorUserId(post);

    const canFollow = !isOwner && !isAnonymousAuthor && !!authorUserId;
    const { isFollowing, toggleFollow, isPending: isFollowPending } = useFollow(
        authorUserId,
        { enabled: canFollow },
    );

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

    const saveMutation = useMutation({
        mutationFn: () =>
            post.isSaved ? contentService.unsavePost(postId) : contentService.savePost(postId),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['fyi'] });
            queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
        },
    });

    const helpfulMutation = useMutation({
        mutationFn: () => fyiService.markHelpful(postId),
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
                            const wasHelpful = p.isHelpful === true;
                            return {
                                ...p,
                                isHelpful: !wasHelpful,
                                helpfulCount: (p.helpfulCount ?? 0) + (wasHelpful ? -1 : 1),
                            };
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
    const contactInfo = (post.metadata as any)?.contactInfo || (post as any).contactInfo;
    const textContent = post.content || post.body || '';
    const hasText = textContent.trim().length > 0;

    const mediaItems: Array<{ url: string; type?: MediaItem['type']; thumbnailUrl?: string }> = Array.isArray(post.media)
        ? post.media
            .map((m) => (typeof m === 'string' ? { url: m } : { url: m.url, type: m.type, thumbnailUrl: m.thumbnailUrl }))
            .filter((m) => Boolean(m.url))
        : [];
    const hasMedia = mediaItems.length > 0;

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('a') && !target.closest('video')) {
            if (onComment) {
                onComment(postId);
            } else {
                router.push(`/feed`);
            }
        }
    };

    const { sections: menuSections } = usePostCardMenuActions({
        post,
        postId,
        authorId: authorUserId,
        authorName,
        authorUsername,
        isOwnerPost: isOwner,
        isAnonymousAuthor,
        isFollowing,
        onEdit,
        onDelete,
        onPin,
        onReport,
        onFeedPreferenceApplied,
    });

    const articleGestureProps = {
        onPointerDown: longPress.onPointerDown,
        onPointerUp: longPress.onPointerUp,
        onPointerLeave: longPress.onPointerLeave,
        onPointerCancel: longPress.onPointerCancel,
        onContextMenu: longPress.onContextMenu,
        onClick: (e: React.MouseEvent) => {
            if (longPress.didLongPress()) {
                longPress.resetLongPress();
                return;
            }
            handleCardClick(e);
        },
    };

    const postActionsSheet = (
        <PostCardActionsSheet
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            authorName={isAnonymousAuthor ? 'Anonymous Neyborh' : authorName}
            authorUsername={authorUsername}
            authorAvatar={authorAvatar}
            sections={menuSections}
        />
    );

    const renderTextContent = () => {
        if (!hasText) return null;
        const shouldTruncate = textContent.length > 280 && !expanded;
        const displayText = shouldTruncate ? `${textContent.slice(0, 260)}...` : textContent;

        return (
            <div className="px-1 text-[14px] font-normal text-neu-text dark:text-white/90 leading-[19px] tracking-normal whitespace-pre-wrap break-words">
                {displayText}
                {shouldTruncate && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                        className="ml-1 text-primary hover:text-brand-green-dark font-black hover:underline cursor-pointer"
                    >
                        see more
                    </button>
                )}
                {expanded && textContent.length > 280 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                        className="ml-1 text-primary hover:text-brand-green-dark font-black hover:underline cursor-pointer"
                    >
                        see less
                    </button>
                )}
            </div>
        );
    };

    const renderMedia = () => {
        if (!hasMedia) return null;
        return (
            <PostCardMediaSlider
                items={mediaItems}
                altPrefix={textContent ? textContent.slice(0, 80) : `Bulletin by ${authorName}`}
            />
        );
    };

    return (
        <>
        <article
            className="bg-white dark:bg-[#121b14] px-4 py-3.5 mx-auto w-full select-none border-0 border-b border-black/[0.06] dark:border-white/[0.06] shadow-none max-w-[580px] rounded-none flex flex-col gap-0"
            {...articleGestureProps}
        >
            {/* Top Header Row */}
            <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                        <Link href={`/profile/${authorUsername}`} onClick={(e) => e.stopPropagation()}>
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-glass-border bg-black/[0.04] dark:bg-white/10">
                                {authorAvatar && !imageError ? (
                                    <Image
                                        src={authorAvatar}
                                        alt={authorName}
                                        fill
                                        sizes="40px"
                                        className="object-cover"
                                        onError={() => setImageError(true)}
                                        unoptimized
                                    />
                                ) : (
                                    <span className="material-symbols-outlined text-[18px] text-neu-text-secondary dark:text-white/60">person</span>
                                )}
                            </div>
                        </Link>
                        <div className="absolute -bottom-1 -right-1 z-10 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-white dark:bg-[#121b14] border-[1.5px] border-white dark:border-[#121b14] shadow-sm select-none pointer-events-none">
                            <PostCardVerificationBadge
                                author={author}
                                hidden={isAnonymousAuthor}
                            />
                        </div>
                    </div>
                    <PostCardAuthorLines
                        authorName={authorName}
                        authorUsername={authorUsername}
                        author={author}
                        isAnonymousAuthor={isAnonymousAuthor}
                        isVerified={author?.isVerified}
                        verificationBadge={author?.verificationBadge}
                        createdAt={post.createdAt}
                        postLocation={post.location as { lga?: string; state?: string } | undefined}
                        authorLocation={(author as { location?: { lga?: string; state?: string } })?.location}
                        onProfileClick={(e) => e.stopPropagation()}
                    />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <PostCardFollowButton
                        visible={canFollow}
                        isFollowing={isFollowing}
                        isPending={isFollowPending}
                        onToggle={toggleFollow}
                    />
                    {post.isPinned && (
                        <span className="material-symbols-outlined text-[16px] text-status-warning" style={{ fontVariationSettings: '"FILL" 1' }}>push_pin</span>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }}
                        className="post-card-actions-trigger post-card-header__icon-btn"
                        aria-label="Post options"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen ? 'true' : 'false'}
                    >
                        <PostCardMenuIcon />
                    </button>
                </div>
            </div>

            {/* Body Section */}
            <div className="mt-2.5 w-full flex flex-col gap-3">
                {renderTextContent()}
                {hasMedia && (
                    <div className="-mx-4 mt-0.5">
                        {renderMedia()}
                    </div>
                )}
            </div>

            {/* Contact info Block */}
            {contactInfo && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-status-warning/5 mt-3">
                    <span className="material-symbols-outlined text-[16px] text-status-warning">contact_phone</span>
                    <span className="text-[12px] text-neu-text-secondary dark:text-white/70 font-semibold">{contactInfo}</span>
                </div>
            )}

            {/* Action Bar (Horizontal Row) */}
            <div className="post-card-action-bar flex items-center justify-between mt-3 text-[11px] font-bold">
                {/* Comment action */}
                <button
                    onClick={(e) => { e.stopPropagation(); onComment?.(postId); }}
                    className="post-card-action-bar__btn flex flex-1 min-w-0 items-center justify-center gap-1 py-1 text-neu-text-secondary dark:text-white/60 hover:text-brand-blue transition-colors duration-200 cursor-pointer group"
                    aria-label="Comment"
                >
                    <XReplyIcon size={18} className="group-hover:text-brand-blue group-hover:animate-dance-comment" />
                    <span className="group-hover:text-brand-blue tabular-nums transition-colors duration-200">{post.comments ? formatCompactCount(post.comments) : '0'}</span>
                </button>

                {/* Helpful action */}
                <button
                    onClick={(e) => { e.stopPropagation(); helpfulMutation.mutate(); }}
                    className={`post-card-action-bar__btn flex flex-1 min-w-0 items-center justify-center gap-1 py-1 transition-colors duration-200 cursor-pointer group ${post.isHelpful ? 'text-primary' : 'text-neu-text-secondary dark:text-white/60 hover:text-primary'}`}
                    aria-label="Helpful"
                >
                    <XThumbUpIcon size={18} filled={!!post.isHelpful} className="group-hover:text-primary" />
                    <span className="group-hover:text-primary tabular-nums">{post.helpfulCount ? formatCompactCount(post.helpfulCount) : '0'}</span>
                </button>

                {/* Like action */}
                <button
                    onClick={(e) => { e.stopPropagation(); likeMutation.mutate(); }}
                    className={`post-card-action-bar__btn flex flex-1 min-w-0 items-center justify-center gap-1 py-1 transition-colors duration-200 cursor-pointer group ${isLiked ? 'text-brand-red' : 'text-neu-text-secondary dark:text-white/60 hover:text-brand-red'}`}
                    aria-label="Like"
                >
                    <XLikeIcon size={18} filled={isLiked} className={`transition-transform active:scale-75 group-hover:animate-dance-like group-hover:text-brand-red ${isLiked ? 'text-brand-red' : ''}`} />
                    <span className="group-hover:text-brand-red tabular-nums transition-colors duration-200">{post.likes ? formatCompactCount(post.likes) : '0'}</span>
                </button>

                {/* Views action */}
                <div className="post-card-action-bar__btn flex flex-1 min-w-0 items-center justify-center gap-1 py-1 text-neu-text-secondary dark:text-white/60" aria-label="Views">
                    <XViewIcon size={18} />
                    <span className="tabular-nums">{post.views ? formatCompactCount(post.views) : '1.2K'}</span>
                </div>

                {/* Save action */}
                <button
                    onClick={(e) => { e.stopPropagation(); saveMutation.mutate(); }}
                    className={`post-card-action-bar__btn flex flex-1 min-w-0 items-center justify-center gap-1 py-1 transition-colors duration-200 cursor-pointer group ${post.isSaved ? 'text-brand-blue' : 'text-neu-text-secondary dark:text-white/60 hover:text-brand-blue'}`}
                    aria-label="Bookmark"
                >
                    <XBookmarkIcon size={18} filled={post.isSaved} className="group-hover:animate-dance-save group-hover:text-brand-blue" />
                </button>

                {/* Share action */}
                <button
                    onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
                    className="post-card-action-bar__btn flex flex-1 min-w-0 items-center justify-center gap-1 py-1 text-neu-text-secondary dark:text-white/60 hover:text-brand-blue transition-colors duration-200 cursor-pointer group"
                    aria-label="Share"
                >
                    <XShareIcon size={18} className="group-hover:animate-dance-share group-hover:text-brand-blue" />
                </button>
            </div>
        </article>

        {showShare && (
            <ShareModal postId={post.id ?? post._id ?? ''} postContent={post.content ?? ''} onClose={() => setShowShare(false)} />
        )}
        {postActionsSheet}
        </>
    );
}
