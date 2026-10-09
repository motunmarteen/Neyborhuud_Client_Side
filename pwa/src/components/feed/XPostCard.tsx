/**
 * XPostCard — Premium hybrid feed post card (Facebook + Instagram style)
 * Natural document-flow, glassmorphic layout with horizontal actions below content.
 */

'use client';

import { MediaItem, Post, PostAuthor } from '@/types/api';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
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
import { PostCardVerificationBadge } from '@/components/feed/PostCardVerificationBadge';
import { PostCardMediaSlider } from '@/components/feed/PostCardMediaSlider';
import { QuotedPostEmbed } from '@/components/feed/QuotedPostEmbed';
import { RepostComposerSheet } from '@/components/feed/RepostComposerSheet';
import { getPostAuthorUserId } from '@/lib/postAuthor';
import { resolveUserAvatarUrl } from '@/lib/userAvatar';
import { PostRepostChainModal } from './PostRepostChainModal';
import { PremiumSafetyAlertBlock } from './PremiumSafetyAlertBlock';
import { generatePostNarrative } from '@/lib/postNarrative';
import { usePostMutations } from '@/hooks/usePosts';
import { renderFormattedText } from '@/lib/renderFormattedText';
import MapPinAvatar from '@/components/ui/MapPinAvatar';
import { MessageCircle, Repeat2, GitFork, Pin } from 'lucide-react';

