/**
 * XPostCard — Immersive feed card
 * Three modes: text-only (ambient spheres), media-only (full-bleed), mixed (media bg + text panel)
 * iOS-inspired Liquid Glass action rail
 */

import { MediaItem, Post, PostAuthor } from '@/types/api';
import { useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatTimeAgo } from '@/utils/timeAgo';
import { useFollow } from '@/hooks/useFollow';
import { chatService } from '@/services/chat.service';
import ShareModal from './ShareModal';
import { SPHERE_PALETTES, TYPE_BADGE, EMERGENCY_ACTION_CLS } from '@/lib/brand-styles';
import { useLongPress } from '@/hooks/useLongPress';
import { LongPressMenu, type LongPressMenuItem } from '@/components/ui/LongPressMenu';

const CARD_HEIGHT = '90vh';
const TEXT_CARD_HEIGHT = 'min(58vh, 440px)';

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);

const formatCompactCount = (value?: number) => {
    if (!value) return undefined;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
    return `${value}`;
};

// ── iOS 26 Liquid Glass action button ─────────────────────────────────────────
interface GlassBtnProps {
    icon: string;
    count?: number;
    active?: boolean;
    activeIconClass?: string;
    onClick: (e: React.MouseEvent) => void;
    label?: string;
    filled?: boolean;
}

function GlassBtn({ icon, count, active, activeIconClass, onClick, label, filled }: GlassBtnProps) {
    const [burst, setBurst] = useState(false);
    const handleClick = (e: React.MouseEvent) => {
        if (filled && !active) {
            setBurst(true);
            window.setTimeout(() => setBurst(false), 420);
        }
        onClick(e);
    };
    return (
        <button
            onClick={handleClick}
            className="group flex flex-col items-center gap-1 transition-transform duration-200 ease-out active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/60"
            aria-label={label}
        >
            <span
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 group-hover:scale-105"
                style={{
                    background: active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.10)',
                    backdropFilter: 'blur(16px) saturate(170%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(170%)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
            >
                <span
                    className={`material-symbols-outlined text-[21px] transition-transform duration-200 ${burst ? 'animate-like-burst' : ''} ${active ? (activeIconClass || 'text-white') : 'text-white'}`}
                    style={{
                        ...(filled && active ? { fontVariationSettings: '"FILL" 1' } : {}),
                        filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.55))',
                    }}
                >
                    {icon}
                </span>
            </span>
            {(count !== undefined && count > 0) && (
                <span className="text-[10px] font-black tracking-tight text-white" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>
                    {formatCompactCount(count)}
                </span>
            )}
            {label && !(count !== undefined && count > 0) && (
                <span className="text-[9px] font-semibold text-white/80" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>{label}</span>
            )}
        </button>
    );
}

