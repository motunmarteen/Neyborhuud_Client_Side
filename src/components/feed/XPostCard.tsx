/**
 * XPostCard — Immersive feed card
 * Three modes: text-only (ambient spheres), media-only (full-bleed), mixed (media bg + text panel)
 * iOS-inspired Liquid Glass action rail
 */

import { MediaItem, Post, PostAuthor } from '@/types/api';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatTimeAgo } from '@/utils/timeAgo';
import { useFollow } from '@/hooks/useFollow';
import { chatService } from '@/services/chat.service';
import ShareModal from './ShareModal';

// ── Ambient sphere palettes (text-only mode background glow) ──────────────────
const SPHERE_PALETTES: Record<string, [string, string, string]> = {
    post:         ['rgba(99,102,241,0.45)',  'rgba(168,85,247,0.35)',  'rgba(59,130,246,0.25)'],
    event:        ['rgba(139,92,246,0.45)',  'rgba(99,102,241,0.35)',  'rgba(236,72,153,0.25)'],
    marketplace:  ['rgba(16,185,129,0.45)',  'rgba(5,150,105,0.35)',   'rgba(20,184,166,0.25)'],
    emergency:    ['rgba(239,68,68,0.50)',   'rgba(249,115,22,0.40)',  'rgba(234,179,8,0.25)'],
    fyi:          ['rgba(245,158,11,0.45)',  'rgba(234,179,8,0.35)',   'rgba(249,115,22,0.25)'],
    help_request: ['rgba(16,185,129,0.45)',  'rgba(5,150,105,0.35)',   'rgba(34,197,94,0.25)'],
    gossip:       ['rgba(236,72,153,0.45)',  'rgba(168,85,247,0.35)',  'rgba(239,68,68,0.25)'],
    job:          ['rgba(59,130,246,0.45)',  'rgba(99,102,241,0.35)',  'rgba(14,165,233,0.25)'],
};

// ── Content type badge config ──────────────────────────────────────────────────
const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
    event:        { label: 'EVENT',     cls: 'bg-purple-500/20 text-purple-200 border-purple-400/25' },
    marketplace:  { label: 'MARKET',    cls: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/25' },
    emergency:    { label: 'EMERGENCY', cls: 'bg-red-500/25 text-red-200 border-red-400/30' },
    fyi:          { label: 'FYI',       cls: 'bg-amber-500/20 text-amber-200 border-amber-400/25' },
    help_request: { label: 'HELP',      cls: 'bg-green-500/20 text-green-200 border-green-400/25' },
    gossip:       { label: 'GOSSIP',    cls: 'bg-pink-500/20 text-pink-200 border-pink-400/25' },
    job:          { label: 'JOB',       cls: 'bg-blue-500/20 text-blue-200 border-blue-400/25' },
};

const CARD_HEIGHT = '90vh';

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
    return (
        <button
            onClick={onClick}
            className="group flex flex-col items-center gap-1 rounded-full p-1 transition-transform duration-200 ease-out hover:scale-110 active:scale-90"
            aria-label={label}
        >
            <span
                className={`material-symbols-outlined text-[22px] transition-transform duration-200 ${active ? (activeIconClass || 'text-white') : 'text-white'}`}
                style={{
                    ...(filled && active ? { fontVariationSettings: '"FILL" 1' } : {}),
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.85))',
                }}
            >
                {icon}
            </span>
            {(count !== undefined && count > 0) && (
                <span className="text-[10px] font-black tracking-tight text-white" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>
                    {formatCompactCount(count)}
                </span>
            )}
            {label && !(count !== undefined && count > 0) && (
                <span className="text-[9px] font-semibold text-white/70">{label}</span>
            )}
        </button>
    );
}

