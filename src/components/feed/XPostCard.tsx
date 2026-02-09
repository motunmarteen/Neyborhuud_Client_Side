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
    formatTimeAgo: (date: string) => string;
    onCardClick?: () => void;
}

export function XPostCard({
    post,
    onLike,
    onComment,
    onShare,
    onSave,
    formatTimeAgo,
    onCardClick,
}: XPostCardProps) {
    const [imageError, setImageError] = useState(false);

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

    // Determine if safety alert
    const isSafetyAlert = post.tags?.includes('safety') || post.tags?.includes('SAFETY') || (post as unknown as Record<string, unknown>).category === 'SAFETY';

    return (
        <article
            className={`neu-card-sm rounded-2xl overflow-hidden cursor-pointer transition-all ${
                isSafetyAlert
                    ? 'ring-1 ring-orange-500/30'
                    : ''
            }`}
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest('button') && !target.closest('a')) {
                    onCardClick?.();
                }
            }}
        >
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
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/profile/${authorUsername}`}
                                    onClick={handleProfileClick}
                                    className="font-bold text-sm hover:underline"
                                    style={{ color: 'var(--neu-text)' }}
                                >
                                    {authorName}
                                </Link>
                                {/* Pinned Badge */}
                                {post.isPinned && (
                                    <span className="text-xs px-1.5 py-0.5 rounded neu-chip text-brand-blue font-medium">Pinned</span>
                                )}
                            </div>
                            <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                                {formatTimeAgo(post.createdAt)} {post.location && 'formattedAddress' in post.location && post.location.formattedAddress ? `• ${post.location.formattedAddress}` : (post.location && 'address' in post.location && (post.location as Record<string, unknown>).address ? `• ${(post.location as Record<string, unknown>).address}` : '')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={(e) => e.stopPropagation()}
                        className="hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--neu-text-muted)' }}
                    >
                        <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                </div>

                {/* Post Content */}
                <p className="text-base mb-3 leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--neu-text)' }}>
                    {post.content || post.body || ''}
                </p>

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
            </div>

            {/* Media */}
            {mediaUrls.length > 0 && (
                <div className="px-4 pb-4">
                    <div className={`rounded-lg overflow-hidden ${
                        mediaUrls.length === 1
                            ? 'w-full h-[400px] bg-cover bg-center relative group'
                            : 'grid grid-cols-2 gap-1'
                    }`}>
                        {mediaUrls.slice(0, 4).map((url, index) => (
                            <div
                                key={index}
                                className={`relative ${
                                    mediaUrls.length === 1 ? 'w-full h-full' : 'aspect-square'
                                } ${mediaUrls.length === 3 && index === 0 ? 'col-span-2' : ''} overflow-hidden`}
                            >
                                <img
                                    src={url}
                                    alt={`Post media ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors"></div>
                                {mediaUrls.length > 4 && index === 3 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white text-2xl font-bold">+{mediaUrls.length - 4}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div className={`px-4 py-3 flex items-center justify-between`}>
                <div className="neu-divider absolute left-0 right-0" style={{ top: 0 }} />
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
                </div>

                {/* Save / Bookmark */}
                <button
                    onClick={(e) => { e.stopPropagation(); onSave(); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                        post.isSaved
                            ? 'neu-btn-active text-primary'
                            : 'neu-btn hover:text-primary'
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