const formatCompactCount = (value?: number) => {
    if (!value) return undefined;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
    return `${value}`;
};



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
    userLocation,
}: XPostCardProps) {
    const [imageError, setImageError] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showRepostComposer, setShowRepostComposer] = useState(false);
    const { sharePost, unsharePost } = usePostMutations();
    const [menuOpen, setMenuOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [chainModalOpen, setChainModalOpen] = useState(false);
    const handleOpenRepostChain = () => setChainModalOpen(true);

    const handleInstantRepost = async () => {
        try {
            if (post.isShared) {
                await unsharePost(post.id);
                toast.success('Repost removed');
            } else {
                await sharePost({ postId: post.id, location: userLocation || undefined });
                toast.success('Reposted to your feed');
            }
            if (onReposted) onReposted();
        } catch (err) {
            const message = (err as any)?.response?.data?.message || 'Action failed. Try again.';
            toast.error(message);
        }
    };

    const longPress = useLongPress(() => setMenuOpen(true));

    const author = post.author as PostAuthor;
    const fullName = author ? [author.firstName, author.lastName].filter(Boolean).join(' ') : '';
    const authorName = fullName || author?.name || author?.username || 'Anonymous';
    const authorUsername = author?.username || 'user';
    const authorAvatar = resolveUserAvatarUrl(author);

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
    const narrativeBlock = isSafetyAlert ? (
        <PremiumSafetyAlertBlock post={post} authorUsername={authorUsername} />
    ) : narrative ? (
        <div className={`post-narrative-block flex flex-col gap-2 p-3.5 border ${narrative.accentBorder} mt-3`}>
            <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                    <MessageCircle size={14} className="text-primary" />
                    {narrative.typeLabel}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/chat?user=${authorUsername}`;
                    }}
                    className="px-2.5 py-1 rounded-none text-[9.5px] font-black uppercase border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                >
                    <MessageCircle size={11} />
                    DM
                </button>
            </div>
            <p className="text-[12.5px] font-medium leading-relaxed whitespace-pre-line" style={{ color: 'var(--neu-text)' }}>
                {narrative.text}
            </p>
        </div>
    ) : null;

    // ── Core Layout ───────────────────────────────────────────────────────────
    const elevationClass = hasMedia ? 'feed-card--media' : '';

    const cardStyleClass = isSafetyAlert
        ? 'border-b border-black/5 dark:border-white/5'
        : 'border-b border-black/5 dark:border-white/5 shadow-none';


    const renderTextContent = () => {
        if (!hasText) return null;
        const isLongText = displayText.length > 280;

        return (
            <div className={`relative text-xs sm:text-[13px] font-medium text-[#1F2937] leading-relaxed tracking-normal whitespace-pre-wrap break-words ${!expanded && isLongText ? 'max-h-[140px] overflow-hidden' : ''}`}>
                {renderFormattedText(displayText, { stopPropagation: true })}
                
                {!expanded && isLongText && (
                    <div className="post-read-more-fade absolute bottom-0 left-0 right-0 h-16 pointer-events-none flex items-end pb-0.5">
                        <button
                            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                            className="pointer-events-auto text-[#008A20] hover:text-[#005B15] font-bold hover:underline cursor-pointer px-1 -ml-1 rounded"
                        >
                            Read more
                        </button>
                    </div>
                )}
                {expanded && isLongText && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                        className="block mt-2 text-[#008A20] hover:text-[#005B15] font-bold hover:underline cursor-pointer"
                    >
                        Show less
                    </button>
                )}
            </div>
        );
    };

    const renderRepostBody = () => {
        if (!isQuoteRepost || !post.quotedPost) return null;
        return (
            <div className="flex flex-col gap-3">
                {isSimpleRepost && (
                    <div className="flex items-center gap-1.5 px-1 pb-0.5 pt-0.5 text-[13px] font-bold text-neu-text-secondary/70 dark:text-white/40">
                        <XRepostIcon size={16} />
                        <span>Reposted</span>
                    </div>
                )}
                {renderTextContent()}
                <div className="mt-0.5">
                    <QuotedPostEmbed
                        post={post.quotedPost}
                        onClick={() => onCardClick?.()}
                    />
                </div>
            </div>
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
            className="rounded-2xl bg-white border border-black/[0.08] p-3.5 sm:p-4 shadow-xs transition-all hover:border-black/[0.12] w-full select-none flex flex-col gap-0"
            {...articleGestureProps}
        >
            {/* Repost Shared Origin Label */}
            {(post.repostedBy || post.parentId) && (() => {
                // If this is an unrolled simple repost, show who reposted it
                if (post.repostedBy) {
                    const sharerUsername = post.repostedBy.username || 'neybor';
                    const sharerAvatar = post.repostedBy.avatarUrl || null;
                    const sharerInitial = (post.repostedBy.name || sharerUsername)[0]?.toUpperCase() || 'N';
                    return (
                        <div
                            className="flex items-center gap-2 px-1 mb-2 pb-0.5 text-[11px] text-neu-text-secondary/70 dark:text-white/40 font-semibold cursor-pointer w-fit hover:text-brand-green transition-colors group"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRepostChain();
                            }}
                        >
                            <Repeat2 size={13} className="text-brand-green" />
                            <span className="flex items-center gap-1.5">
                                <MapPinAvatar src={sharerAvatar} fallbackInitial={sharerInitial} size="xs" />
                                reposted by <span className="text-brand-green font-bold group-hover:underline">@{sharerUsername}</span>
                            </span>
                            <GitFork size={10} className="opacity-0 group-hover:opacity-70 transition-opacity text-brand-green" />
                        </div>
                    );
                }

                // Fallback for nested quotes/shared origin
                const sharer = post.sharedFrom || (post.quotedPost?.author as { username?: string; avatarUrl?: string | null; name?: string } | undefined);
                if (!sharer) return null;
                const sharerUsername = sharer?.username || 'neybor';
                const sharerAvatar = sharer?.avatarUrl || null;
                const sharerInitial = (sharer?.name || sharerUsername)[0]?.toUpperCase() || 'N';
                return (
                    <div
                        className="flex items-center gap-2 px-1 mb-2 pb-0.5 text-[11px] text-neu-text-secondary/70 dark:text-white/40 font-semibold cursor-pointer w-fit hover:text-primary transition-colors group"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRepostChain();
                        }}
                    >
                        <Repeat2 size={13} className="text-primary" />
                        <span className="flex items-center gap-1.5">
                            <MapPinAvatar src={sharerAvatar} fallbackInitial={sharerInitial} size="xs" />
                            shared from <span className="text-primary font-bold group-hover:underline">@{sharerUsername}</span>
                        </span>
                        <GitFork size={10} className="opacity-0 group-hover:opacity-70 transition-opacity text-primary" />
                    </div>
                );
            })()}

            {/* Header Row */}
            <div className="flex items-start justify-between gap-3 w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                        <Link href={`/profile/${authorUsername}`} onClick={handleProfileClick} className="block transition-transform hover:scale-105 active:scale-95 drop-shadow-[0_4px_6px_rgba(0,0,0,0.08)]">
                            <MapPinAvatar
                                src={authorAvatar}
                                alt={authorName}
                                fallbackInitial={authorName[0]?.toUpperCase()}
                                size="md"
                            />
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

                <div className="flex items-center gap-3 shrink-0 mt-0.5">
                    <PostCardFollowButton
                        visible={canFollow}
                        isFollowing={isFollowing}
                        isPending={isFollowPending}
                        onToggle={toggleFollow}
                    />
                    {post.isPinned && (
                        <Pin size={16} className="text-status-warning fill-status-warning" />
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
            <div className="mt-2.5 w-full">
                {isQuoteRepost ? renderRepostBody() : (
                    <div className="flex flex-col gap-0">
                        {renderTextContent()}
                        {hasMedia && (
                            <div className="-mx-3">
                                {renderMedia()}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {narrativeBlock}

            {/* Action Bar (Horizontal Row) */}
            <div className="post-card-action-bar flex items-center justify-between mt-3 pt-2.5 border-t border-black/[0.05] text-[11px] font-semibold text-[#6B7280] w-full">
                {/* Comment action */}
                <button
                    onClick={(e) => { e.stopPropagation(); onComment(); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-black/[0.04] transition-all active:scale-95 cursor-pointer group"
                    aria-label="Comment"
                >
                    <XReplyIcon size={17} className="group-hover:text-[#111827]" />
                    <span className="tabular-nums font-bold">{post.comments ? formatCompactCount(post.comments) : '0'}</span>
                </button>

                {/* FYI Helpful action / Repost action */}
                {post.contentType === 'fyi' && onHelpful ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onHelpful(); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer group ${post.isHelpful ? 'text-[#008A20] bg-emerald-50' : 'text-[#6B7280] hover:text-[#008A20] hover:bg-emerald-50'}`}
                        aria-label="Helpful"
                    >
                        <XThumbUpIcon size={17} filled={!!post.isHelpful} className={post.isHelpful ? 'text-[#008A20]' : 'group-hover:text-[#008A20]'} />
                        <span className="tabular-nums font-bold">{post.helpfulCount ? formatCompactCount(post.helpfulCount) : '0'}</span>
                    </button>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleInstantRepost(); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer group ${post.isShared ? 'text-[#008A20] bg-emerald-50' : 'text-[#6B7280] hover:text-[#008A20] hover:bg-emerald-50'}`}
                        aria-label="Repost"
                    >
                        <XRepostIcon size={17} className={post.isShared ? 'text-[#008A20]' : 'group-hover:text-[#008A20]'} />
                        <span className="tabular-nums font-bold">
                            {post.shares ? formatCompactCount(post.shares) : '0'}
                        </span>
                    </button>
                )}

                {/* Like action */}
                <button
                    onClick={(e) => { e.stopPropagation(); onLike(); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer group ${post.isLiked ? 'text-rose-600 bg-rose-50' : 'text-[#6B7280] hover:text-rose-600 hover:bg-rose-50'}`}
                    aria-label="Like"
                >
                    <XLikeIcon size={17} filled={post.isLiked} className={post.isLiked ? 'text-rose-600' : 'group-hover:text-rose-600'} />
                    <span className="tabular-nums font-bold">{post.likes ? formatCompactCount(post.likes) : '0'}</span>
                </button>

                {/* Save action */}
                <button
                    onClick={(e) => { e.stopPropagation(); onSave(); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer group ${post.isSaved ? 'text-[#008A20] bg-emerald-50' : 'text-[#6B7280] hover:text-[#008A20] hover:bg-emerald-50'}`}
                    aria-label="Bookmark"
                >
                    <XBookmarkIcon size={17} filled={post.isSaved} className={post.isSaved ? 'text-[#008A20]' : 'group-hover:text-[#008A20]'} />
                </button>

                {/* Share action */}
                <button
                    onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-black/[0.04] transition-all active:scale-95 cursor-pointer group"
                    aria-label="Share"
                >
                    <XShareIcon size={17} className="group-hover:text-[#111827]" />
                </button>
            </div>


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
