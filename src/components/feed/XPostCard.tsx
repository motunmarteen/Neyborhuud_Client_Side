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
    const elevationClass = hasMedia ? 'feed-card--media' : '';

    const cardStyleClass = isSafetyAlert
        ? 'border-b border-black/5 dark:border-white/5'
        : 'border-b border-black/5 dark:border-white/5 shadow-none';

    const renderFormattedText = (text: string) => {
        if (!text) return null;
        // Split text by URLs, Emails, Mentions (@), and Hashtags (#)
        // Order matters: URLs/Emails first, then Mentions so we don't accidentally split an email.
        const regex = /(https?:\/\/[^\s]+|www\.[^\s]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|(?<!\w)@\w+|(?<!\w)#\w+)/g;
        const parts = text.split(regex);
        
        return parts.map((part, i) => {
            if (!part) return null;
            
            // Is it a URL?
            if (/^(https?:\/\/|www\.)[^\s]+$/.test(part)) {
                const href = part.startsWith('http') ? part : `https://${part}`;
                return (
                    <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {part}
                    </a>
                );
            }
            // Is it an email?
            if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(part)) {
                return (
                    <a key={i} href={`mailto:${part}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {part}
                    </a>
                );
            }
            // Is it a mention?
            if (/^@\w+$/.test(part)) {
                return (
                    <Link key={i} href={`/profile/${part.slice(1)}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {part}
                    </Link>
                );
            }
            // Is it a hashtag?
            if (/^#\w+$/.test(part)) {
                return (
                    <Link key={i} href={`/explore?q=${encodeURIComponent(part)}`} className="text-brand-blue hover:underline" onClick={(e) => e.stopPropagation()}>
                        {part}
                    </Link>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    const renderTextContent = () => {
        if (!hasText) return null;
        const isLongText = displayText.length > 280;

        return (
            <div className={`relative text-[14px] font-normal text-[#050505] dark:text-[#E4E6EB] leading-[1.45] tracking-normal whitespace-pre-wrap break-words ${!expanded && isLongText ? 'max-h-[140px] overflow-hidden' : ''}`}>
                {renderFormattedText(displayText)}
                
                {!expanded && isLongText && (
                    <div className="post-read-more-fade absolute bottom-0 left-0 right-0 h-16 pointer-events-none flex items-end pb-0.5">
                        <button
                            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                            className="pointer-events-auto text-primary hover:text-brand-green-dark font-semibold hover:underline cursor-pointer px-1 -ml-1 rounded"
                        >
                            Read more
                        </button>
                    </div>
                )}
                {expanded && isLongText && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                        className="block mt-2 text-primary hover:text-brand-green-dark font-semibold hover:underline cursor-pointer"
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
            className={`bg-white dark:bg-[#121b14] px-3 py-2.5 mx-auto w-full select-none ${cardStyleClass} ${elevationClass} max-w-none rounded-none flex flex-col gap-0`}
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
                            <span className="material-symbols-outlined text-[13px] text-brand-green" style={{ transform: 'scaleX(-1)' }}>reply</span>
                            <span className="flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full overflow-hidden border-[1px] border-white/60 dark:border-white/10 bg-white dark:bg-[#1A221C] shrink-0">
                                    {sharerAvatar ? (
                                        <img src={sharerAvatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center text-[7px] font-black text-white" style={{ background: 'linear-gradient(135deg, #00c431, #009924)' }}>{sharerInitial}</span>
                                    )}
                                </span>
                                reposted by <span className="text-brand-green font-bold group-hover:underline">@{sharerUsername}</span>
                            </span>
                            <span className="material-symbols-outlined text-[10px] opacity-0 group-hover:opacity-70 transition-opacity text-brand-green">hub</span>
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
                        <span className="material-symbols-outlined text-[13px] text-primary" style={{ transform: 'scaleX(-1)' }}>reply</span>
                        <span className="flex items-center gap-1.5">
                            {/* Mini avatar of the sharer */}
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full overflow-hidden border-[1px] border-white/60 dark:border-white/10 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.05)] bg-white dark:bg-[#1A221C] shrink-0">
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
            <div className="flex items-start justify-between gap-3 w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                        <Link href={`/profile/${authorUsername}`} onClick={handleProfileClick}>
                            <div className="post-card-avatar flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-white/60 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.08),inset_0_2px_4px_rgba(255,255,255,0.4)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.05)] bg-white dark:bg-[#1A221C] transition-transform hover:scale-105 active:scale-95">
                                {authorAvatar && !imageError ? (
                                    <Image
                                        src={authorAvatar}
                                        alt={authorName}
                                        fill
                                        sizes="44px"
                                        className="object-cover"
                                        onError={() => setImageError(true)}
                                        unoptimized
                                    />
                                ) : (
                                    <span className="material-symbols-outlined text-[20px] text-neu-text-secondary dark:text-white/60">person</span>
                                )}
                            </div>
                        </Link>
                        <PostCardVerificationBadge
                            author={author}
                            hidden={isAnonymousAuthor}
                            withAvatarBackground
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
            <div className="post-card-action-bar flex items-center justify-between mt-3 text-[11px] font-bold w-full">
                {/* Comment action */}
                <button
                    onClick={(e) => { e.stopPropagation(); onComment(); }}
                    className="post-card-action-bar__btn flex items-center gap-1.5 px-2 py-1 text-neu-text-secondary dark:text-white/60 hover:text-brand-blue transition-colors duration-200 active:scale-95 cursor-pointer group"
                    aria-label="Comment"
                >
                    <XReplyIcon size={18} className="group-hover:text-brand-blue group-hover:animate-dance-comment" />
                    <span className="group-hover:text-brand-blue tabular-nums transition-colors duration-200">{post.comments ? formatCompactCount(post.comments) : '0'}</span>
                </button>

                {/* FYI Helpful action / Repost action */}
                {post.contentType === 'fyi' && onHelpful ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onHelpful(); }}
                        className={`post-card-action-bar__btn flex items-center gap-1.5 px-2 py-1 transition-colors duration-200 cursor-pointer group ${post.isHelpful ? 'text-primary' : 'text-neu-text-secondary dark:text-white/60 hover:text-primary'}`}
                        aria-label="Helpful"
                    >
                        <XThumbUpIcon size={18} filled={!!post.isHelpful} className="group-hover:text-primary" />
                        <span className="group-hover:text-primary tabular-nums">{post.helpfulCount ? formatCompactCount(post.helpfulCount) : '0'}</span>
                    </button>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleInstantRepost(); }}
                        className={`post-card-action-bar__btn flex items-center gap-1.5 px-2 py-1 transition-colors duration-200 active:scale-95 cursor-pointer group ${post.isShared ? 'text-brand-green-dark' : 'text-neu-text-secondary dark:text-white/60 hover:text-brand-green-dark'}`}
                        aria-label="Repost"
                    >
                        <XRepostIcon size={18} className={`${post.isShared ? 'text-brand-green-dark' : 'group-hover:text-brand-green-dark'} group-hover:animate-dance-repost`} />
                        <span className={`${post.isShared ? 'text-brand-green-dark' : 'group-hover:text-brand-green-dark'} tabular-nums transition-colors duration-200`}>
                            {post.shares ? formatCompactCount(post.shares) : '0'}
                        </span>
                    </button>
                )}

                {/* Like action */}
                <button
                    onClick={(e) => { e.stopPropagation(); onLike(); }}
                    className={`post-card-action-bar__btn flex items-center gap-1.5 px-2 py-1 transition-colors duration-200 active:scale-95 cursor-pointer group ${post.isLiked ? 'text-brand-red' : 'text-neu-text-secondary dark:text-white/60 hover:text-brand-red'}`}
                    aria-label="Like"
                >
                    <XLikeIcon size={18} filled={post.isLiked} className={`group-active:scale-75 group-hover:animate-dance-like group-hover:text-brand-red ${post.isLiked ? 'text-brand-red' : ''}`} />
                    <span className="group-hover:text-brand-red tabular-nums transition-colors duration-200">{post.likes ? formatCompactCount(post.likes) : '0'}</span>
                </button>

                {/* Views moved to bottom sheet to save space */}

                {/* Save action */}
                <button
                    onClick={(e) => { e.stopPropagation(); onSave(); }}
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
