/**
 * HelpRequestCard — Community help request card
 * Formatted to match the standard XPostCard UI look and feel.
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Post, PostAuthor } from '@/types/api';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { contentService } from '@/services/content.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useFollow } from '@/hooks/useFollow';
import ShareModal from '../feed/ShareModal';
import { useLongPress } from '@/hooks/useLongPress';
import { PostCardActionsSheet } from '@/components/feed/PostCardActionsSheet';
import { PostCardMenuIcon } from '@/components/feed/PostCardMenuIcon';
import { usePostCardMenuActions } from '@/hooks/usePostCardMenuActions';
import { XReplyIcon, XLikeIcon, XViewIcon, XBookmarkIcon, XShareIcon, XHelpIcon } from '@/components/icons/XIcons';
import { PostSentinelLink } from '@/components/feed/PostSentinelLink';
import { PostCardFollowButton } from '@/components/feed/PostCardFollowButton';
import { PostCardAuthorLines } from '@/components/feed/PostCardAuthorLines';
import { PostCardVerificationBadge } from '@/components/feed/PostCardVerificationBadge';
import { PostCardMediaSlider } from '@/components/feed/PostCardMediaSlider';
import { getPostAuthorUserId } from '@/lib/postAuthor';
import { resolveUserAvatarUrl } from '@/lib/userAvatar';

interface HelpRequestCardProps {
    post: Post;
    onComment?: (postId: string) => void;
    onEdit?: (post: Post) => void;
    onDelete?: (postId: string) => void;
    onReport?: (postId: string) => void;
    onPin?: (postId: string) => void;
    onFeedPreferenceApplied?: (postId: string, signal: 'not_interested' | 'hide') => void;
}

function formatNaira(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '';
    return `₦${num.toLocaleString('en-NG')}`;
}

const formatCompactCount = (value?: number) => {
    if (!value) return undefined;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
    return `${value}`;
};

export function HelpRequestCard({ post, onComment, onEdit, onDelete, onReport, onPin, onFeedPreferenceApplied }: HelpRequestCardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const postId = post.id || '';
    const [expanded, setExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showShare, setShowShare] = useState(false);

    const longPress = useLongPress(() => setMenuOpen(true));

    const meta = (post.metadata || {}) as Record<string, any>;
    const targetAmount: number | undefined = post.targetAmount ?? meta.targetAmount ?? (post as any).targetAmount;
    const accountDetails = post.helpRequestPayment ?? meta.helpRequestPayment ?? meta.accountDetails ?? (post as any).helpRequestPayment ?? (post as any).accountDetails;
    const storedReceived: number = post.amountReceived ?? meta.amountReceived ?? (post as any).amountReceived ?? 0;

    const author = post.author as PostAuthor;
    const fullName = author ? [author.firstName, author.lastName].filter(Boolean).join(' ') : '';
    const authorName = fullName || author?.name || author?.username || 'Anonymous';
    const authorUsername = author?.username || 'user';
    const authorAvatar = resolveUserAvatarUrl(author);

    const isOwner = !!(user && (user.id === author?.id || (user as any)._id === author?.id));
    const isAnonymousAuthor = !author?.id || author.id === 'anonymous';
    const authorUserId = getPostAuthorUserId(post);

    const canFollow = !isOwner && !isAnonymousAuthor && !!authorUserId;
    const { isFollowing, toggleFollow, isPending: isFollowPending } = useFollow(
        authorUserId,
        { enabled: canFollow },
    );

    const [copied, setCopied] = useState(false);
    const [showUpdateReceived, setShowUpdateReceived] = useState(false);
    const [receivedInput, setReceivedInput] = useState(String(storedReceived || ''));
    const [localReceived, setLocalReceived] = useState<number>(storedReceived);
    const receivedInputRef = useRef<HTMLInputElement>(null);

    const progressPct = targetAmount && targetAmount > 0
        ? Math.min(100, Math.round((localReceived / targetAmount) * 100))
        : null;

    const likeMutation = useMutation({
        mutationFn: () =>
            post.isLiked ? contentService.unlikePost(postId) : contentService.likePost(postId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['helpRequest'] });
            queryClient.setQueriesData({ queryKey: ['helpRequest'] }, (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        helpRequests: (page.helpRequests || []).map((p: Post) => {
                            if (p.id !== postId) return p;
                            const wasLiked = p.isLiked === true;
                            return { ...p, isLiked: !wasLiked, likes: p.likes + (wasLiked ? -1 : 1) };
                        }),
                    })),
                };
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['helpRequest'] });
            queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
        },
    });

    const saveMutation = useMutation({
        mutationFn: () =>
            post.isSaved ? contentService.unsavePost(postId) : contentService.savePost(postId),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['helpRequest'] });
            queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
        },
    });

    const updateReceivedMutation = useMutation({
        mutationFn: (newAmount: number) => contentService.updateHelpRequestAmount(postId, newAmount),
        onSuccess: (_, newAmount) => {
            setLocalReceived(newAmount);
            setShowUpdateReceived(false);
            queryClient.invalidateQueries({ queryKey: ['helpRequest'] });
            queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
        },
    });

    const handleCopyAccount = (e: React.MouseEvent) => {
        e.stopPropagation();
        const acct = accountDetails?.accountNumber;
        if (!acct) return;
        navigator.clipboard.writeText(String(acct)).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSaveReceived = (e: React.MouseEvent) => {
        e.stopPropagation();
        const num = parseFloat(receivedInput.replace(/,/g, ''));
        if (isNaN(num) || num < 0) return;
        updateReceivedMutation.mutate(num);
    };

    const isLiked = post.isLiked === true;
    const mediaItems = (Array.isArray(post.media) ? post.media : [])
        .map((m) => (typeof m === 'string' ? { url: m } : { url: (m as { url?: string }).url ?? '' }))
        .filter((m) => Boolean(m.url));
    const hasMedia = mediaItems.length > 0;
    const textContent = post.content || post.body || '';

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('a') && !target.closest('button') && !target.closest('input')) {
            router.push(`/help-request/${postId}`);
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
        if (!textContent) return null;
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
                altPrefix="Help request media"
            />
        );
    };

    // ── Structured components ──
    const fundingBlock = targetAmount != null && targetAmount > 0 ? (
        <div className="p-3.5 rounded-2xl flex flex-col gap-2.5 bg-primary/[0.04] mt-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px] text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>savings</span>
                    <span className="text-[10px] font-black uppercase text-neu-text-secondary dark:text-white/50 tracking-wider">Funding Goal</span>
                </div>
                <span className="text-sm font-black text-neu-text dark:text-white">{formatNaira(targetAmount)}</span>
            </div>
            <div>
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/[0.08] dark:bg-white/10">
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${progressPct ?? 0}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] font-bold">
                    <span className="text-primary">{formatNaira(localReceived)} raised</span>
                    <span className="text-neu-text-secondary dark:text-white/40">{progressPct != null ? `${progressPct}%` : ''}</span>
                </div>
            </div>
            {isOwner && !showUpdateReceived && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setReceivedInput(String(localReceived || '')); setShowUpdateReceived(true); setTimeout(() => receivedInputRef.current?.focus(), 50); }}
                    className="self-start flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-xl text-primary bg-primary/10 border border-primary/25 hover:bg-primary/20 transition-all cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[12px]">edit</span>
                    Update amount
                </button>
            )}
            {isOwner && showUpdateReceived && (
                <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                    <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-neu-text-muted">₦</span>
                        <input
                            ref={receivedInputRef}
                            type="number"
                            value={receivedInput}
                            onChange={(e) => setReceivedInput(e.target.value)}
                            min="0"
                            placeholder="Amount received"
                            className="w-full pl-6 pr-2 py-1.5 rounded-xl text-[12px] focus:outline-none bg-black/5 dark:bg-white/10 text-neu-text border border-glass-border focus:border-primary"
                        />
                    </div>
                    <button type="button" onClick={handleSaveReceived} disabled={updateReceivedMutation.isPending}
                        className="px-3 py-1.5 rounded-xl text-[12px] font-black text-white bg-primary hover:bg-brand-green-dark transition-all cursor-pointer">
                        {updateReceivedMutation.isPending ? '…' : 'Save'}
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setShowUpdateReceived(false); }}
                        className="px-2.5 py-1.5 rounded-xl text-[12px] font-bold text-neu-text-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer">
                        ✕
                    </button>
                </div>
            )}
        </div>
    ) : null;

    const accountBlock = accountDetails && (accountDetails.bankName || accountDetails.accountName || accountDetails.accountNumber) ? (
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/5 flex flex-col gap-2 mt-3">
            <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-[16px] text-neu-text-secondary dark:text-white/40">account_balance</span>
                <span className="text-[10px] font-black uppercase text-neu-text-secondary dark:text-white/40 tracking-wider">How to Help</span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
                {accountDetails.bankName && (
                    <div className="flex items-center justify-between">
                        <span className="text-neu-text-secondary dark:text-white/40 font-semibold">Bank</span>
                        <span className="font-bold text-neu-text dark:text-white">{accountDetails.bankName}</span>
                    </div>
                )}
                {accountDetails.accountName && (
                    <div className="flex items-center justify-between">
                        <span className="text-neu-text-secondary dark:text-white/40 font-semibold">Name</span>
                        <span className="font-bold text-neu-text dark:text-white">{accountDetails.accountName}</span>
                    </div>
                )}
                {accountDetails.accountNumber && (
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-neu-text-secondary dark:text-white/40 font-semibold">Account</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-black tracking-wider text-neu-text dark:text-white text-[13px]">{accountDetails.accountNumber}</span>
                            <button
                                type="button"
                                onClick={handleCopyAccount}
                                className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                style={{
                                    background: copied ? 'rgba(0,212,49,0.15)' : 'rgba(0,0,0,0.04)',
                                    color: copied ? 'var(--primary)' : 'var(--neu-text-secondary)',
                                }}
                            >
                                <span className="material-symbols-outlined text-[12px]">{copied ? 'check' : 'content_copy'}</span>
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    ) : null;

    return (
        <>
        <article
            className="bg-white dark:bg-[#121b14] border-b border-black/5 dark:border-white/5 px-4 py-3.5 mx-auto w-full select-none max-w-none rounded-none flex flex-col gap-0"
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
                        <PostCardVerificationBadge
                            author={author}
                            hidden={isAnonymousAuthor}
                            withAvatarBackground
                            avatarBadgeSize="sm"
                        />
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

            {/* Financial and bank info blocks */}
            {fundingBlock}
            {accountBlock}

            {/* Action Bar (Horizontal Row) */}
            <div className="post-card-action-bar flex items-center justify-between mt-3 text-[11px] font-bold w-full">
                {/* Comment action */}
                <button
                    onClick={(e) => { e.stopPropagation(); onComment?.(postId); }}
                    className="post-card-action-bar__btn flex items-center gap-1.5 px-2 py-1 text-neu-text-secondary dark:text-white/60 hover:text-brand-blue transition-colors duration-200 active:scale-95 cursor-pointer group"
                    aria-label="Comment"
                >
                    <XReplyIcon size={18} className="group-hover:text-brand-blue group-hover:animate-dance-comment" />
                    <span className="group-hover:text-brand-blue tabular-nums transition-colors duration-200">{post.comments ? formatCompactCount(post.comments) : '0'}</span>
                </button>

                {/* Help action */}
                <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/help-request/${postId}`); }}
                    className="post-card-action-bar__btn flex items-center gap-1.5 px-2 py-1 text-primary hover:text-brand-green-dark transition-colors duration-200 cursor-pointer group"
                    aria-label="Help"
                >
                    <XHelpIcon size={18} className="group-hover:text-brand-green-dark text-primary animate-pulse" />
                    <span className="font-black group-hover:text-brand-green-dark text-primary">Help</span>
                </button>

                {/* Like action */}
                <button
                    onClick={(e) => { e.stopPropagation(); likeMutation.mutate(); }}
                    className={`post-card-action-bar__btn flex items-center gap-1.5 px-2 py-1 transition-colors duration-200 active:scale-95 cursor-pointer group ${isLiked ? 'text-brand-red' : 'text-neu-text-secondary dark:text-white/60 hover:text-brand-red'}`}
                    aria-label="Like"
                >
                    <XLikeIcon size={18} filled={isLiked} className={`transition-transform active:scale-75 group-hover:animate-dance-like group-hover:text-brand-red ${isLiked ? 'text-brand-red' : ''}`} />
                    <span className="group-hover:text-brand-red tabular-nums transition-colors duration-200">{post.likes ? formatCompactCount(post.likes) : '0'}</span>
                </button>

                {/* Views action */}
                <div className="post-card-action-bar__btn flex items-center gap-1.5 px-2 py-1 text-neu-text-secondary dark:text-white/60" aria-label="Views">
                    <XViewIcon size={18} />
                    <span className="tabular-nums">{post.views ? formatCompactCount(post.views) : '1.2K'}</span>
                </div>

                {/* Save action */}
                <button
                    onClick={(e) => { e.stopPropagation(); saveMutation.mutate(); }}
                    className={`post-card-action-bar__btn flex items-center gap-1.5 px-2 py-1 transition-colors duration-200 active:scale-95 cursor-pointer group ${post.isSaved ? 'text-brand-blue' : 'text-neu-text-secondary dark:text-white/60 hover:text-brand-blue'}`}
                    aria-label="Bookmark"
                >
                    <XBookmarkIcon size={18} filled={post.isSaved} className="group-hover:animate-dance-save group-hover:text-brand-blue" />
                </button>

                {/* Share action */}
                <button
                    onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
                    className="post-card-action-bar__btn flex items-center gap-1.5 px-2 py-1 text-neu-text-secondary dark:text-white/60 hover:text-brand-blue transition-colors duration-200 active:scale-95 cursor-pointer group"
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
