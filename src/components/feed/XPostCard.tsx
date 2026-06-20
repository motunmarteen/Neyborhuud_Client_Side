/**
 * XPostCard — Premium hybrid feed post card (Facebook + Instagram style)
 * Natural document-flow, glassmorphic layout with horizontal actions below content.
 */

'use client';

import { MediaItem, Post, PostAuthor } from '@/types/api';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFollow } from '@/hooks/useFollow';
import ShareModal from './ShareModal';
import { EMERGENCY_ACTION_CLS } from '@/lib/brand-styles';
import { useLongPress } from '@/hooks/useLongPress';
import { PostCardActionsSheet } from '@/components/feed/PostCardActionsSheet';
import { PostCardMenuIcon } from '@/components/feed/PostCardMenuIcon';
import { usePostCardMenuActions } from '@/hooks/usePostCardMenuActions';
import { XReplyIcon, XRepostIcon, XLikeIcon, XViewIcon, XBookmarkIcon, XShareIcon, XThumbUpIcon } from '@/components/icons/XIcons';
import { PostSentinelLink } from '@/components/feed/PostSentinelLink';
import { PostCardFollowButton } from '@/components/feed/PostCardFollowButton';
import { PostCardAuthorLines } from '@/components/feed/PostCardAuthorLines';
import { PostCardMediaSlider } from '@/components/feed/PostCardMediaSlider';
import { QuotedPostEmbed } from '@/components/feed/QuotedPostEmbed';
import { RepostComposerSheet } from '@/components/feed/RepostComposerSheet';
import { getPostAuthorUserId } from '@/lib/postAuthor';
import { PostRepostChainModal } from './PostRepostChainModal';
import { generatePostNarrative } from '@/lib/postNarrative';

const formatCompactCount = (value?: number) => {
    if (!value) return undefined;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
    return `${value}`;
};

