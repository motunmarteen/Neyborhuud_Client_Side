/**
 * XPostCard Component - Stitch Design Post Card
 * Card-based design with dark theme, rounded corners, material icons
 */

import { Post, PostAuthor } from '@/types/api';
import { useState } from 'react';
import Link from 'next/link';
import { haversineDistance, formatDistance } from '@/utils/distance';
import { formatTimeAgo } from '@/utils/timeAgo';
import { useFollow } from '@/hooks/useFollow';
import MapPinAvatar from '@/components/ui/MapPinAvatar';

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
    onHelpful?: () => void;
    userLocation?: { lat: number; lng: number } | null;
}

export function XPostCard({
    post,
    onLike,
    onComment,
    onShare,
    onSave,
    onEmergencyAction,
    onCardClick,
    currentUserId,
    onEdit,
    onDelete,
    onReport,
    onHelpful,
    userLocation,
}: XPostCardProps) {
    const [imageError, setImageError] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Get author info
    const author = post.author as PostAuthor;
    const authorName = author?.name || 'Anonymous';
    const authorUsername = author?.username || 'user';
    const authorAvatar = author?.avatarUrl || (author as any)?.profilePicture || 'https://i.pravatar.cc/100?u=user';

    // Follow state — only for posts not by the current user and not anonymous
    const isAnonymousAuthor = !author?.id || author.id === 'anonymous';
    const isOwnerPost = currentUserId && (author?.id === currentUserId || (post as any).authorId === currentUserId);
    const canFollow = !isOwnerPost && !isAnonymousAuthor;
    const { isFollowing, toggleFollow, isPending: isFollowPending } = useFollow(
        canFollow ? author?.id : undefined,
        { enabled: canFollow && !!author?.id }
    );

    // Distance calculation
    const postLat = post.location && ('latitude' in post.location ? post.location.latitude : ('lat' in post.location ? (post.location as any).lat : null));
    const postLng = post.location && ('longitude' in post.location ? post.location.longitude : ('lng' in post.location ? (post.location as any).lng : null));
    const distanceLabel = userLocation && postLat != null && postLng != null
        ? formatDistance(haversineDistance(userLocation.lat, userLocation.lng, postLat, postLng))
        : null;

    // Location name for display
    const locationName = post.location && 'formattedAddress' in post.location && post.location.formattedAddress
        ? post.location.formattedAddress
        : post.location && 'address' in post.location && (post.location as Record<string, unknown>).address
            ? String((post.location as Record<string, unknown>).address)
            : post.location && 'neighborhood' in post.location && (post.location as any).neighborhood
                ? (post.location as any).neighborhood
                : post.location && 'lga' in post.location && (post.location as any).lga
                    ? (post.location as any).lga
                    : null;

    // Get media URLs
    const mediaUrls = post.media
        ? Array.isArray(post.media)
            ? post.media.map((m) => (typeof m === 'string' ? m : m.url))
            : []
        : [];

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const isSafetyAlert =
        post.contentType === 'emergency' ||
        post.cardStyle === 'emergency_red' ||
        post.tags?.includes('safety') ||
        post.tags?.includes('SAFETY') ||
        (post as unknown as Record<string, unknown>).category === 'SAFETY';
    const feedLayerLabel =
        post._feedLayer === 'explore'
            ? 'Street Radar'
            : post._feedLayer === 'extended'
                ? 'Following Places'
                : 'Your Huud';
    const severityLabel = post.severity ? post.severity.toUpperCase() : null;
    const isOwner = isOwnerPost;

    const hasMedia = mediaUrls.length > 0;

    // Determine if this is a "quote card" — short casual text, no media, not safety-critical
    const textContent = post.content || post.body || '';
    const wordCount = textContent.trim().split(/\s+/).length;
    const isCasualType = !isSafetyAlert && post.contentType !== 'help_request' && post.contentType !== 'fyi';
    const isQuoteCard = !hasMedia && isCasualType && wordCount <= 35 && textContent.trim().length > 0;

    // Rotating gradient backgrounds for quote cards (content-type aware)
    const quoteGradients: Record<string, string> = {
        gossip: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        event: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #4a1a6b 100%)',
        marketplace: 'linear-gradient(135deg, #0a1a0f 0%, #0d2818 50%, #1a4028 100%)',
        job: 'linear-gradient(135deg, #1a1a2e 0%, #1a2a4a 50%, #1e3a5f 100%)',
        post: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    };
    const quoteAccentColors: Record<string, string> = {
        gossip: '#e879a8',
        event: '#a78bfa',
        marketplace: '#4ade80',
        job: '#60a5fa',
        post: '#818cf8',
    };

    // ── REEL-STYLE CARD (with image background) ──
    if (hasMedia) {
        return (
            <article
                className={`relative overflow-hidden cursor-pointer rounded-2xl ${
                    isSafetyAlert ? 'ring-2 ring-orange-500/50' : ''
                }`}
                style={{ minHeight: '78vh' }}
                onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest('button') && !target.closest('a')) {
                        onCardClick?.();
                    }
                }}
            >
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src={mediaUrls[0]}
                        alt="Post background"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = 'https://i.pravatar.cc/600?u=fallback';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
                </div>

                {/* Multi-image indicator */}
                {mediaUrls.length > 1 && (
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                        <span className="material-symbols-outlined text-white text-[14px]">photo_library</span>
                        <span className="text-white text-xs font-bold">{mediaUrls.length}</span>
                    </div>
                )}

                {/* Safety Alert Banner — top center */}
                {isSafetyAlert && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/25 backdrop-blur-md border border-orange-400/30">
                        <span className="material-symbols-outlined text-orange-300 text-[14px]">warning</span>
                        <span className="text-orange-200 text-[11px] font-bold uppercase tracking-wider">Safety Alert</span>
                        {severityLabel && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/30 text-orange-100 font-bold">{severityLabel}</span>
                        )}
                    </div>
                )}

                {/* All content overlaid */}
                <div className="relative z-10 flex flex-col justify-between" style={{ minHeight: '78vh' }}>

                    {/* ── TOP: Minimal header ── */}
                    <div className="p-4 pt-5">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                                <Link
                                    href={`/profile/${authorUsername}`}
                                    className="block group"
                                    onClick={handleProfileClick}
                                    aria-label={`View ${authorName}'s profile`}
                                >
                                    <MapPinAvatar
                                        src={authorAvatar}
                                        alt={authorName}
                                        size="lg"
                                        onError={() => { if (!imageError) setImageError(true); }}
                                    />
                                </Link>
                                {canFollow && !isFollowing && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
                                        disabled={isFollowPending}
                                        className={`absolute bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform bg-white border-2 border-white ${isFollowPending ? 'opacity-50' : ''}`}
                                        aria-label="HuudLink"
                                    >
                                        <span className="material-symbols-outlined text-[16px] font-bold text-primary">add</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/profile/${authorUsername}`}
                                        onClick={handleProfileClick}
                                        className="font-bold text-[14px] text-white hover:underline drop-shadow-md truncate"
                                    >
                                        {authorName}
                                    </Link>
                                </div>
                                {/* Location + Time + Distance — single clean line */}
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[11px] text-white/60 drop-shadow-sm">{formatTimeAgo(post.createdAt)}</span>
                                    {locationName && (
                                        <>
                                            <span className="text-white/30 text-[10px]">·</span>
                                            <span className="material-symbols-outlined text-[12px] text-white/50">location_on</span>
                                            <span className="text-[11px] text-white/60 truncate max-w-[120px]">{locationName}</span>
                                        </>
                                    )}
                                    {distanceLabel && (
                                        <span className="flex-shrink-0 text-[10px] px-1.5 py-[1px] rounded-full bg-white/15 text-white/70 font-medium backdrop-blur-sm">
                                            {distanceLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Feed layer + Menu */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[9px] px-2 py-[3px] rounded-full bg-white/15 text-white/80 font-bold tracking-wider uppercase backdrop-blur-sm">
                                    {feedLayerLabel}
                                </span>
                                <div className="relative">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors text-white/70"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                    </button>
                                    {showMenu && (
                                        <div className="absolute right-0 top-10 z-30 w-44 rounded-2xl overflow-hidden bg-black/70 backdrop-blur-2xl border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                            {isOwner && onEdit && (
                                                <button onClick={() => { setShowMenu(false); onEdit(post); }} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-white/10 transition-colors text-white">
                                                    <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                                                </button>
                                            )}
                                            {isOwner && onDelete && (
                                                <button onClick={() => { setShowMenu(false); onDelete(post.id); }} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-white/10 transition-colors text-red-400">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                                                </button>
                                            )}
                                            {!isOwner && (
                                                <button onClick={() => { setShowMenu(false); onReport?.(post.id); }} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-white/10 transition-colors text-white/60">
                                                    <span className="material-symbols-outlined text-[18px]">flag</span> Report
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── MIDDLE: Image breathes ── */}
                    <div className="flex-1" />

                    {/* ── RIGHT SIDE: Vertical action rail (TikTok-style) ── */}
                    <div className="absolute right-3 bottom-[170px] z-20 flex flex-col items-center gap-4">
                        {/* Like */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onLike(); }}
                            className="flex flex-col items-center gap-0.5 group"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                post.isLiked ? 'bg-pink-500/30 backdrop-blur-md' : 'bg-black/30 backdrop-blur-md hover:bg-black/50'
                            }`}>
                                <span className={`material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform ${
                                    post.isLiked ? 'text-pink-400 fill-1' : 'text-white'
                                }`}>favorite</span>
                            </div>
                            {post.likes > 0 && <span className="text-[11px] font-bold text-white drop-shadow-md">{post.likes}</span>}
                        </button>
                        {/* Comment */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onComment(); }}
                            className="flex flex-col items-center gap-0.5 group"
                        >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md hover:bg-black/50 transition-all">
                                <span className="material-symbols-outlined text-[22px] text-white group-hover:scale-110 transition-transform">chat_bubble</span>
                            </div>
                            {post.comments > 0 && <span className="text-[11px] font-bold text-white drop-shadow-md">{post.comments}</span>}
                        </button>
                        {/* Share */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onShare(); }}
                            className="flex flex-col items-center gap-0.5 group"
                        >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md hover:bg-black/50 transition-all">
                                <span className="material-symbols-outlined text-[22px] text-white group-hover:scale-110 transition-transform">send</span>
                            </div>
                        </button>
                        {/* Save */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onSave(); }}
                            className="flex flex-col items-center gap-0.5 group"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                post.isSaved ? 'bg-white/25 backdrop-blur-md' : 'bg-black/30 backdrop-blur-md hover:bg-black/50'
                            }`}>
                                <span className={`material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform ${
                                    post.isSaved ? 'text-white fill-1' : 'text-white'
                                }`}>bookmark</span>
                            </div>
                        </button>
                        {/* Helpful (FYI only) */}
                        {post.contentType === 'fyi' && onHelpful && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onHelpful(); }}
                                className="flex flex-col items-center gap-0.5 group"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                    post.isHelpful ? 'bg-emerald-500/30 backdrop-blur-md' : 'bg-black/30 backdrop-blur-md hover:bg-black/50'
                                }`}>
                                    <span className={`material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform ${
                                        post.isHelpful ? 'text-emerald-300 fill-1' : 'text-white'
                                    }`}>thumb_up</span>
                                </div>
                                {(post.helpfulCount || 0) > 0 && <span className="text-[11px] font-bold text-white">{post.helpfulCount}</span>}
                            </button>
                        )}
                        {/* Views */}
                        {post.views > 0 && (
                            <div className="flex flex-col items-center gap-0.5">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent">
                                    <span className="material-symbols-outlined text-[20px] text-white/40">visibility</span>
                                </div>
                                <span className="text-[11px] text-white/40">{post.views}</span>
                            </div>
                        )}
                    </div>

                    {/* ── BOTTOM: Content panel ── */}
                    <div className="p-4 pr-16 space-y-2.5">
                        {/* Pinned / Priority badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {post.isPinned && (
                                <span className="text-[10px] px-2 py-[2px] rounded-full bg-blue-400/25 text-blue-200 font-bold backdrop-blur-sm border border-blue-400/20">
                                    <span className="material-symbols-outlined text-[11px] mr-0.5 align-text-bottom">push_pin</span> Pinned
                                </span>
                            )}
                            {post.priority && post.priority !== 'normal' && (
                                <span className={`inline-flex items-center gap-0.5 px-2 py-[2px] rounded-full text-[10px] font-bold backdrop-blur-sm ${
                                    post.priority === 'critical' ? 'bg-red-500/25 text-red-200 border border-red-400/20' :
                                    post.priority === 'high' ? 'bg-orange-500/25 text-orange-200 border border-orange-400/20' :
                                    'bg-blue-500/25 text-blue-200 border border-blue-400/20'
                                }`}>
                                    {post.priority.charAt(0).toUpperCase() + post.priority.slice(1)}
                                </span>
                            )}
                            {post.updatedAt && post.updatedAt !== post.createdAt && (
                                <span className="text-[10px] italic text-white/40">edited</span>
                            )}
                        </div>

                        {/* Post Content */}
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words text-white font-medium drop-shadow-lg">
                            {post.content || post.body || ''}
                        </p>

                        {/* Content type badge row */}
                        {post.contentType && post.contentType !== 'post' && (
                            <div className="flex flex-wrap gap-1.5">
                                {post.contentType === 'fyi' && post.fyiSubtype && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-200 font-bold backdrop-blur-sm border border-amber-400/15">
                                        {post.fyiSubtype.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                )}
                                {post.contentType === 'event' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-200 font-bold backdrop-blur-sm border border-purple-400/15">📅 EVENT</span>
                                )}
                                {post.contentType === 'marketplace' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/25 text-green-200 font-bold backdrop-blur-sm border border-green-400/15">🛒 MARKETPLACE</span>
                                )}
                                {post.contentType === 'emergency' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/25 text-red-200 font-bold backdrop-blur-sm border border-red-400/15">🚨 EMERGENCY</span>
                                )}
                                {post.contentType === 'help_request' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/25 text-sky-200 font-bold backdrop-blur-sm border border-sky-400/15">🤝 HELP</span>
                                )}
                                {post.contentType === 'job' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/25 text-indigo-200 font-bold backdrop-blur-sm border border-indigo-400/15">💼 JOB</span>
                                )}
                                {post.contentType === 'gossip' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/25 text-pink-200 font-bold backdrop-blur-sm border border-pink-400/15">👀 GOSSIP</span>
                                )}
                            </div>
                        )}

                        {/* Event Info */}
                        {post.contentType === 'event' && (post as any).eventDate && (
                            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/5">
                                <span className="text-[11px] font-bold text-purple-300">📅 {new Date((post as any).eventDate).toLocaleDateString()}</span>
                                {(post as any).eventTime && <span className="text-[11px] text-purple-200">⏰ {(post as any).eventTime}</span>}
                                {(post as any).venue?.name && <span className="text-[11px] text-purple-200">📍 {(post as any).venue.name}</span>}
                                {(post as any).ticketInfo === 'paid' && (post as any).ticketPrice && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-bold">₦{Number((post as any).ticketPrice).toLocaleString()}</span>
                                )}
                                {(post as any).ticketInfo === 'free' && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/30 text-green-300 font-bold">FREE</span>
                                )}
                            </div>
                        )}

                        {/* Marketplace Info */}
                        {post.contentType === 'marketplace' && (
                            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/5">
                                {(post as any).price != null && (
                                    <span className="text-sm font-bold text-green-300">₦{Number((post as any).price).toLocaleString()}</span>
                                )}
                                {(post as any).isNegotiable && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-200 font-medium">Negotiable</span>
                                )}
                                {(post as any).itemCondition && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-200 font-medium capitalize">{(post as any).itemCondition === 'used' ? 'Tokunbo' : (post as any).itemCondition}</span>
                                )}
                                {(post as any).availability && (post as any).availability !== 'available' && (
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                        (post as any).availability === 'sold' ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/30 text-yellow-300'
                                    }`}>
                                        {(post as any).availability === 'sold' ? 'SOLD' : 'RESERVED'}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {post.tags.map((tag, i) => (
                                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/80 backdrop-blur-sm">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Emergency Action Buttons */}
                        {isSafetyAlert && onEmergencyAction && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {(!post.availableActions || post.availableActions.includes('acknowledge')) && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEmergencyAction('acknowledge'); }}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all backdrop-blur-md border ${
                                            post.isAcknowledged ? 'bg-blue-500/25 text-blue-200 border-blue-400/30' : 'bg-white/10 hover:bg-blue-500/15 text-white/70 border-white/10'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[14px]">visibility</span>Seen
                                    </button>
                                )}
                                {(!post.availableActions || post.availableActions.includes('aware')) && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEmergencyAction('aware'); }}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all backdrop-blur-md border ${
                                            post.isAware ? 'bg-amber-500/25 text-amber-200 border-amber-400/30' : 'bg-white/10 hover:bg-amber-500/15 text-white/70 border-white/10'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[14px]">notifications_active</span>Aware
                                    </button>
                                )}
                                {(!post.availableActions || post.availableActions.includes('safe')) && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEmergencyAction('safe'); }}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all backdrop-blur-md border ${
                                            post.isSafe ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/30' : 'bg-white/10 hover:bg-emerald-500/15 text-white/70 border-white/10'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[14px]">shield</span>Safe
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </article>
        );
    }

    // ── QUOTE-STYLE CARD (short text, no media, gradient bg) ──
    if (isQuoteCard) {
        const gradient = quoteGradients[post.contentType || 'post'] || quoteGradients.post;
        const accentColor = quoteAccentColors[post.contentType || 'post'] || quoteAccentColors.post;

        return (
            <article
                className={`relative overflow-hidden cursor-pointer rounded-2xl ${
                    isSafetyAlert ? 'ring-2 ring-orange-500/50' : ''
                }`}
                style={{ background: gradient, minHeight: '70vh' }}
                onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest('button') && !target.closest('a')) {
                        onCardClick?.();
                    }
                }}
            >
                <div className="flex flex-col justify-between" style={{ minHeight: '70vh' }}>

                    {/* Safety Alert Banner */}
                    {isSafetyAlert && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/25 backdrop-blur-md border border-orange-400/30">
                            <span className="material-symbols-outlined text-orange-300 text-[14px]">warning</span>
                            <span className="text-orange-200 text-[11px] font-bold uppercase tracking-wider">Safety Alert</span>
                        </div>
                    )}

                    {/* ── TOP: Author header ── */}
                    <div className="p-4 pt-5">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                                <Link
                                    href={`/profile/${authorUsername}`}
                                    className="block group"
                                    onClick={handleProfileClick}
                                    aria-label={`View ${authorName}'s profile`}
                                >
                                    <MapPinAvatar
                                        src={authorAvatar}
                                        alt={authorName}
                                        size="lg"
                                        onError={() => { if (!imageError) setImageError(true); }}
                                    />
                                </Link>
                                {canFollow && !isFollowing && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
                                        disabled={isFollowPending}
                                        className={`absolute bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform bg-white border-2 border-white ${isFollowPending ? 'opacity-50' : ''}`}
                                        aria-label="HuudLink"
                                    >
                                        <span className="material-symbols-outlined text-[16px] font-bold text-primary">add</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/profile/${authorUsername}`}
                                        onClick={handleProfileClick}
                                        className="font-bold text-[14px] text-white hover:underline truncate"
                                    >
                                        {authorName}
                                    </Link>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[11px] text-white/50">{formatTimeAgo(post.createdAt)}</span>
                                    {locationName && (
                                        <>
                                            <span className="text-white/25 text-[10px]">·</span>
                                            <span className="material-symbols-outlined text-[12px] text-white/40">location_on</span>
                                            <span className="text-[11px] text-white/50 truncate max-w-[120px]">{locationName}</span>
                                        </>
                                    )}
                                    {distanceLabel && (
                                        <span className="flex-shrink-0 text-[10px] px-1.5 py-[1px] rounded-full bg-white/15 text-white/60 font-medium">
                                            {distanceLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Feed layer + content type + Menu */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[9px] px-2 py-[3px] rounded-full bg-white/15 text-white/70 font-bold tracking-wider uppercase">
                                    {feedLayerLabel}
                                </span>
                                {post.contentType && post.contentType !== 'post' && (
                                    <span
                                        className="text-[9px] px-2 py-[3px] rounded-full font-bold uppercase tracking-wider"
                                        style={{ color: accentColor, background: `${accentColor}20`, border: `1px solid ${accentColor}30` }}
                                    >
                                        {post.contentType === 'gossip' ? 'GOSSIP' : post.contentType === 'event' ? 'EVENT' : post.contentType === 'marketplace' ? 'MARKET' : post.contentType === 'job' ? 'JOB' : post.contentType.toUpperCase()}
                                    </span>
                                )}
                                <div className="relative">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors text-white/60"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                    </button>
                                    {showMenu && (
                                        <div className="absolute right-0 top-10 z-30 w-44 rounded-2xl overflow-hidden bg-black/70 backdrop-blur-2xl border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                            {isOwner && onEdit && (
                                                <button onClick={() => { setShowMenu(false); onEdit(post); }} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-white/10 transition-colors text-white">
                                                    <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                                                </button>
                                            )}
                                            {isOwner && onDelete && (
                                                <button onClick={() => { setShowMenu(false); onDelete(post.id); }} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-white/10 transition-colors text-red-400">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                                                </button>
                                            )}
                                            {!isOwner && (
                                                <button onClick={() => { setShowMenu(false); onReport?.(post.id); }} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-white/10 transition-colors text-white/60">
                                                    <span className="material-symbols-outlined text-[18px]">flag</span> Report
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── CENTER: Big quote text ── */}
                    <div className="px-8 py-6 flex-1 flex flex-col justify-center items-center">
                        <span className="text-5xl leading-none mb-3 font-serif self-start opacity-20" style={{ color: accentColor }}>&ldquo;</span>
                        <p
                            className="font-extrabold leading-snug whitespace-pre-wrap break-words text-center"
                            style={{
                                color: accentColor,
                                fontSize: wordCount <= 10 ? '28px' : wordCount <= 20 ? '22px' : '18px',
                            }}
                        >
                            {textContent}
                        </p>
                        <span className="text-5xl leading-none mt-3 font-serif self-end opacity-20" style={{ color: accentColor }}>&rdquo;</span>

                        {/* Badges under text */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
                            {post.isPinned && (
                                <span className="text-[10px] px-2 py-[2px] rounded-full bg-white/10 text-white/60 font-bold">
                                    <span className="material-symbols-outlined text-[11px] mr-0.5 align-text-bottom">push_pin</span> Pinned
                                </span>
                            )}
                            {post.updatedAt && post.updatedAt !== post.createdAt && (
                                <span className="text-[10px] italic text-white/30">edited</span>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="px-6 pb-2 flex flex-wrap justify-center gap-1.5">
                            {post.tags.map((tag, i) => (
                                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/70">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* ── BOTTOM: Actions — pill-style row ── */}
                    <div className="px-4 py-3.5">
                        <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-black/15 backdrop-blur-md border border-white/[0.06]">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onLike(); }}
                                    className={`flex items-center gap-1.5 transition-colors group ${post.isLiked ? 'text-pink-400' : 'text-white/50 hover:text-white'}`}
                                >
                                    <span className={`material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform ${post.isLiked ? 'fill-1' : ''}`}>favorite</span>
                                    {post.likes > 0 && <span className="text-[12px] font-bold">{post.likes}</span>}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onComment(); }}
                                    className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">chat_bubble</span>
                                    {post.comments > 0 && <span className="text-[12px] font-bold">{post.comments}</span>}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onShare(); }}
                                    className="text-white/50 hover:text-white transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">send</span>
                                </button>
                                {post.views > 0 && (
                                    <span className="flex items-center gap-1 text-white/30">
                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                        <span className="text-[11px]">{post.views}</span>
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onSave(); }}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[12px] font-bold transition-all ${
                                    post.isSaved ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-[18px] ${post.isSaved ? 'fill-1' : ''}`}>bookmark</span>
                                {post.isSaved ? 'Saved' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    // ── CLASSIC CARD (no media — clean card layout) ──
    return (
        <article
            className={`bg-white overflow-hidden cursor-pointer rounded-2xl shadow-sm hover:shadow-md transition-shadow ${
                isSafetyAlert ? 'ring-1 ring-orange-400/40' : ''
            }`}
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest('button') && !target.closest('a')) {
                    onCardClick?.();
                }
            }}
        >
            {/* Content Type Accent Line */}
            <div className={`h-[3px] w-full accent-line-${post.contentType || 'post'} opacity-50 rounded-t-2xl`} />

            {/* Safety Alert Banner */}
            {isSafetyAlert && (
                <div className="px-4 py-2 flex items-center gap-2 bg-orange-50 border-b border-orange-100">
                    <span className="material-symbols-outlined text-orange-500 text-[14px]">warning</span>
                    <span className="text-orange-600 text-[11px] font-bold uppercase tracking-wider">Safety Alert</span>
                    {severityLabel && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold">{severityLabel}</span>
                    )}
                </div>
            )}

            <div className="p-4">
                {/* ── Author Header ── */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-shrink-0">
                        <Link
                            href={`/profile/${authorUsername}`}
                            className="block group"
                            onClick={handleProfileClick}
                            aria-label={`View ${authorName}'s profile`}
                        >
                            <MapPinAvatar
                                src={authorAvatar}
                                alt={authorName}
                                size="lg"
                                onError={() => { if (!imageError) setImageError(true); }}
                            />
                        </Link>
                        {canFollow && !isFollowing && (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
                                disabled={isFollowPending}
                                className={`absolute bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform bg-white border-2 border-white ${isFollowPending ? 'opacity-50' : ''}`}
                                aria-label="HuudLink"
                            >
                                <span className="material-symbols-outlined text-[16px] font-bold text-primary">add</span>
                            </button>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/profile/${authorUsername}`}
                                onClick={handleProfileClick}
                                className="font-bold text-[14px] hover:underline truncate"
                                style={{ color: 'var(--neu-text)' }}
                            >
                                {authorName}
                            </Link>
                        </div>
                        {/* Time + Location + Distance */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{formatTimeAgo(post.createdAt)}</span>
                            {locationName && (
                                <>
                                    <span className="text-[10px]" style={{ color: 'var(--neu-text-muted)', opacity: 0.4 }}>·</span>
                                    <span className="material-symbols-outlined text-[12px]" style={{ color: 'var(--neu-text-muted)', opacity: 0.6 }}>location_on</span>
                                    <span className="text-[11px] truncate max-w-[120px]" style={{ color: 'var(--neu-text-muted)' }}>{locationName}</span>
                                </>
                            )}
                            {distanceLabel && (
                                <span className="flex-shrink-0 text-[10px] px-1.5 py-[1px] rounded-full bg-gray-100 font-medium" style={{ color: 'var(--neu-text-muted)' }}>
                                    {distanceLabel}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Badges + Menu */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[9px] px-2 py-[3px] rounded-full bg-primary/10 text-primary font-bold tracking-wider uppercase">
                            {feedLayerLabel}
                        </span>
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                style={{ color: 'var(--neu-text-muted)' }}
                            >
                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-10 z-30 w-44 rounded-2xl overflow-hidden bg-white shadow-xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
                                    {isOwner && onEdit && (
                                        <button onClick={() => { setShowMenu(false); onEdit(post); }} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors" style={{ color: 'var(--neu-text)' }}>
                                            <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                                        </button>
                                    )}
                                    {isOwner && onDelete && (
                                        <button onClick={() => { setShowMenu(false); onDelete(post.id); }} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors text-red-500">
                                            <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                                        </button>
                                    )}
                                    {!isOwner && (
                                        <button onClick={() => { setShowMenu(false); onReport?.(post.id); }} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors" style={{ color: 'var(--neu-text-muted)' }}>
                                            <span className="material-symbols-outlined text-[18px]">flag</span> Report
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Badge Row: Pinned, Priority, Content Type, FYI ── */}
                {(post.isPinned || (post.priority && post.priority !== 'normal') || (post.contentType && post.contentType !== 'post') || post.fyiStatus) && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        {post.isPinned && (
                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-blue-50 text-blue-500 font-bold border border-blue-100">
                                <span className="material-symbols-outlined text-[11px] mr-0.5 align-text-bottom">push_pin</span> Pinned
                            </span>
                        )}
                        {post.priority && post.priority !== 'normal' && (
                            <span className={`inline-flex items-center gap-0.5 px-2 py-[2px] rounded-full text-[10px] font-bold border ${
                                post.priority === 'critical' ? 'bg-red-50 text-red-500 border-red-100' :
                                post.priority === 'high' ? 'bg-orange-50 text-orange-500 border-orange-100' :
                                'bg-blue-50 text-blue-500 border-blue-100'
                            }`}>
                                {post.priority.charAt(0).toUpperCase() + post.priority.slice(1)}
                            </span>
                        )}
                        {post.contentType === 'fyi' && post.fyiSubtype && (
                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-100">
                                {post.fyiSubtype.replace(/_/g, ' ').toUpperCase()}
                            </span>
                        )}
                        {post.contentType === 'event' && (
                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-purple-50 text-purple-500 font-bold border border-purple-100">📅 EVENT</span>
                        )}
                        {post.contentType === 'marketplace' && (
                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-green-50 text-green-600 font-bold border border-green-100">🛒 MARKETPLACE</span>
                        )}
                        {post.contentType === 'emergency' && (
                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-red-50 text-red-500 font-bold border border-red-100">🚨 EMERGENCY</span>
                        )}
                        {post.contentType === 'help_request' && (
                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-sky-50 text-sky-600 font-bold border border-sky-100">🤝 HELP</span>
                        )}
                        {post.contentType === 'job' && (
                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-indigo-50 text-indigo-500 font-bold border border-indigo-100">💼 JOB</span>
                        )}
                        {post.contentType === 'gossip' && (
                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-pink-50 text-pink-500 font-bold border border-pink-100">👀 GOSSIP</span>
                        )}
                        {post.fyiStatus && post.fyiStatus !== 'active' && (
                            <span className={`text-[10px] px-2 py-[2px] rounded-full font-bold border ${
                                post.fyiStatus === 'found' || post.fyiStatus === 'returned' || post.fyiStatus === 'resolved'
                                    ? 'bg-green-50 text-green-500 border-green-100'
                                    : 'bg-gray-50 text-gray-500 border-gray-100'
                            }`}>
                                {post.fyiStatus.charAt(0).toUpperCase() + post.fyiStatus.slice(1)}
                            </span>
                        )}
                        {post.updatedAt && post.updatedAt !== post.createdAt && (
                            <span className="text-[10px] italic" style={{ color: 'var(--neu-text-muted)' }}>edited</span>
                        )}
                        {post.expiresAt && (
                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-yellow-50 text-yellow-600 font-medium border border-yellow-100">
                                Expires {new Date(post.expiresAt).toLocaleDateString()}
                            </span>
                        )}
                        {post.endorsements && post.endorsements.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-[2px] rounded-full bg-emerald-50 text-emerald-500 font-bold border border-emerald-100">
                                <span className="material-symbols-outlined text-[11px]">verified</span>
                                Endorsed ({post.endorsements.length})
                            </span>
                        )}
                    </div>
                )}

                {/* ── Post Content ── */}
                <p className="text-[15px] mb-3 leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--neu-text)' }}>
                    {post.content || post.body || ''}
                </p>

                {/* Event Info */}
                {post.contentType === 'event' && (post as any).eventDate && (
                    <div className="flex flex-wrap items-center gap-2 mb-3 p-3 rounded-xl bg-purple-50/80 border border-purple-100/50">
                        <span className="text-[11px] font-bold text-purple-600">📅 {new Date((post as any).eventDate).toLocaleDateString()}</span>
                        {(post as any).eventTime && <span className="text-[11px] text-purple-500">⏰ {(post as any).eventTime}</span>}
                        {(post as any).venue?.name && <span className="text-[11px] text-purple-500">📍 {(post as any).venue.name}</span>}
                        {(post as any).ticketInfo === 'paid' && (post as any).ticketPrice && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-bold">₦{Number((post as any).ticketPrice).toLocaleString()}</span>
                        )}
                        {(post as any).ticketInfo === 'free' && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-bold">FREE</span>
                        )}
                        {(post as any).eventCategory && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100/50 text-purple-500 font-medium capitalize">{(post as any).eventCategory}</span>
                        )}
                    </div>
                )}

                {/* Marketplace Info */}
                {post.contentType === 'marketplace' && (
                    <div className="flex flex-wrap items-center gap-2 mb-3 p-3 rounded-xl bg-green-50/80 border border-green-100/50">
                        {(post as any).price != null && (
                            <span className="text-sm font-bold text-green-600">₦{Number((post as any).price).toLocaleString()}</span>
                        )}
                        {(post as any).isNegotiable && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-600 font-medium">Negotiable</span>
                        )}
                        {(post as any).itemCondition && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-medium capitalize">{(post as any).itemCondition === 'used' ? 'Tokunbo' : (post as any).itemCondition}</span>
                        )}
                        {(post as any).itemCategory && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100/50 text-green-500 font-medium">{(post as any).itemCategory}</span>
                        )}
                        {(post as any).deliveryOption && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100/50 text-green-500 font-medium capitalize">{(post as any).deliveryOption}</span>
                        )}
                        {(post as any).availability && (post as any).availability !== 'available' && (
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                (post as any).availability === 'sold' ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                                {(post as any).availability === 'sold' ? 'SOLD' : 'RESERVED'}
                            </span>
                        )}
                    </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.map((tag, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/8 text-primary">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Cultural Context */}
                {post.culturalContext && post.culturalContext.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.culturalContext.map((ctx, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-500 border border-purple-100/50">
                                <span className="material-symbols-outlined text-[12px]">language</span>
                                {ctx}
                            </span>
                        ))}
                    </div>
                )}

                {/* Target Audience */}
                {post.targetAudience && (post.targetAudience.ageRange || post.targetAudience.gender || (post.targetAudience.interests && post.targetAudience.interests.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-text-muted)' }}>group</span>
                        {post.targetAudience.ageRange && (post.targetAudience.ageRange.min || post.targetAudience.ageRange.max) && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium border border-teal-100/50">
                                {post.targetAudience.ageRange.min || '?'}-{post.targetAudience.ageRange.max || '?'} yrs
                            </span>
                        )}
                        {post.targetAudience.gender && post.targetAudience.gender !== 'all' && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium capitalize border border-teal-100/50">
                                {post.targetAudience.gender}
                            </span>
                        )}
                        {post.targetAudience.interests && post.targetAudience.interests.length > 0 && post.targetAudience.interests.map((interest, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium border border-teal-100/50">
                                {interest}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Emergency Action Buttons */}
            {isSafetyAlert && onEmergencyAction && (
                <div className="px-4 py-2.5 flex flex-wrap gap-2 border-t border-orange-100 bg-orange-50/30">
                    {(!post.availableActions || post.availableActions.includes('acknowledge')) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEmergencyAction('acknowledge'); }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                post.isAcknowledged ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white hover:bg-blue-50 text-blue-400 border-gray-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">visibility</span>Seen
                        </button>
                    )}
                    {(!post.availableActions || post.availableActions.includes('aware')) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEmergencyAction('aware'); }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                post.isAware ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-white hover:bg-amber-50 text-amber-400 border-gray-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">notifications_active</span>Aware
                        </button>
                    )}
                    {(!post.availableActions || post.availableActions.includes('nearby')) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEmergencyAction('nearby'); }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                post.isNearby ? 'bg-green-100 text-green-600 border-green-200' : 'bg-white hover:bg-green-50 text-green-400 border-gray-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">location_on</span>Nearby
                        </button>
                    )}
                    {(!post.availableActions || post.availableActions.includes('safe')) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEmergencyAction('safe'); }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                post.isSafe ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-white hover:bg-emerald-50 text-emerald-400 border-gray-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">shield</span>Safe
                        </button>
                    )}
                    {(!post.availableActions || post.availableActions.includes('confirm')) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEmergencyAction('confirm'); }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                post.confirmDisputeAction === 'confirm' ? 'bg-teal-100 text-teal-600 border-teal-200' : 'bg-white hover:bg-teal-50 text-teal-400 border-gray-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>Confirm
                        </button>
                    )}
                    {(!post.availableActions || post.availableActions.includes('dispute')) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEmergencyAction('dispute'); }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                post.confirmDisputeAction === 'dispute' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-white hover:bg-red-50 text-red-400 border-gray-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">cancel</span>Dispute
                        </button>
                    )}
                </div>
            )}

            {/* ── Action Bar — clean pill container ── */}
            <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); onLike(); }}
                            className={`flex items-center gap-1.5 transition-colors group ${
                                post.isLiked ? 'text-pink-500' : 'hover:text-pink-500'
                            }`}
                            style={!post.isLiked ? { color: 'var(--neu-text-muted)' } : undefined}
                        >
                            <span className={`material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform ${post.isLiked ? 'fill-1' : ''}`}>favorite</span>
                            {post.likes > 0 && <span className="text-[12px] font-bold">{post.likes}</span>}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onComment(); }}
                            className="flex items-center gap-1.5 hover:text-primary transition-colors group"
                            style={{ color: 'var(--neu-text-muted)' }}
                        >
                            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">chat_bubble</span>
                            {post.comments > 0 && <span className="text-[12px] font-bold">{post.comments}</span>}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onShare(); }}
                            className="hover:text-primary transition-colors group"
                            style={{ color: 'var(--neu-text-muted)' }}
                        >
                            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">send</span>
                        </button>
                        {post.views > 0 && (
                            <span className="flex items-center gap-1" style={{ color: 'var(--neu-text-muted)', opacity: 0.6 }}>
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                <span className="text-[11px]">{post.views}</span>
                            </span>
                        )}
                        {post.contentType === 'fyi' && onHelpful && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onHelpful(); }}
                                className={`flex items-center gap-1 transition-colors group ${
                                    post.isHelpful ? 'text-emerald-500' : 'hover:text-emerald-500'
                                }`}
                                style={!post.isHelpful ? { color: 'var(--neu-text-muted)' } : undefined}
                            >
                                <span className={`material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform ${post.isHelpful ? 'fill-1' : ''}`}>thumb_up</span>
                                {(post.helpfulCount || 0) > 0 && <span className="text-[12px] font-bold">{post.helpfulCount}</span>}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSave(); }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[12px] font-bold transition-all border ${
                            post.isSaved
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-gray-50 hover:bg-gray-100 border-gray-100'
                        }`}
                        style={!post.isSaved ? { color: 'var(--neu-text-muted)' } : undefined}
                    >
                        <span className={`material-symbols-outlined text-[18px] ${post.isSaved ? 'fill-1' : ''}`}>bookmark</span>
                        {post.isSaved ? 'Saved' : 'Save'}
                    </button>
                </div>
            </div>
        </article>
    );
}
