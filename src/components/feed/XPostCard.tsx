/**
 * XPostCard Component - Stitch Design Post Card
 * Card-based design with dark theme, rounded corners, material icons
 */

import { Post, PostAuthor } from '@/types/api';
import { useState } from 'react';
import Link from 'next/link';

interface XPostCardProps {
    post: Post;
    onLike: () => void;
    onComment: () => void;
    onShare: () => void;
    onSave: () => void;
    onEmergencyAction?: (action: string) => void;
    formatTimeAgo: (date: string) => string;
    onCardClick?: () => void;
    currentUserId?: string;
    onEdit?: (post: Post) => void;
    onDelete?: (postId: string) => void;
    onReport?: (postId: string) => void;
    onHelpful?: () => void;
}

export function XPostCard({
    post,
    onLike,
    onComment,
    onShare,
    onSave,
    onEmergencyAction,
    formatTimeAgo,
    onCardClick,
    currentUserId,
    onEdit,
    onDelete,
    onReport,
    onHelpful,
}: XPostCardProps) {
    const [imageError, setImageError] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Get author info
    const author = post.author as PostAuthor;
    const authorName = author?.name || 'Anonymous';
    const authorUsername = author?.username || 'user';
    const authorAvatar = author?.avatarUrl || (author as any)?.profilePicture || 'https://i.pravatar.cc/100?u=user';

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
    const isOwner = currentUserId && (author?.id === currentUserId || (post as any).authorId === currentUserId);

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
                className={`relative overflow-hidden cursor-pointer ${
                    isSafetyAlert ? 'ring-2 ring-orange-500/40' : ''
                }`}
                style={{ minHeight: '75vh' }}
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
                    {/* Gradient overlays for readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/80" />
                </div>

                {/* Multi-image indicator */}
                {mediaUrls.length > 1 && (
                    <div className="absolute top-3 right-14 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-white text-[14px]">photo_library</span>
                        <span className="text-white text-xs font-bold">{mediaUrls.length}</span>
                    </div>
                )}

                {/* All content overlaid */}
                <div className="relative z-10 flex flex-col justify-between" style={{ minHeight: '75vh' }}>
                    {/* ── TOP: Author + Menu ── */}
                    <div className="p-4">
                        {/* Safety Alert Banner */}
                        {isSafetyAlert && (
                            <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/20 backdrop-blur-sm w-fit">
                                <span className="material-symbols-outlined text-orange-400 text-sm">warning</span>
                                <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Safety Alert</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/profile/${authorUsername}`}
                                    className="flex-shrink-0 group"
                                    onClick={handleProfileClick}
                                    aria-label={`View ${authorName}'s profile`}
                                >
                                    <img
                                        src={authorAvatar}
                                        alt={authorName}
                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30 group-hover:ring-white/60 transition-all"
                                        onError={(e) => {
                                            if (!imageError) {
                                                e.currentTarget.src = 'https://i.pravatar.cc/100?u=user';
                                                setImageError(true);
                                            }
                                        }}
                                    />
                                </Link>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link
                                            href={`/profile/${authorUsername}`}
                                            onClick={handleProfileClick}
                                            className="font-bold text-sm text-white hover:underline drop-shadow-md"
                                        >
                                            {authorName}
                                        </Link>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-bold tracking-wide backdrop-blur-sm">
                                            {feedLayerLabel}
                                        </span>
                                        {post.isPinned && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-400/30 text-blue-200 font-bold backdrop-blur-sm">Pinned</span>
                                        )}
                                        {isSafetyAlert && severityLabel && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/30 text-orange-200 font-bold backdrop-blur-sm">
                                                {severityLabel}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-white/70 drop-shadow-sm">
                                        {formatTimeAgo(post.createdAt)} {post.location && 'formattedAddress' in post.location && post.location.formattedAddress ? `• ${post.location.formattedAddress}` : (post.location && 'address' in post.location && (post.location as Record<string, unknown>).address ? `• ${(post.location as Record<string, unknown>).address}` : '')}
                                    </p>
                                </div>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                    className="hover:bg-white/10 rounded-lg p-1 transition-colors text-white/80"
                                >
                                    <span className="material-symbols-outlined">more_horiz</span>
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-8 z-20 w-40 rounded-xl overflow-hidden bg-black/70 backdrop-blur-xl border border-white/10" onClick={(e) => e.stopPropagation()}>
                                        {isOwner && onEdit && (
                                            <button onClick={() => { setShowMenu(false); onEdit(post); }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors text-white">
                                                <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                                            </button>
                                        )}
                                        {isOwner && onDelete && (
                                            <button onClick={() => { setShowMenu(false); onDelete(post.id); }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors text-red-400">
                                                <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                                            </button>
                                        )}
                                        {!isOwner && (
                                            <button onClick={() => { setShowMenu(false); onReport?.(post.id); }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors text-white/70">
                                                <span className="material-symbols-outlined text-[18px]">flag</span> Report
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── MIDDLE: Spacer (lets image breathe) ── */}
                    <div className="flex-1" />

                    {/* ── BOTTOM: Content + Tags + Actions ── */}
                    <div className="p-4 space-y-3">
                        {/* Post Content */}
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words text-white font-medium drop-shadow-lg" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                            {post.content || post.body || ''}
                        </p>

                        {/* Content type badge */}
                        {post.contentType && post.contentType !== 'post' && (
                            <div className="flex flex-wrap gap-1.5">
                                {post.contentType === 'fyi' && post.fyiSubtype && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 font-bold backdrop-blur-sm">
                                        {post.fyiSubtype.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                )}
                                {post.contentType === 'event' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-bold backdrop-blur-sm">📅 EVENT</span>
                                )}
                                {post.contentType === 'marketplace' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/30 text-green-200 font-bold backdrop-blur-sm">🛒 MARKETPLACE</span>
                                )}
                                {post.contentType === 'emergency' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/30 text-red-200 font-bold backdrop-blur-sm">🚨 EMERGENCY</span>
                                )}
                                {post.contentType === 'help_request' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/30 text-sky-200 font-bold backdrop-blur-sm">🤝 HELP REQUEST</span>
                                )}
                                {post.contentType === 'job' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-bold backdrop-blur-sm">💼 JOB</span>
                                )}
                                {post.contentType === 'gossip' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-200 font-bold backdrop-blur-sm">👀 GOSSIP</span>
                                )}
                            </div>
                        )}

                        {/* Event Info */}
                        {post.contentType === 'event' && (post as any).eventDate && (
                            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-black/30 backdrop-blur-sm">
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
                            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-black/30 backdrop-blur-sm">
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
                                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/15 text-white backdrop-blur-sm">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Edited / Priority */}
                        <div className="flex flex-wrap items-center gap-2">
                            {post.priority && post.priority !== 'normal' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm ${
                                    post.priority === 'critical' ? 'bg-red-500/30 text-red-200' :
                                    post.priority === 'high' ? 'bg-orange-500/30 text-orange-200' :
                                    'bg-blue-500/30 text-blue-200'
                                }`}>
                                    <span className="material-symbols-outlined text-[14px]">priority_high</span>
                                    {post.priority.charAt(0).toUpperCase() + post.priority.slice(1)}
                                </span>
                            )}
                            {post.updatedAt && post.updatedAt !== post.createdAt && (
                                <span className="text-xs italic text-white/50">(edited)</span>
                            )}
                        </div>

                        {/* Emergency Action Buttons */}
                        {isSafetyAlert && onEmergencyAction && (
                            <div className="flex flex-wrap gap-2">
                                {(!post.availableActions || post.availableActions.includes('acknowledge')) && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEmergencyAction('acknowledge'); }}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all backdrop-blur-sm ${
                                            post.isAcknowledged ? 'bg-blue-500/30 text-blue-200' : 'bg-white/10 hover:bg-blue-500/20 text-white/70'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">visibility</span>Acknowledge
                                    </button>
                                )}
                                {(!post.availableActions || post.availableActions.includes('aware')) && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEmergencyAction('aware'); }}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all backdrop-blur-sm ${
                                            post.isAware ? 'bg-amber-500/30 text-amber-200' : 'bg-white/10 hover:bg-amber-500/20 text-white/70'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">notifications_active</span>I&apos;m Aware
                                    </button>
                                )}
                                {(!post.availableActions || post.availableActions.includes('safe')) && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEmergencyAction('safe'); }}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all backdrop-blur-sm ${
                                            post.isSafe ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/10 hover:bg-emerald-500/20 text-white/70'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">shield</span>I&apos;m Safe
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <div className="flex gap-5">
                                {/* Like */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onLike(); }}
                                    className={`flex items-center gap-2 transition-colors group ${
                                        post.isLiked ? 'text-pink-400' : 'text-white/70 hover:text-white'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform drop-shadow-md ${post.isLiked ? 'fill-1' : ''}`}>
                                        favorite
                                    </span>
                                    {post.likes > 0 && <span className="text-sm font-bold drop-shadow-md">{post.likes}</span>}
                                </button>
                                {/* Comment */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onComment(); }}
                                    className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform drop-shadow-md">chat_bubble</span>
                                    {post.comments > 0 && <span className="text-sm font-bold drop-shadow-md">{post.comments}</span>}
                                </button>
                                {/* Share */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onShare(); }}
                                    className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform drop-shadow-md">share</span>
                                </button>
                                {/* Views */}
                                {post.views > 0 && (
                                    <span className="flex items-center gap-1.5 text-white/50">
                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        <span className="text-sm">{post.views}</span>
                                    </span>
                                )}
                                {/* Helpful */}
                                {post.contentType === 'fyi' && onHelpful && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onHelpful(); }}
                                        className={`flex items-center gap-1.5 transition-colors group ${
                                            post.isHelpful ? 'text-emerald-400' : 'text-white/70 hover:text-emerald-300'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform ${post.isHelpful ? 'fill-1' : ''}`}>thumb_up</span>
                                        {(post.helpfulCount || 0) > 0 && <span className="text-sm font-bold">{post.helpfulCount}</span>}
                                    </button>
                                )}
                            </div>
                            {/* Save */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onSave(); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all backdrop-blur-sm ${
                                    post.isSaved ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/15'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-[18px] ${post.isSaved ? 'fill-1' : ''}`}>bookmark</span>
                                <span>{post.isSaved ? 'Saved' : 'Save'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    // ── QUOTE-STYLE CARD (short text, no media, Facebook-style colored bg) ──
    if (isQuoteCard) {
        const gradient = quoteGradients[post.contentType || 'post'] || quoteGradients.post;
        const accentColor = quoteAccentColors[post.contentType || 'post'] || quoteAccentColors.post;

        return (
            <article
                className="relative overflow-hidden cursor-pointer"
                style={{ background: gradient, minHeight: '75vh' }}
                onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest('button') && !target.closest('a')) {
                        onCardClick?.();
                    }
                }}
            >
                <div className="flex flex-col justify-between" style={{ minHeight: '75vh' }}>
                    {/* ── TOP: Author ── */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/profile/${authorUsername}`}
                                className="flex-shrink-0 group"
                                onClick={handleProfileClick}
                                aria-label={`View ${authorName}'s profile`}
                            >
                                <img
                                    src={authorAvatar}
                                    alt={authorName}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20 group-hover:ring-white/40 transition-all"
                                    onError={(e) => {
                                        if (!imageError) {
                                            e.currentTarget.src = 'https://i.pravatar.cc/100?u=user';
                                            setImageError(true);
                                        }
                                    }}
                                />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Link
                                        href={`/profile/${authorUsername}`}
                                        onClick={handleProfileClick}
                                        className="font-bold text-sm text-white hover:underline"
                                    >
                                        {authorName}
                                    </Link>
                                    {post.contentType && post.contentType !== 'post' && (
                                        <span
                                            className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                                            style={{ color: accentColor, background: `${accentColor}20` }}
                                        >
                                            {post.contentType === 'gossip' ? 'GOSSIP' : post.contentType === 'event' ? 'EVENT' : post.contentType === 'marketplace' ? 'MARKETPLACE' : post.contentType === 'job' ? 'JOB' : post.contentType.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-white/50">
                                    {formatTimeAgo(post.createdAt)}
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                className="hover:bg-white/10 rounded-lg p-1 transition-colors text-white/60"
                            >
                                <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-8 z-20 w-40 rounded-xl overflow-hidden bg-black/70 backdrop-blur-xl border border-white/10" onClick={(e) => e.stopPropagation()}>
                                    {isOwner && onEdit && (
                                        <button onClick={() => { setShowMenu(false); onEdit(post); }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors text-white">
                                            <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                                        </button>
                                    )}
                                    {isOwner && onDelete && (
                                        <button onClick={() => { setShowMenu(false); onDelete(post.id); }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors text-red-400">
                                            <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                                        </button>
                                    )}
                                    {!isOwner && (
                                        <button onClick={() => { setShowMenu(false); onReport?.(post.id); }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors text-white/70">
                                            <span className="material-symbols-outlined text-[18px]">flag</span> Report
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── CENTER: Big quote text ── */}
                    <div className="px-6 py-4 flex-1 flex flex-col justify-center">
                        {/* Opening quote mark — top left */}
                        <span className="text-4xl leading-none mb-2 font-serif self-start" style={{ color: `${accentColor}40` }}>&ldquo;</span>
                        <p
                            className="font-extrabold leading-snug whitespace-pre-wrap break-words text-center"
                            style={{
                                color: accentColor,
                                fontSize: wordCount <= 10 ? '28px' : wordCount <= 20 ? '22px' : '18px',
                            }}
                        >
                            {textContent}
                        </p>
                        {/* Closing quote mark — bottom right */}
                        <span className="text-4xl leading-none mt-2 font-serif self-end" style={{ color: `${accentColor}40` }}>&rdquo;</span>
                    </div>

                    {/* ── Tags ── */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="px-6 pb-2 flex flex-wrap gap-1.5">
                            {post.tags.map((tag, i) => (
                                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Edited */}
                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <div className="px-6 pb-1">
                            <span className="text-xs italic text-white/30">(edited)</span>
                        </div>
                    )}

                    {/* ── BOTTOM: Actions ── */}
                    <div className="px-4 py-3 flex items-center justify-between border-t border-white/[0.06]">
                        <div className="flex gap-5">
                            <button
                                onClick={(e) => { e.stopPropagation(); onLike(); }}
                                className={`flex items-center gap-2 transition-colors group ${post.isLiked ? 'text-pink-400' : 'text-white/50 hover:text-white'}`}
                            >
                                <span className={`material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform ${post.isLiked ? 'fill-1' : ''}`}>favorite</span>
                                {post.likes > 0 && <span className="text-sm font-bold">{post.likes}</span>}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onComment(); }}
                                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
                            >
                                <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">chat_bubble</span>
                                {post.comments > 0 && <span className="text-sm font-bold">{post.comments}</span>}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onShare(); }}
                                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
                            >
                                <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">share</span>
                            </button>
                            {post.views > 0 && (
                                <span className="flex items-center gap-1.5 text-white/30">
                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                    <span className="text-sm">{post.views}</span>
                                </span>
                            )}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onSave(); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                                post.isSaved ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${post.isSaved ? 'fill-1' : ''}`}>bookmark</span>
                            <span>{post.isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                    </div>
                </div>
            </article>
        );
    }

    // ── CLASSIC CARD (no media — white card layout) ──
    return (
        <article
            className={`bg-white mod-card-hover cursor-pointer ${
                isSafetyAlert
                    ? 'border-l-2 border-l-orange-500/40'
                    : ''
            }`}
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest('button') && !target.closest('a')) {
                    onCardClick?.();
                }
            }}
        >
            {/* Content Type Accent Line */}
            <div className={`h-[2px] w-full accent-line-${post.contentType || 'post'} opacity-60`} />
            {/* Safety Alert Banner */}
            {isSafetyAlert && (
                <div className="px-4 py-2 flex items-center gap-2" style={{ background: 'rgba(249, 115, 22, 0.08)' }}>
                    <span className="material-symbols-outlined text-orange-500 text-sm">warning</span>
                    <span className="text-orange-500 text-xs font-bold uppercase tracking-wider">Safety Alert</span>
                </div>
            )}

            <div className="p-4">
                {/* Author Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/profile/${authorUsername}`}
                            className="flex-shrink-0 group"
                            onClick={handleProfileClick}
                            aria-label={`View ${authorName}'s profile`}
                        >
                            <img
                                src={authorAvatar}
                                alt={authorName}
                                className={`w-10 h-10 rounded-full object-cover group-hover:opacity-80 transition-opacity ${
                                    isSafetyAlert ? 'ring-2 ring-orange-500/30' : ''
                                }`}
                                onError={(e) => {
                                    if (!imageError) {
                                        e.currentTarget.src = 'https://i.pravatar.cc/100?u=user';
                                        setImageError(true);
                                    }
                                }}
                            />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                    href={`/profile/${authorUsername}`}
                                    onClick={handleProfileClick}
                                    className="font-bold text-sm hover:underline"
                                    style={{ color: 'var(--neu-text)' }}
                                >
                                    {authorName}
                                </Link>
                                {post.isPinned && (
                                    <span className="text-xs px-1.5 py-0.5 rounded mod-chip text-brand-blue font-medium">Pinned</span>
                                )}
                                {isSafetyAlert && severityLabel && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 font-bold tracking-wide">
                                        {severityLabel}
                                    </span>
                                )}
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold tracking-wide">
                                    {feedLayerLabel}
                                </span>
                                {post.contentType === 'fyi' && post.fyiSubtype && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold tracking-wide">
                                        {post.fyiSubtype.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                )}
                                {post.contentType === 'event' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold tracking-wide">
                                        📅 EVENT
                                    </span>
                                )}
                                {post.contentType === 'marketplace' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-bold tracking-wide">
                                        🛒 MARKETPLACE
                                    </span>
                                )}
                            </div>
                            <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                                {formatTimeAgo(post.createdAt)} {post.location && 'formattedAddress' in post.location && post.location.formattedAddress ? `• ${post.location.formattedAddress}` : (post.location && 'address' in post.location && (post.location as Record<string, unknown>).address ? `• ${(post.location as Record<string, unknown>).address}` : '')}
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className="hover:bg-white/5 rounded-lg p-1 transition-colors"
                            style={{ color: 'var(--neu-text-muted)' }}
                        >
                            <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-8 z-20 w-40 rounded-xl overflow-hidden mod-card-elevated" onClick={(e) => e.stopPropagation()}>
                                {isOwner && onEdit && (
                                    <button onClick={() => { setShowMenu(false); onEdit(post); }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-white/[0.06] transition-colors" style={{ color: 'var(--neu-text)' }}>
                                        <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                                    </button>
                                )}
                                {isOwner && onDelete && (
                                    <button onClick={() => { setShowMenu(false); onDelete(post.id); }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-white/[0.06] transition-colors text-red-400">
                                        <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                                    </button>
                                )}
                                {!isOwner && (
                                    <button onClick={() => { setShowMenu(false); onReport?.(post.id); }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-white/[0.06] transition-colors" style={{ color: 'var(--neu-text-muted)' }}>
                                        <span className="material-symbols-outlined text-[18px]">flag</span> Report
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Post Content */}
                <p className="text-base mb-3 leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--neu-text)' }}>
                    {post.content || post.body || ''}
                </p>

                {/* Event Info */}
                {post.contentType === 'event' && (post as any).eventDate && (
                    <div className="flex flex-wrap items-center gap-2 mb-3 p-2.5 rounded-xl bg-purple-500/5">
                        <span className="text-[11px] font-bold text-purple-400">📅 {new Date((post as any).eventDate).toLocaleDateString()}</span>
                        {(post as any).eventTime && <span className="text-[11px] text-purple-300">⏰ {(post as any).eventTime}</span>}
                        {(post as any).venue?.name && <span className="text-[11px] text-purple-300">📍 {(post as any).venue.name}</span>}
                        {(post as any).ticketInfo === 'paid' && (post as any).ticketPrice && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">₦{Number((post as any).ticketPrice).toLocaleString()}</span>
                        )}
                        {(post as any).ticketInfo === 'free' && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">FREE</span>
                        )}
                        {(post as any).eventCategory && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium capitalize">{(post as any).eventCategory}</span>
                        )}
                    </div>
                )}

                {/* Marketplace Info */}
                {post.contentType === 'marketplace' && (
                    <div className="flex flex-wrap items-center gap-2 mb-3 p-2.5 rounded-xl bg-green-500/5">
                        {(post as any).price != null && (
                            <span className="text-sm font-bold text-green-400">₦{Number((post as any).price).toLocaleString()}</span>
                        )}
                        {(post as any).isNegotiable && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-300 font-medium">Negotiable</span>
                        )}
                        {(post as any).itemCondition && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 font-medium capitalize">{(post as any).itemCondition === 'used' ? 'Tokunbo' : (post as any).itemCondition}</span>
                        )}
                        {(post as any).itemCategory && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">{(post as any).itemCategory}</span>
                        )}
                        {(post as any).deliveryOption && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-300 font-medium capitalize">{(post as any).deliveryOption}</span>
                        )}
                        {(post as any).availability && (post as any).availability !== 'available' && (
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                (post as any).availability === 'sold' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                                {(post as any).availability === 'sold' ? 'SOLD' : 'RESERVED'}
                            </span>
                        )}
                    </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((tag, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Cultural Context */}
                {post.culturalContext && post.culturalContext.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.culturalContext.map((ctx, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400"
                            >
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
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-medium">
                                {post.targetAudience.ageRange.min || '?'}-{post.targetAudience.ageRange.max || '?'} yrs
                            </span>
                        )}
                        {post.targetAudience.gender && post.targetAudience.gender !== 'all' && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-medium capitalize">
                                {post.targetAudience.gender}
                            </span>
                        )}
                        {post.targetAudience.interests && post.targetAudience.interests.length > 0 && post.targetAudience.interests.map((interest, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-medium">
                                {interest}
                            </span>
                        ))}
                    </div>
                )}

                {/* Priority Badge & Edited Indicator */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    {post.priority && post.priority !== 'normal' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            post.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                            post.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-blue-500/20 text-blue-400'
                        }`}>
                            <span className="material-symbols-outlined text-[14px]">priority_high</span>
                            {post.priority.charAt(0).toUpperCase() + post.priority.slice(1)}
                        </span>
                    )}
                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <span className="text-xs italic" style={{ color: 'var(--neu-text-muted)' }}>(edited)</span>
                    )}
                    {post.expiresAt && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 font-medium">
                            Expires: {new Date(post.expiresAt).toLocaleDateString()}
                        </span>
                    )}
                    {post.fyiStatus && post.fyiStatus !== 'active' && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                            post.fyiStatus === 'found' || post.fyiStatus === 'returned' || post.fyiStatus === 'resolved'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-gray-500/10 text-gray-400'
                        }`}>
                            {post.fyiStatus.charAt(0).toUpperCase() + post.fyiStatus.slice(1)}
                        </span>
                    )}
                    {post.endorsements && post.endorsements.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            Endorsed ({post.endorsements.length})
                        </span>
                    )}
                </div>
            </div>

            {/* Emergency Action Buttons */}
            {isSafetyAlert && onEmergencyAction && (
                <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-orange-500/10">
                    {(!post.availableActions || post.availableActions.includes('acknowledge')) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEmergencyAction('acknowledge'); }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                post.isAcknowledged
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-white/5 hover:bg-blue-500/10 text-blue-300/70'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            Acknowledge
                        </button>
                    )}
                    {(!post.availableActions || post.availableActions.includes('aware')) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEmergencyAction('aware'); }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                post.isAware
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-white/5 hover:bg-amber-500/10 text-amber-300/70'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                            I&apos;m Aware
                        </button>
                    )}
                    {(!post.availableActions || post.availableActions.includes('nearby')) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEmergencyAction('nearby'); }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                post.isNearby
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-white/5 hover:bg-green-500/10 text-green-300/70'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                            I&apos;m Nearby
                        </button>
                    )}
                    {(!post.availableActions || post.availableActions.includes('safe')) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEmergencyAction('safe'); }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                post.isSafe
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-white/5 hover:bg-emerald-500/10 text-emerald-300/70'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">shield</span>
                            I&apos;m Safe
                        </button>
                    )}
                    {(!post.availableActions || post.availableActions.includes('confirm')) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEmergencyAction('confirm'); }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                post.confirmDisputeAction === 'confirm'
                                    ? 'bg-teal-500/20 text-teal-400'
                                    : 'bg-white/5 hover:bg-teal-500/10 text-teal-300/70'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Confirm
                        </button>
                    )}
                    {(!post.availableActions || post.availableActions.includes('dispute')) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEmergencyAction('dispute'); }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                post.confirmDisputeAction === 'dispute'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-white/5 hover:bg-red-500/10 text-red-300/70'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                            Dispute
                        </button>
                    )}
                </div>
            )}

            {/* Action Bar */}
            <div className={`px-4 py-3 flex items-center justify-between`}>
                <div className="mod-divider absolute left-0 right-0" style={{ top: 0 }} />
                <div className="flex gap-6">
                    {/* Like */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onLike(); }}
                        className={`flex items-center gap-2 transition-colors group ${
                            post.isLiked
                                ? 'text-pink-500'
                                : 'hover:text-primary'
                        }`}
                        style={!post.isLiked ? { color: 'var(--neu-text-muted)' } : undefined}
                    >
                        <span className={`material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform ${post.isLiked ? 'fill-1' : ''}`}>
                            favorite
                        </span>
                        {post.likes > 0 && <span className="text-sm font-bold">{post.likes}</span>}
                    </button>

                    {/* Comment */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onComment(); }}
                        className="flex items-center gap-2 hover:text-primary transition-colors group"
                        style={{ color: 'var(--neu-text-muted)' }}
                    >
                        <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">chat_bubble</span>
                        {post.comments > 0 && <span className="text-sm font-bold">{post.comments}</span>}
                    </button>

                    {/* Share */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onShare(); }}
                        className="flex items-center gap-2 hover:text-primary transition-colors group"
                        style={{ color: 'var(--neu-text-muted)' }}
                    >
                        <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">share</span>
                    </button>

                    {/* Views */}
                    {post.views > 0 && (
                        <span className="flex items-center gap-1.5" style={{ color: 'var(--neu-text-muted)' }}>
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                            <span className="text-sm">{post.views}</span>
                        </span>
                    )}

                    {/* Helpful */}
                    {post.contentType === 'fyi' && onHelpful && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onHelpful(); }}
                            className={`flex items-center gap-1.5 transition-colors group ${
                                post.isHelpful ? 'text-emerald-500' : 'hover:text-emerald-400'
                            }`}
                            style={!post.isHelpful ? { color: 'var(--neu-text-muted)' } : undefined}
                        >
                            <span className={`material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform ${post.isHelpful ? 'fill-1' : ''}`}>
                                thumb_up
                            </span>
                            {(post.helpfulCount || 0) > 0 && <span className="text-sm font-bold">{post.helpfulCount}</span>}
                        </button>
                    )}
                </div>

                {/* Save / Bookmark */}
                <button
                    onClick={(e) => { e.stopPropagation(); onSave(); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                        post.isSaved
                            ? 'mod-btn-active text-primary'
                            : 'mod-btn hover:text-primary'
                    }`}
                    style={!post.isSaved ? { color: 'var(--neu-text-muted)' } : undefined}
                >
                    <span className={`material-symbols-outlined text-[18px] ${post.isSaved ? 'fill-1' : ''}`}>bookmark</span>
                    <span>{post.isSaved ? 'Saved' : 'Save'}</span>
                </button>
            </div>
        </article>
    );
}