// ── Emergency action buttons ───────────────────────────────────────────────────
function EmergencyActions({ post, onEmergencyAction }: { post: Post; onEmergencyAction: (a: string) => void }) {
    const actions = [
        { key: 'aware', icon: 'notifications_active', label: 'Aware', active: post.isAware, cls: EMERGENCY_ACTION_CLS.aware },
        { key: 'nearby', icon: 'location_on', label: 'Nearby', active: post.isNearby, cls: EMERGENCY_ACTION_CLS.nearby },
        { key: 'safe', icon: 'shield', label: 'Safe', active: post.isSafe, cls: EMERGENCY_ACTION_CLS.safe },
        { key: 'confirm', icon: 'check_circle', label: 'Confirm', active: post.confirmDisputeAction === 'confirm', cls: EMERGENCY_ACTION_CLS.confirm },
        { key: 'dispute', icon: 'cancel', label: 'Dispute', active: post.confirmDisputeAction === 'dispute', cls: EMERGENCY_ACTION_CLS.dispute },
    ].filter(a => !post.availableActions || post.availableActions.includes(a.key));

    if (actions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-brand-red/10 mt-2">
            {actions.map(a => (
                <button
                    key={a.key}
                    onClick={(e) => { e.stopPropagation(); onEmergencyAction(a.key); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        a.active ? a.cls : 'bg-brand-red/5 text-brand-red/70 border border-brand-red/10 hover:bg-brand-red/10'
                    }`}
                >
                    <span className="material-symbols-outlined text-[14px]">{a.icon}</span>
                    {a.label}
                </button>
            ))}
        </div>
    );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface XPostCardProps {
    post: Post;
    onLike: () => void;
    onComment: () => void;
    onShare: () => void;
    onSave: () => void;
    onEmergencyAction?: (action: string) => void;
    onCardClick?: () => void;
    currentUserId?: string;
    onEdit?: (post: Post) => void;
    onDelete?: (postId: string) => void;
    onReport?: (postId: string) => void;
    onPin?: (postId: string) => void;
    onHelpful?: () => void;
    onReposted?: () => void;
    userLocation?: { lat: number; lng: number } | null;
    onFeedPreferenceApplied?: (postId: string, signal: 'not_interested' | 'hide') => void;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function XPostCard({
    post,
    onLike,
    onComment,
    onSave,
    onEmergencyAction,
    onCardClick,
    currentUserId,
    onEdit,
    onDelete,
    onReport,
    onPin,
    onHelpful,
    onReposted,
    onFeedPreferenceApplied,
}: XPostCardProps) {
    const [imageError, setImageError] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showRepostComposer, setShowRepostComposer] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [chainModalOpen, setChainModalOpen] = useState(false);
    const handleOpenRepostChain = () => setChainModalOpen(true);


    const longPress = useLongPress(() => setMenuOpen(true));

    const author = post.author as PostAuthor;
    const fullName = author ? [author.firstName, author.lastName].filter(Boolean).join(' ') : '';
    const authorName = fullName || author?.name || author?.username || 'Anonymous';
    const authorUsername = author?.username || 'user';
    const authorAvatar = author?.avatarUrl || author?.profilePicture || null;

    const isAnonymousAuthor = !author?.id || author.id === 'anonymous';
    const isOwnerPost = currentUserId && (author?.id === currentUserId || post.authorId === currentUserId);
    const authorUserId = getPostAuthorUserId(post);

    const canFollow = !isOwnerPost && !isAnonymousAuthor && !!authorUserId;
    const { isFollowing, toggleFollow, isPending: isFollowPending } = useFollow(
        authorUserId,
        { enabled: canFollow },
    );

    const mediaItems: Array<{ url: string; type?: MediaItem['type']; thumbnailUrl?: string }> = Array.isArray(post.media)
        ? post.media
            .map((m) => (typeof m === 'string' ? { url: m } : { url: m.url, type: m.type, thumbnailUrl: m.thumbnailUrl }))
            .filter((m) => Boolean(m.url))
        : [];

    const hasMedia = mediaItems.length > 0;

    /** Red left stripe — only for real emergency/SOS posts, not generic #safety tags */
    const isSafetyAlert =
        post.contentType === 'emergency' ||
        post.cardStyle === 'emergency_red';

    const textContent = post.content || post.body || '';
    const isQuoteRepost = post.mood === 'repost' && !!post.quotedPost;
    const quoteComment = isQuoteRepost ? textContent.trim() : '';
    const isSimpleRepost = isQuoteRepost && !quoteComment;
    const displayText = isQuoteRepost ? quoteComment : textContent;
    const hasText = displayText.trim().length > 0;

    const postId = post.id ?? (post as { _id?: string })._id ?? '';

    const { sections: menuSections } = usePostCardMenuActions({
        post,
        postId,
        authorId: authorUserId,
        authorName,
        authorUsername,
        isOwnerPost: !!isOwnerPost,
        isAnonymousAuthor,
        isFollowing,
        onEdit,
        onDelete,
        onPin,
        onReport,
        onFeedPreferenceApplied,
    });

    const handleProfileClick = (e: React.MouseEvent) => e.stopPropagation();

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('a') && !target.closest('video')) {
            onCardClick?.();
        }
    };

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

    // ── Structured content narrative block ─────────────────────────────────
    const narrative = generatePostNarrative(post);
    const narrativeBlock = narrative ? (
        <div className={`flex flex-col gap-2 p-3.5 rounded-none ${narrative.accentBg} border ${narrative.accentBorder} mt-2`}>
            <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                    <span className="material-symbols-outlined text-[14px]">{narrative.icon}</span>
                    {narrative.typeLabel}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/chat?user=${authorUsername}`;
                    }}
                    className="px-2.5 py-1 rounded-none text-[9.5px] font-black uppercase border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-[11px]">chat</span>
                    DM
                </button>
            </div>
            <p className="text-[12.5px] font-medium leading-relaxed whitespace-pre-line" style={{ color: 'var(--neu-text)' }}>
                {narrative.text}
            </p>
        </div>
    ) : null;

    // ── Core Layout ───────────────────────────────────────────────────────────
    const cardStyleClass = isSafetyAlert
        ? 'border-l-[4px] border-l-brand-red border-t-0 border-r-0 border-b-[8px] border-[#f2f4f7] dark:border-[#0a0c0a] shadow-none'
        : 'border-0 border-b-[8px] border-[#f2f4f7] dark:border-[#0a0c0a] shadow-none';

    const renderTextContent = () => {
        if (!hasText) return null;
        const shouldTruncate = displayText.length > 280 && !expanded;
        const visibleText = shouldTruncate ? `${displayText.slice(0, 260)}...` : displayText;

        return (
            <div className="px-1 text-[15px] font-normal text-neu-text dark:text-[#E7E9EA] leading-[1.35] tracking-[-0.01em] whitespace-pre-wrap break-words">
                {visibleText}
                {shouldTruncate && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                        className="ml-1 text-primary hover:text-brand-green-dark font-black hover:underline cursor-pointer"
                    >
                        see more
                    </button>
                )}
                {expanded && displayText.length > 280 && (
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

    const renderRepostBody = () => {
        if (!isQuoteRepost || !post.quotedPost) return null;
        return (
            <>
                {isSimpleRepost && (
                    <div className="post-card-repost-label px-1">
                        <XRepostIcon size={14} />
                        <span>Reposted</span>
                    </div>
                )}
                {renderTextContent()}
                <QuotedPostEmbed
                    post={post.quotedPost}
                    onClick={() => onCardClick?.()}
                />
            </>
        );
    };

    const renderMedia = () => {
        if (!hasMedia) return null;
        return (
            <PostCardMediaSlider
                items={mediaItems}
                altPrefix={textContent ? textContent.slice(0, 80) : `Post by ${authorName}`}
            />
        );
    };

    return (
        <>
        <article
            className={`bg-white dark:bg-[#121b14] px-3 py-4 mx-auto w-full select-none ${cardStyleClass} max-w-none rounded-none flex flex-col gap-4`}
            {...articleGestureProps}
        >
            {/* Repost Shared Origin Label */}
            {post.parentId && (() => {
                const sharer = post.sharedFrom || (post.quotedPost?.author as { username?: string; avatarUrl?: string | null; name?: string } | undefined);
                const sharerUsername = sharer?.username || 'neybor';
                const sharerAvatar = sharer?.avatarUrl || null;
                const sharerInitial = (sharer?.name || sharerUsername)[0]?.toUpperCase() || 'N';
                return (
                    <div
                        className="flex items-center gap-2 px-1 -mt-1 -mb-2 text-[11px] text-neu-text-secondary/70 dark:text-white/40 font-semibold cursor-pointer w-fit hover:text-primary transition-colors group"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRepostChain();
                        }}
                    >
                        <span className="material-symbols-outlined text-[13px] text-primary" style={{ transform: 'scaleX(-1)' }}>reply</span>
                        <span className="flex items-center gap-1.5">
                            {/* Mini avatar of the sharer */}
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-none overflow-hidden border border-primary/20 shrink-0">
                                {sharerAvatar ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={sharerAvatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center text-[7px] font-black text-white" style={{ background: 'linear-gradient(135deg, #00c431, #009924)' }}>{sharerInitial}</span>
                                )}
                            </span>
                            shared from <span className="text-primary font-bold group-hover:underline">@{sharerUsername}</span>
                        </span>
                        <span className="material-symbols-outlined text-[10px] opacity-0 group-hover:opacity-70 transition-opacity text-primary">hub</span>
                    </div>
                );
            })()}

            {/* Header Row */}
            <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                        <Link href={`/profile/${authorUsername}`} onClick={handleProfileClick}>
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-none border border-glass-border bg-black/[0.04] dark:bg-white/10">
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
                        onProfileClick={handleProfileClick}
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

                    <PostSentinelLink />

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
            {isQuoteRepost ? renderRepostBody() : (
                <>
                    {renderTextContent()}
                    <div className="-mx-3">
                        {renderMedia()}
                    </div>
                </>
            )}

            {narrativeBlock}

            {/* Action Bar (Horizontal Row) */}
            <div className="post-card-action-bar flex items-center justify-between mt-2.5 text-[11px] font-bold w-full">
                {/* Comment action */}
                <button
                    onClick={(e) => { e.stopPropagation(); onComment(); }}
                    className="post-card-action-bar__btn flex items-center gap-1.5 px-1.5 py-1 -ml-1.5 rounded-xl hover:text-brand-blue hover:bg-brand-blue/10 transition-colors cursor-pointer group"
                    aria-label="Comment"
                >
                    <XReplyIcon size={18} className="group-hover:text-brand-blue" />
                    <span className="group-hover:text-brand-blue tabular-nums">{post.comments ? formatCompactCount(post.comments) : '0'}</span>
                </button>

                {/* FYI Helpful action / Repost action */}
                {post.contentType === 'fyi' && onHelpful ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onHelpful(); }}
                        className={`post-card-action-bar__btn flex items-center gap-1.5 px-1.5 py-1 -ml-1.5 rounded-xl transition-colors cursor-pointer group ${post.isHelpful ? 'text-primary' : 'hover:text-primary hover:bg-primary/10'}`}
                        aria-label="Helpful"
                    >
                        <XThumbUpIcon size={18} filled={!!post.isHelpful} className="group-hover:text-primary" />
                        <span className="group-hover:text-primary tabular-nums">{post.helpfulCount ? formatCompactCount(post.helpfulCount) : '0'}</span>
                    </button>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowRepostComposer(true); }}
                        className="post-card-action-bar__btn flex items-center gap-1.5 px-1.5 py-1 -ml-1.5 rounded-xl hover:text-brand-green-dark hover:bg-brand-green-dark/10 transition-colors cursor-pointer group"
                        aria-label="Repost"
                    >
                        <XRepostIcon size={18} className="group-hover:text-brand-green-dark" />
                        <span className="group-hover:text-brand-green-dark tabular-nums">{post.shares ? formatCompactCount(post.shares) : '0'}</span>
                    </button>
                )}

                {/* Like action */}
                <button
                    onClick={(e) => { e.stopPropagation(); onLike(); }}
                    className={`post-card-action-bar__btn flex items-center gap-1.5 px-1.5 py-1 -ml-1.5 rounded-xl transition-colors cursor-pointer group ${post.isLiked ? 'text-brand-red' : 'hover:text-brand-red hover:bg-brand-red/10'}`}
                    aria-label="Like"
                >
                    <XLikeIcon size={18} filled={post.isLiked} className={`transition-transform active:scale-75 group-hover:text-brand-red ${post.isLiked ? 'text-brand-red' : ''}`} />
                    <span className="group-hover:text-brand-red tabular-nums">{post.likes ? formatCompactCount(post.likes) : '0'}</span>
                </button>

                {/* Views action */}
                <div className="post-card-action-bar__btn flex items-center gap-1.5 px-1.5 py-1 -ml-1.5" aria-label="Views">
                    <XViewIcon size={18} />
                    <span className="tabular-nums">{post.views ? formatCompactCount(post.views) : '1.2K'}</span>
                </div>

                {/* Save action */}
                <button
                    onClick={(e) => { e.stopPropagation(); onSave(); }}
                    className={`post-card-action-bar__btn flex items-center gap-1.5 px-1.5 py-1 -ml-1.5 rounded-xl transition-colors cursor-pointer group ${post.isSaved ? 'text-brand-blue' : 'hover:text-brand-blue hover:bg-brand-blue/10'}`}
                    aria-label="Bookmark"
                >
                    <XBookmarkIcon size={18} filled={post.isSaved} className="group-hover:text-brand-blue" />
                </button>

                {/* Share action */}
                <button
                    onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
                    className="post-card-action-bar__btn flex items-center gap-1.5 px-1.5 py-1 -ml-1.5 rounded-xl hover:text-brand-blue hover:bg-brand-blue/10 transition-colors cursor-pointer group"
                    aria-label="Share"
                >
                    <XShareIcon size={18} className="group-hover:text-brand-blue" />
                </button>
            </div>

            {isSafetyAlert && onEmergencyAction && (
                <EmergencyActions post={post} onEmergencyAction={onEmergencyAction} />
            )}
        </article>

        {showShare && (
            <ShareModal postId={post.id ?? post._id ?? ''} postContent={post.content ?? ''} onClose={() => setShowShare(false)} />
        )}
        <RepostComposerSheet
            open={showRepostComposer}
            sourcePost={post}
            onClose={() => setShowRepostComposer(false)}
            onReposted={onReposted}
        />
        {chainModalOpen && (
            <PostRepostChainModal
                postId={postId}
                open={chainModalOpen}
                onClose={() => setChainModalOpen(false)}
            />
        )}
        {postActionsSheet}
        </>
    );
}