// ── Emergency action buttons ───────────────────────────────────────────────────
function EmergencyActions({ post, onEmergencyAction }: { post: Post; onEmergencyAction: (a: string) => void }) {
    const actions = [
        { key: 'acknowledge', icon: 'visibility', label: 'Seen', active: post.isAcknowledged, cls: 'bg-blue-500/25 text-blue-200 border-blue-400/30' },
        { key: 'aware', icon: 'notifications_active', label: 'Aware', active: post.isAware, cls: 'bg-amber-500/25 text-amber-200 border-amber-400/30' },
        { key: 'nearby', icon: 'location_on', label: 'Nearby', active: post.isNearby, cls: 'bg-green-500/25 text-green-200 border-green-400/30' },
        { key: 'safe', icon: 'shield', label: 'Safe', active: post.isSafe, cls: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/30' },
        { key: 'confirm', icon: 'check_circle', label: 'Confirm', active: post.confirmDisputeAction === 'confirm', cls: 'bg-teal-500/25 text-teal-200 border-teal-400/30' },
        { key: 'dispute', icon: 'cancel', label: 'Dispute', active: post.confirmDisputeAction === 'dispute', cls: 'bg-red-500/25 text-red-200 border-red-400/30' },
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
    const [showMenu, setShowMenu] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const router = useRouter();

    const author = post.author as PostAuthor;
    const authorName = author?.name || 'Anonymous';
    const authorUsername = author?.username || 'user';
    const authorAvatar = author?.avatarUrl || (author as any)?.profilePicture || null;

    const isAnonymousAuthor = !author?.id || author.id === 'anonymous';
    const isOwnerPost = currentUserId && (author?.id === currentUserId || (post as any).authorId === currentUserId);

    const handleMessageAuthor = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        const authorId = author?.id;
        if (!authorId || isAnonymousAuthor) return;
        try {
            const res = await chatService.getOrCreateDirectConversation(authorId);
            const conv = (res.data as any)?.conversation ?? (res.data as any);
            const convId = conv?._id ?? conv?.conversationId ?? conv?.id;
            if (convId) router.push(`/messages/${convId}`);
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
    const isOwner = isOwnerPost;

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

    // ── Shared: Top utility layer ─────────────────────────────────────────────
    const authorHeader = (
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 px-4 pt-4 pb-20 bg-gradient-to-b from-black/60 via-black/18 to-transparent">
            <div className="pointer-events-auto flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {typeBadge && (
                        <span
                            className={`text-[9px] px-2 py-[3px] rounded-full font-bold tracking-wider uppercase border ${typeBadge.cls}`}
                            style={{ backdropFilter: 'blur(12px)' }}
                        >
                            {typeBadge.label}
                        </span>
                    )}
                    <span
                        className="text-[9px] px-2 py-[3px] rounded-full font-bold tracking-wider uppercase text-white/70"
                        style={{
                            background: 'rgba(255,255,255,0.11)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.14)',
                        }}
                    >
                        {feedLayerLabel}
                    </span>
                </div>
                <div className="relative shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white/75 transition-all hover:scale-105 hover:text-white active:scale-95"
                        style={{
                            background: 'rgba(255,255,255,0.11)',
                            backdropFilter: 'blur(16px) saturate(170%)',
                            border: '1px solid rgba(255,255,255,0.16)',
                        }}
                    >
                        <span className="material-symbols-outlined text-[19px]">more_horiz</span>
                    </button>
                    {showMenu && (
                        <div
                            className="absolute right-0 top-11 z-40 w-44 overflow-hidden rounded-2xl shadow-2xl"
                            style={{
                                background: 'rgba(4,12,16,0.88)',
                                backdropFilter: 'blur(28px) saturate(180%)',
                                border: '1px solid rgba(255,255,255,0.12)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isOwner && onEdit && (
                                <button onClick={() => { setShowMenu(false); onEdit(post); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] text-white transition-colors hover:bg-white/8">
                                    <span className="material-symbols-outlined text-[17px]">edit</span> Edit
                                </button>
                            )}
                            {isOwner && onDelete && (
                                <button onClick={() => { setShowMenu(false); onDelete(post.id); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] text-red-400 transition-colors hover:bg-white/8">
                                    <span className="material-symbols-outlined text-[17px]">delete</span> Delete
                                </button>
                            )}
                            {isOwner && onPin && (
                                <button onClick={() => { setShowMenu(false); onPin(post.id); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] text-amber-400 transition-colors hover:bg-white/8">
                                    <span className="material-symbols-outlined text-[17px]">push_pin</span> {post.isPinned ? 'Extend Pin' : 'Pin to Feed'}
                                </button>
                            )}
                            {!isOwner && !isAnonymousAuthor && (
                                <button onClick={handleMessageAuthor} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] text-white transition-colors hover:bg-white/8">
                                    <span className="material-symbols-outlined text-[17px]">chat</span> Message
                                </button>
                            )}
                            {!isOwner && (
                                <button onClick={() => { setShowMenu(false); onReport?.(post.id); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] text-white/55 transition-colors hover:bg-white/8">
                                    <span className="material-symbols-outlined text-[17px]">flag</span> Report
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // ── Shared: Action rail ───────────────────────────────────────────────────
    const actionRail = (
        <div className="absolute right-3 bottom-5 z-30 flex flex-col items-center gap-3 sm:right-4 sm:bottom-6">
            <GlassBtn
                icon="favorite"
                count={post.likes || undefined}
                active={post.isLiked === true}
                activeIconClass="text-pink-300"
                filled
                onClick={(e) => { e.stopPropagation(); onLike(); }}
            />
            <GlassBtn
                icon="chat_bubble"
                count={post.comments || undefined}
                onClick={(e) => { e.stopPropagation(); onComment(); }}
            />
            <GlassBtn
                icon="send"
                onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
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
                    activeIconClass="text-emerald-300"
                    filled
                    onClick={(e) => { e.stopPropagation(); onHelpful(); }}
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
        <div className="absolute bottom-5 left-4 right-[76px] z-20 sm:bottom-6 sm:left-5 sm:right-24">
            <div className="flex max-w-[560px] flex-col gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                        <Link href={`/profile/${authorUsername}`} onClick={handleProfileClick}>
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10">
                                {authorAvatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={authorAvatar} alt={authorName} className="h-full w-full object-cover" onError={() => { if (!imageError) setImageError(true); }} />
                                ) : (
                                    <span className="material-symbols-outlined text-[18px] text-white/55">person</span>
                                )}
                            </div>
                        </Link>
                        {canFollow && !isFollowing && (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
                                disabled={isFollowPending}
                                className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-black/30 bg-emerald-400 text-black shadow-lg transition-transform hover:scale-110 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[11px] font-bold">add</span>
                            </button>
                        )}
                    </div>
                    <div className="min-w-0">
                        <Link
                            href={`/profile/${authorUsername}`}
                            onClick={handleProfileClick}
                            className="block max-w-[150px] whitespace-normal text-[12px] font-black leading-[1.05] text-white hover:underline"
                            style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}
                        >
                            {isAnonymousAuthor ? 'Anonymous Neyborh' : authorName}
                        </Link>
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
                    className="flex h-8 w-full max-w-[210px] items-center rounded-full border border-white/12 bg-white/8 px-3 text-left text-[11px] font-semibold text-white/55 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/12 hover:text-white/75 active:scale-[0.98]"
                    aria-label="Add comment"
                >
                    Add comment...
                </button>
            </div>
        </div>
    );

    // ── Shared: structured content blocks ────────────────────────────────────
    const eventBlock = post.contentType === 'event' && (post as any).eventDate ? (
        <div
            className="flex flex-wrap items-center gap-2 p-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
        >
            <span className="text-[12px] font-bold text-purple-300">📅 {new Date((post as any).eventDate).toLocaleDateString()}</span>
            {(post as any).eventTime && <span className="text-[11px] text-white/65">⏰ {(post as any).eventTime}</span>}
            {(post as any).venue?.name && <span className="text-[11px] text-white/65">📍 {(post as any).venue.name}</span>}
            {(post as any).ticketInfo === 'paid' && (post as any).ticketPrice && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-bold">₦{Number((post as any).ticketPrice).toLocaleString()}</span>
            )}
            {(post as any).ticketInfo === 'free' && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/30 text-green-300 font-bold">FREE</span>
            )}
            {(post as any).eventCategory && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/55 font-medium capitalize">{(post as any).eventCategory}</span>
            )}
        </div>
    ) : null;

    const marketBlock = post.contentType === 'marketplace' ? (
        <div
            className="flex flex-wrap items-center gap-2 p-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
        >
            {(post as any).price != null && <span className="text-base font-bold text-emerald-300">₦{Number((post as any).price).toLocaleString()}</span>}
            {(post as any).isNegotiable && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 font-medium">Negotiable</span>}
            {(post as any).itemCondition && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 font-medium capitalize">
                    {(post as any).itemCondition === 'used' ? 'Tokunbo' : (post as any).itemCondition}
                </span>
            )}
            {(post as any).itemCategory && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/55 font-medium">{(post as any).itemCategory}</span>}
            {(post as any).deliveryOption && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/55 font-medium capitalize">{(post as any).deliveryOption}</span>}
            {(post as any).availability && (post as any).availability !== 'available' && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${(post as any).availability === 'sold' ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/30 text-yellow-300'}`}>
                    {(post as any).availability === 'sold' ? 'SOLD' : 'RESERVED'}
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
        <div className="absolute left-4 top-[64px] z-30 flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/25 px-3 py-1.5 backdrop-blur-md">
            <span className="material-symbols-outlined text-[14px] text-orange-300">warning</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-100">Safety Alert</span>
            {severityLabel && <span className="rounded-full bg-orange-500/30 px-1.5 py-0.5 text-[10px] font-bold text-orange-100">{severityLabel}</span>}
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
                <video
                    src={primaryMedia.url}
                    poster={primaryMedia.thumbnailUrl}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                />
            ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={primaryMedia.url}
                    alt="Post media"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                    onError={(e) => { e.currentTarget.src = 'https://i.pravatar.cc/600?u=fallback'; }}
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
                    background: 'radial-gradient(circle at 84% 44%, rgba(0,255,190,0.18), transparent 28%), radial-gradient(circle at 8% 88%, rgba(0,135,81,0.20), transparent 34%)',
                }}
            />
            <div aria-hidden className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full border border-emerald-300/20 blur-[0.3px]" />
        </div>
    ) : null;

    // ── TEXT-ONLY MODE ────────────────────────────────────────────────────────
    if (mode === 'text') {
        return (
            <>
            <article
                className={`feed-post-card group relative mx-auto w-full cursor-pointer overflow-hidden rounded-none border-y border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.50)] sm:max-w-[480px] sm:rounded-[32px] sm:border ${isSafetyAlert ? 'ring-2 ring-orange-500/50' : ''}`}
                style={{ background: '#030a0b', height: CARD_HEIGHT, minHeight: CARD_HEIGHT }}
                onClick={handleCardClick}
            >
                {/* Ambient sphere background */}
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-28 -left-28 h-[360px] w-[360px] rounded-full animate-soft-float" style={{ background: spheres[0], filter: 'blur(96px)' }} />
                    <div className="absolute top-[28%] -right-24 h-[340px] w-[340px] rounded-full" style={{ background: spheres[1], filter: 'blur(88px)' }} />
                    <div className="absolute -bottom-24 left-[8%] h-[320px] w-[320px] rounded-full animate-soft-float" style={{ background: spheres[2], filter: 'blur(82px)', animationDelay: '1.2s' }} />
                    <div className="absolute -right-24 bottom-20 h-80 w-80 rounded-full border border-emerald-300/20" />
                    <div className="absolute -right-10 bottom-16 h-96 w-96 rounded-full border border-teal-300/15" />
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
                                post.priority === 'critical' ? 'bg-red-500/25 text-red-200 border-red-400/25' :
                                post.priority === 'high' ? 'bg-orange-500/25 text-orange-200 border-orange-400/25' :
                                'bg-blue-500/25 text-blue-200 border-blue-400/25'
                            }`}
                        >
                            {post.priority.charAt(0).toUpperCase() + post.priority.slice(1)} Priority
                        </span>
                    )}

                    {/* Main text */}
                    <p
                        className={`whitespace-pre-wrap break-words font-black tracking-[-0.035em] text-white ${textSizeClass}`}
                        style={{ textShadow: '0 3px 34px rgba(0,0,0,0.65), 0 0 34px rgba(16,185,129,0.18)' }}
                    >
                        {textContent}
                    </p>

                    {eventBlock}
                    {marketBlock}

                    {/* Cultural context */}
                    {post.culturalContext && post.culturalContext.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {post.culturalContext.map((ctx, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/20 text-purple-200 border border-purple-400/20 backdrop-blur-sm">
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
                                ? 'bg-green-500/25 text-green-200 border-green-400/20'
                                : 'bg-white/10 text-white/60 border-white/10'
                        }`}>
                            {post.fyiStatus.charAt(0).toUpperCase() + post.fyiStatus.slice(1)}
                        </span>
                    )}

                    {post.expiresAt && (
                        <span className="self-start text-[10px] px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-200 font-medium border border-yellow-400/20 backdrop-blur-sm">
                            Expires {new Date(post.expiresAt).toLocaleDateString()}
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
                <ShareModal postId={post.id ?? (post as any)._id ?? ''} postContent={post.content ?? ''} onClose={() => setShowShare(false)} />
            )}
            </>
        );
    }

    // ── MEDIA-ONLY MODE ───────────────────────────────────────────────────────
    if (mode === 'media') {
        return (
            <>
            <article
                className={`feed-post-card group relative mx-auto w-full cursor-pointer overflow-hidden rounded-none border-y border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.50)] sm:max-w-[480px] sm:rounded-[32px] sm:border ${isSafetyAlert ? 'ring-2 ring-orange-500/50' : ''}`}
                style={{ height: CARD_HEIGHT, minHeight: CARD_HEIGHT }}
                onClick={handleCardClick}
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
                <ShareModal postId={post.id ?? (post as any)._id ?? ''} postContent={post.content ?? ''} onClose={() => setShowShare(false)} />
            )}
            </>
        );
    }

    // ── MIXED MODE (media + text) ─────────────────────────────────────────────
    return (
        <>
        <article
            className={`feed-post-card group relative mx-auto w-full cursor-pointer overflow-hidden rounded-none border-y border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.50)] sm:max-w-[480px] sm:rounded-[32px] sm:border ${isSafetyAlert ? 'ring-2 ring-orange-500/50' : ''}`}
            style={{ height: CARD_HEIGHT, minHeight: CARD_HEIGHT }}
            onClick={handleCardClick}
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
            <ShareModal postId={post.id ?? (post as any)._id ?? ''} postContent={post.content ?? ''} onClose={() => setShowShare(false)} />
        )}
        </>
    );
}