// ── Emergency action buttons ───────────────────────────────────────────────────
function EmergencyActions({ post, onEmergencyAction }: { post: Post; onEmergencyAction: (a: string) => void }) {
    const actions = [
        { key: 'acknowledge', icon: 'visibility', label: 'Seen', active: post.isAcknowledged, cls: EMERGENCY_ACTION_CLS.acknowledge },
        { key: 'aware', icon: 'notifications_active', label: 'Aware', active: post.isAware, cls: EMERGENCY_ACTION_CLS.aware },
        { key: 'nearby', icon: 'location_on', label: 'Nearby', active: post.isNearby, cls: EMERGENCY_ACTION_CLS.nearby },
        { key: 'safe', icon: 'shield', label: 'Safe', active: post.isSafe, cls: EMERGENCY_ACTION_CLS.safe },
        { key: 'confirm', icon: 'check_circle', label: 'Confirm', active: post.confirmDisputeAction === 'confirm', cls: EMERGENCY_ACTION_CLS.confirm },
        { key: 'dispute', icon: 'cancel', label: 'Dispute', active: post.confirmDisputeAction === 'dispute', cls: EMERGENCY_ACTION_CLS.dispute },
    ].filter(a => !post.availableActions || post.availableActions.includes(a.key));

    return (
        <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-white/10 bg-black/50 backdrop-blur-md">
            {actions.map(a => (
                <button
                    key={a.key}
                    onClick={(e) => { e.stopPropagation(); onEmergencyAction(a.key); }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all ${
                        a.active ? a.cls : 'bg-white/10 text-white/70 border-white/15 hover:bg-white/15'
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
    userLocation?: { lat: number; lng: number } | null;
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
}: XPostCardProps) {
    const [imageError, setImageError] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [longPressOpen, setLongPressOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();

    const longPress = useLongPress(() => setLongPressOpen(true));

    const author = post.author as PostAuthor;
    const authorName = author?.name || 'Anonymous';
    const authorUsername = author?.username || 'user';
    const authorAvatar = author?.avatarUrl || author?.profilePicture || null;

    const isAnonymousAuthor = !author?.id || author.id === 'anonymous';
    const isOwnerPost = currentUserId && (author?.id === currentUserId || post.authorId === currentUserId);

    const handleMessageAuthor = useCallback(async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const authorId = author?.id;
        if (!authorId || isAnonymousAuthor) return;
        try {
            const res = await chatService.getOrCreateDirectConversation(authorId);
            const conv = (res.data as any)?.conversation ?? (res.data as any);
            const convId = conv?._id ?? conv?.conversationId ?? conv?.id;
            if (convId) router.push(`/chat/${convId}`);
        } catch { /* silent */ }
    }, [author?.id, isAnonymousAuthor, router]);

    const canFollow = !isOwnerPost && !isAnonymousAuthor;
    const { isFollowing, toggleFollow, isPending: isFollowPending } = useFollow(
        canFollow ? author?.id : undefined,
        { enabled: canFollow && !!author?.id }
    );

    const mediaItems: Array<{ url: string; type?: MediaItem['type']; thumbnailUrl?: string }> = Array.isArray(post.media)
        ? post.media
            .map((m) => (typeof m === 'string' ? { url: m } : { url: m.url, type: m.type, thumbnailUrl: m.thumbnailUrl }))
            .filter((m) => Boolean(m.url))
        : [];
    const mediaUrls = mediaItems.map((m) => m.url);
    const primaryMedia = mediaItems[0];
    const isPrimaryVideo = Boolean(primaryMedia && (primaryMedia.type === 'video' || isVideoUrl(primaryMedia.url)));

    const isSafetyAlert =
        post.contentType === 'emergency' ||
        post.cardStyle === 'emergency_red' ||
        post.tags?.includes('safety') ||
        post.tags?.includes('SAFETY') ||
        (post as unknown as Record<string, unknown>).category === 'SAFETY';

    const feedLayerLabel =
        post._feedLayer === 'explore' ? 'Street Radar' :
        post._feedLayer === 'extended' ? 'Following Places' :
        'Your Huud';

    const severityLabel = post.severity ? post.severity.toUpperCase() : null;

    const hasMedia = mediaUrls.length > 0;
    const textContent = post.content || post.body || '';
    const hasText = textContent.trim().length > 0;

    const mode: 'text' | 'media' | 'mixed' = hasMedia ? (hasText ? 'mixed' : 'media') : 'text';

    const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;
    const textSizeClass =
        wordCount <= 6  ? 'text-[32px] leading-tight' :
        wordCount <= 15 ? 'text-[24px] leading-snug' :
        wordCount <= 35 ? 'text-[19px] leading-snug' :
        wordCount <= 70 ? 'text-[16px] leading-relaxed' :
        'text-[14px] leading-relaxed';

    const spheres = SPHERE_PALETTES[post.contentType || 'post'] || SPHERE_PALETTES.post;
    const typeBadge = post.contentType ? TYPE_BADGE[post.contentType] : undefined;

    const handleProfileClick = (e: React.MouseEvent) => e.stopPropagation();

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('a')) onCardClick?.();
    };

    const longPressItems: LongPressMenuItem[] = useMemo(() => {
        const postId = post.id ?? (post as { _id?: string })._id ?? '';
        const items: LongPressMenuItem[] = [
            { id: 'save',    label: 'Save post', icon: 'bookmark',    onSelect: onSave },
            { id: 'share',   label: 'Share',     icon: 'share',       onSelect: () => setShowShare(true) },
            { id: 'comment', label: 'Comment',   icon: 'chat_bubble', onSelect: onComment },
        ];
        if (!isOwnerPost && !isAnonymousAuthor) {
            items.push({ id: 'message', label: 'Message', icon: 'chat', onSelect: () => handleMessageAuthor() });
        }
        if (isOwnerPost && onEdit) {
            items.push({ id: 'edit', label: 'Edit', icon: 'edit', onSelect: () => onEdit(post) });
        }
        if (isOwnerPost && onPin && postId) {
            items.push({ id: 'pin', label: post.isPinned ? 'Extend Pin' : 'Pin to Feed', icon: 'push_pin', onSelect: () => onPin(postId) });
        }
        if (isOwnerPost && onDelete && postId) {
            items.push({ id: 'delete', label: 'Delete', icon: 'delete', danger: true, onSelect: () => onDelete(postId) });
        }
        if (onReport && postId && !isOwnerPost) {
            items.push({ id: 'report', label: 'Report', icon: 'flag', danger: true, onSelect: () => onReport(postId) });
        }
        return items;
    }, [post, onSave, onComment, onReport, onEdit, onDelete, onPin, isOwnerPost, isAnonymousAuthor, handleMessageAuthor]);

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

    const longPressMenu = (
        <LongPressMenu open={longPressOpen} onClose={() => setLongPressOpen(false)} items={longPressItems} />
    );

    // ── Shared: Top utility layer ─────────────────────────────────────────────
    const authorHeader = (
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 px-4 pt-4 pb-20 bg-gradient-to-b from-black/60 via-black/18 to-transparent">
            <div className="pointer-events-auto flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {typeBadge && (
                        <span
                            className={`text-[9px] px-2.5 py-[4px] rounded-full font-black tracking-[0.08em] uppercase border ${typeBadge.cls}`}
                            style={{ backdropFilter: 'blur(14px) saturate(160%)', WebkitBackdropFilter: 'blur(14px) saturate(160%)' }}
                        >
                            {typeBadge.label}
                        </span>
                    )}
                    <span
                        className="inline-flex items-center gap-1 text-[9px] px-2.5 py-[4px] rounded-full font-bold tracking-[0.06em] uppercase text-white/75"
                        style={{
                            background: 'rgba(255,255,255,0.12)',
                            backdropFilter: 'blur(14px) saturate(160%)',
                            WebkitBackdropFilter: 'blur(14px) saturate(160%)',
                            border: '1px solid rgba(255,255,255,0.16)',
                        }}
                    >
                        <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: '"FILL" 1' }}>location_on</span>
                        {feedLayerLabel}
                    </span>
                </div>
                <div className="relative shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); setLongPressOpen(true); }}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white/75 transition-all hover:scale-105 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black/50"
                        style={{
                            background: 'rgba(255,255,255,0.11)',
                            backdropFilter: 'blur(16px) saturate(170%)',
                            border: '1px solid rgba(255,255,255,0.16)',
                        }}
                        aria-label="Post options"
                        aria-haspopup="dialog"
                    >
                        <span className="material-symbols-outlined text-[19px]">more_horiz</span>
                    </button>
                </div>
            </div>
        </div>
    );

    // ── Shared: Action rail ───────────────────────────────────────────────────
    const actionRail = (
        <div className="feed-post-card__action-rail absolute right-3 z-30 flex flex-col items-center gap-2.5 sm:right-4">
            <GlassBtn
                icon="favorite"
                count={post.likes || undefined}
                active={post.isLiked === true}
                activeIconClass="text-brand-red"
                filled
                onClick={(e) => { e.stopPropagation(); onLike(); }}
                label={post.isLiked ? 'Unlike' : 'Like'}
            />
            <GlassBtn
                icon="chat_bubble"
                count={post.comments || undefined}
                onClick={(e) => { e.stopPropagation(); onComment(); }}
                label="Comment"
            />
            <GlassBtn
                icon="send"
                onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
                label="Share"
            />
            <GlassBtn
                icon="bookmark"
                active={post.isSaved === true}
                activeIconClass="text-white"
                filled
                onClick={(e) => { e.stopPropagation(); onSave(); }}
                label={post.isSaved ? 'Saved' : undefined}
            />
            {post.contentType === 'fyi' && onHelpful && (
                <GlassBtn
                    icon="thumb_up"
                    count={(post.helpfulCount || 0) || undefined}
                    active={post.isHelpful === true}
                    activeIconClass="text-primary"
                    filled
                    onClick={(e) => { e.stopPropagation(); onHelpful(); }}
                label="Helpful"
                />
            )}
            {(post.views || 0) > 0 && (
                <div className="flex flex-col items-center gap-0.5">
                    <span className="material-symbols-outlined text-[18px] text-white/35">visibility</span>
                    <span className="text-[10px] font-medium text-white/45">{formatCompactCount(post.views)}</span>
                </div>
            )}
        </div>
    );

    const renderBottomAuthorPanel = (includeText = mode !== 'text') => (
        <div className="feed-post-card__author-panel absolute left-4 right-[76px] z-20 sm:left-5 sm:right-24">
            <div className="flex max-w-[560px] flex-col gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                        <Link href={`/profile/${authorUsername}`} onClick={handleProfileClick}>
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10">
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
                                    <span className="material-symbols-outlined text-[18px] text-white/55">person</span>
                                )}
                            </div>
                        </Link>
                        {canFollow && !isFollowing && (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
                                disabled={isFollowPending}
                                className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-black/30 bg-primary text-black shadow-lg transition-transform hover:scale-110 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[11px] font-bold">add</span>
                            </button>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1">
                            <Link
                                href={`/profile/${authorUsername}`}
                                onClick={handleProfileClick}
                                className="block max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-black leading-[1.05] text-white hover:underline"
                                style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}
                            >
                                {isAnonymousAuthor ? 'Anonymous Neyborh' : authorName}
                            </Link>
                            {author?.isVerified && (
                                <span
                                    className={`material-symbols-outlined icon-filled text-[13px] shrink-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] ${
                                        author.verificationBadge === 'emergency_responder' ? 'text-brand-red' :
                                        author.verificationBadge === 'community_leader'   ? 'text-status-warning' :
                                        'text-brand-blue'
                                    }`}
                                    aria-label={
                                        author.verificationBadge === 'emergency_responder' ? 'Emergency responder' :
                                        author.verificationBadge === 'community_leader'   ? 'Community leader' :
                                        'Verified Neyborh'
                                    }
                                    role="img"
                                >
                                    {author.verificationBadge === 'emergency_responder' ? 'shield' : 'verified'}
                                </span>
                            )}
                        </div>
                        <div className="mt-1 text-[10px] font-bold leading-none text-white/58">
                            {formatTimeAgo(post.createdAt)}
                        </div>
                    </div>
                </div>
                {includeText && hasText && (
                    <p
                        className={`${mode === 'text' ? textSizeClass : 'text-[14px] leading-snug sm:text-[15px]'} line-clamp-4 whitespace-pre-wrap break-words font-semibold text-white`}
                        style={{ textShadow: '0 2px 18px rgba(0,0,0,0.92)' }}
                    >
                        {textContent}
                    </p>
                )}

                <div className="flex flex-col gap-2">
                    {eventBlock}
                    {marketBlock}
                    {tagsBlock}
                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <span className="text-[10px] italic text-white/35">edited</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onComment(); }}
                    className="flex h-9 w-full max-w-[230px] items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 text-left text-[12px] font-medium text-white/65 backdrop-blur-md transition-all hover:border-white/25 hover:bg-white/15 hover:text-white/85 active:scale-[0.98]"
                    aria-label="Add comment"
                    style={{ WebkitBackdropFilter: 'blur(12px)' }}
                >
                    <span className="material-symbols-outlined text-[16px] text-white/55">chat_bubble</span>
                    Say something…
                </button>
            </div>
        </div>
    );

    // ── Shared: structured content blocks ────────────────────────────────────
    const eventBlock = post.contentType === 'event' && post.eventDate ? (
        <div
            className="flex flex-wrap items-center gap-2 p-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
        >
            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-brand-blue">
                <span className="material-symbols-outlined text-[13px]" aria-hidden>calendar_today</span>
                {new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(post.eventDate))}
            </span>
            {post.eventTime && (
                <span className="inline-flex items-center gap-1 text-[11px] text-white/65">
                    <span className="material-symbols-outlined text-[13px]" aria-hidden>schedule</span>
                    {post.eventTime}
                </span>
            )}
            {post.venue?.name && (
                <span className="inline-flex items-center gap-1 text-[11px] text-white/65">
                    <span className="material-symbols-outlined text-[13px]" aria-hidden>location_on</span>
                    {post.venue.name}
                </span>
            )}
            {post.ticketInfo === 'paid' && post.ticketPrice && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-blue/30 text-white/90 font-bold">₦{Number(post.ticketPrice).toLocaleString()}</span>
            )}
            {post.ticketInfo === 'free' && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/30 text-primary font-bold">FREE</span>
            )}
            {post.eventCategory && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/55 font-medium capitalize">{post.eventCategory}</span>
            )}
        </div>
    ) : null;

    const marketBlock = post.contentType === 'marketplace' ? (
        <div
            className="flex flex-wrap items-center gap-2 p-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
        >
            {post.price != null && <span className="text-base font-bold text-primary">₦{Number(post.price).toLocaleString()}</span>}
            {post.isNegotiable && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-white/90 font-medium">Negotiable</span>}
            {post.itemCondition && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-white/90 font-medium capitalize">
                    {post.itemCondition === 'used' ? 'Tokunbo' : post.itemCondition}
                </span>
            )}
            {post.itemCategory && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/55 font-medium">{post.itemCategory}</span>}
            {post.deliveryOption && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/55 font-medium capitalize">{post.deliveryOption}</span>}
            {post.availability && post.availability !== 'available' && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${post.availability === 'sold' ? 'bg-brand-red/30 text-brand-red' : 'bg-primary/30 text-primary'}`}>
                    {post.availability === 'sold' ? 'SOLD' : 'RESERVED'}
                </span>
            )}
        </div>
    ) : null;

    const tagsBlock = post.tags && post.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag, i) => (
                <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold text-white/70"
                    style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)' }}
                >
                    #{tag}
                </span>
            ))}
        </div>
    ) : null;

    const pinnedBadge = post.isPinned ? (
        <div
            className="absolute top-4 left-4 z-40 flex items-center gap-1 px-2.5 py-1.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.95)', backdropFilter: 'blur(10px)' }}
        >
            <span className="material-symbols-outlined text-[12px] text-black" style={{ fontVariationSettings: '"FILL" 1' }}>push_pin</span>
            <span className="text-black text-[10px] font-black uppercase tracking-wide">Pinned</span>
        </div>
    ) : null;

    const safetyAlertPill = isSafetyAlert ? (
        <div className="absolute left-4 top-[64px] z-30 flex items-center gap-1.5 rounded-full border border-brand-red/30 bg-brand-red/25 px-3 py-1.5 backdrop-blur-md">
            <span className="material-symbols-outlined text-[14px] text-brand-red300">warning</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-red100">Safety Alert</span>
            {severityLabel && <span className="rounded-full bg-brand-red/30 px-1.5 py-0.5 text-[10px] font-bold text-brand-red100">{severityLabel}</span>}
        </div>
    ) : null;

    const multiMediaIndicator = mediaUrls.length > 1 ? (
        <div
            className="absolute right-16 top-4 z-30 flex items-center gap-1 rounded-full px-2.5 py-1.5"
            style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.16)' }}
        >
            <span className="material-symbols-outlined text-[14px] text-white">photo_library</span>
            <span className="text-[11px] font-bold text-white">{mediaUrls.length}</span>
        </div>
    ) : null;

    const mediaBackground = primaryMedia ? (
        <div className="absolute inset-0">
            {isPrimaryVideo ? (
                <>
                <video
                    ref={videoRef}
                    src={primaryMedia.url}
                    poster={primaryMedia.thumbnailUrl}
                    className="h-full w-full object-cover"
                    muted={isMuted}
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                    aria-label={textContent ? textContent.slice(0, 120) : `Video post by ${authorName}`}
                />
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsMuted(v => !v); }}
                    className="feed-post-card__mute-btn absolute top-14 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black/50"
                    aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                    <span className="material-symbols-outlined text-[16px] text-white">
                        {isMuted ? 'volume_off' : 'volume_up'}
                    </span>
                </button>
                </>
            ) : (
                <Image
                    src={primaryMedia.url}
                    alt={textContent ? textContent.slice(0, 120) : `Post by ${authorName}`}
                    fill
                    sizes="(max-width: 672px) 100vw, 672px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                    loading="lazy"
                    unoptimized
                />
            )}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.10) 28%, rgba(0,0,0,0.12) 52%, rgba(0,0,0,0.92) 100%)',
                }}
            />
            <div
                aria-hidden
                className="absolute inset-0 opacity-70"
                style={{
                    background: 'radial-gradient(circle at 84% 44%, rgba(0,255,190,0.18), transparent 28%), radial-gradient(circle at 8% 88%, rgba(0,111,53,0.20), transparent 34%)',
                }}
            />
            <div aria-hidden className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full border border-primary/30/20 blur-[0.3px]" />
        </div>
    ) : null;

    // ── TEXT-ONLY MODE ────────────────────────────────────────────────────────
    if (mode === 'text') {
        return (
            <>
            <article
                className={`feed-post-card group relative mx-auto w-full cursor-pointer overflow-hidden rounded-none border-y border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.50)] sm:max-w-[480px] sm:rounded-[32px] sm:border ${isSafetyAlert ? 'ring-2 ring-brand-red/50' : ''}`}
                style={{ background: 'var(--brand-black)', height: TEXT_CARD_HEIGHT, minHeight: '320px' }}
                {...articleGestureProps}
            >
                {/* Ambient sphere background */}
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-28 -left-28 h-[360px] w-[360px] rounded-full animate-soft-float" style={{ background: spheres[0], filter: 'blur(96px)' }} />
                    <div className="absolute top-[28%] -right-24 h-[340px] w-[340px] rounded-full" style={{ background: spheres[1], filter: 'blur(88px)' }} />
                    <div className="absolute -bottom-24 left-[8%] h-[320px] w-[320px] rounded-full animate-soft-float" style={{ background: spheres[2], filter: 'blur(82px)', animationDelay: '1.2s' }} />
                    <div className="absolute -right-24 bottom-20 h-80 w-80 rounded-full border border-primary/30/20" />
                    <div className="absolute -right-10 bottom-16 h-96 w-96 rounded-full border border-brand-green-dark/30/15" />
                </div>
                {/* Subtle vignette */}
                <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 38%, transparent 26%, rgba(0,0,0,0.62) 100%), linear-gradient(180deg, rgba(0,0,0,0.60), transparent 30%, rgba(0,0,0,0.86))' }} />

                {pinnedBadge}

                {safetyAlertPill}

                {authorHeader}
                {actionRail}

                {/* Center: hero text */}
                <div
                    className="absolute inset-x-0 z-20 flex flex-col justify-center gap-4 px-6 pr-20"
                    style={{ top: '88px', bottom: '178px' }}
                >
                    {/* Priority badge */}
                    {post.priority && post.priority !== 'normal' && (
                        <span
                            className={`self-start text-[10px] px-2.5 py-1 rounded-full font-bold backdrop-blur-sm border ${
                                post.priority === 'critical' ? 'bg-brand-red/25 text-brand-red border-brand-red/25' :
                                post.priority === 'high' ? 'bg-brand-red/25 text-brand-red border-brand-red/25' :
                                'bg-brand-blue/25 text-brand-blue border-brand-blue/25'
                            }`}
                        >
                            {post.priority.charAt(0).toUpperCase() + post.priority.slice(1)} Priority
                        </span>
                    )}

                    {/* Main text */}
                    <p
                        className={`whitespace-pre-wrap break-words font-black tracking-[-0.035em] text-white ${textSizeClass}`}
                        style={{ textShadow: '0 3px 34px rgba(0,0,0,0.65), 0 0 34px rgba(0,212,49,0.18)' }}
                    >
                        {textContent}
                    </p>

                    {eventBlock}
                    {marketBlock}

                    {/* Cultural context */}
                    {post.culturalContext && post.culturalContext.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {post.culturalContext.map((ctx, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-blue/20 text-white/90 border border-brand-blue/20 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-[12px]">language</span>
                                    {ctx}
                                </span>
                            ))}
                        </div>
                    )}

                    {tagsBlock}

                    {post.fyiStatus && post.fyiStatus !== 'active' && (
                        <span className={`self-start text-[10px] px-2.5 py-1 rounded-full font-bold backdrop-blur-sm border ${
                            ['found','returned','resolved'].includes(post.fyiStatus)
                                ? 'bg-primary/25 text-primary border-brand-green-dark/20'
                                : 'bg-white/10 text-white/60 border-white/10'
                        }`}>
                            {post.fyiStatus.charAt(0).toUpperCase() + post.fyiStatus.slice(1)}
                        </span>
                    )}

                    {post.expiresAt && (
                        <span className="self-start text-[10px] px-2.5 py-1 rounded-full bg-primary/20 text-primary200 font-medium border border-yellow-400/20 backdrop-blur-sm">
                            Expires {new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(post.expiresAt))}
                        </span>
                    )}

                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <span className="text-[10px] italic text-white/25">edited</span>
                    )}
                </div>

                {renderBottomAuthorPanel(false)}

                {/* Emergency actions — bottom strip */}
                {isSafetyAlert && onEmergencyAction && (
                    <div className="absolute bottom-0 left-0 right-0 z-30">
                        <EmergencyActions post={post} onEmergencyAction={onEmergencyAction} />
                    </div>
                )}
            </article>
            {showShare && (
                <ShareModal postId={post.id ?? post._id ?? ''} postContent={post.content ?? ''} onClose={() => setShowShare(false)} />
            )}
            {longPressMenu}
            </>
        );
    }

    // ── MEDIA-ONLY MODE ───────────────────────────────────────────────────────
    if (mode === 'media') {
        return (
            <>
            <article
                className={`feed-post-card group relative mx-auto w-full cursor-pointer overflow-hidden rounded-none border-y border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.50)] sm:max-w-[480px] sm:rounded-[32px] sm:border ${isSafetyAlert ? 'ring-2 ring-brand-red/50' : ''}`}
                style={{ height: CARD_HEIGHT, minHeight: CARD_HEIGHT }}
                {...articleGestureProps}
            >
                {mediaBackground}

                {pinnedBadge}
                {multiMediaIndicator}
                {safetyAlertPill}

                {authorHeader}
                {actionRail}
                {renderBottomAuthorPanel(false)}

                {/* Emergency actions */}
                {isSafetyAlert && onEmergencyAction && (
                    <div className="absolute bottom-0 left-0 right-0 z-30">
                        <EmergencyActions post={post} onEmergencyAction={onEmergencyAction} />
                    </div>
                )}
            </article>
            {showShare && (
                <ShareModal postId={post.id ?? post._id ?? ''} postContent={post.content ?? ''} onClose={() => setShowShare(false)} />
            )}
            {longPressMenu}
            </>
        );
    }

    // ── MIXED MODE (media + text) ─────────────────────────────────────────────
    return (
        <>
        <article
            className={`feed-post-card group relative mx-auto w-full cursor-pointer overflow-hidden rounded-none border-y border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.50)] sm:max-w-[480px] sm:rounded-[32px] sm:border ${isSafetyAlert ? 'ring-2 ring-brand-red/50' : ''}`}
            style={{ height: CARD_HEIGHT, minHeight: CARD_HEIGHT }}
            {...articleGestureProps}
        >
            {mediaBackground}

            {pinnedBadge}
            {multiMediaIndicator}
            {safetyAlertPill}

            {authorHeader}
            {actionRail}
            {renderBottomAuthorPanel(true)}

            {/* Emergency actions */}
            {isSafetyAlert && onEmergencyAction && (
                <div className="absolute bottom-0 left-0 right-0 z-30">
                    <EmergencyActions post={post} onEmergencyAction={onEmergencyAction} />
                </div>
            )}
        </article>
        {showShare && (
            <ShareModal postId={post.id ?? post._id ?? ''} postContent={post.content ?? ''} onClose={() => setShowShare(false)} />
        )}
        {longPressMenu}
        </>
    );
}
