/**
 * XPostCard Component - X.com Style Post Card
 * Clean, minimal design matching X.com's aesthetic
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

    return (
        <article
            className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
            onClick={(e) => {
                // Only trigger card click if not clicking on an action button or link
                const target = e.target as HTMLElement;
                if (!target.closest('button') && !target.closest('a')) {
                    onCardClick?.();
                }
            }}
        >
            <div className="flex gap-3">
                {/* Avatar */}
                <Link 
                    href={`/profile/${authorUsername}`} 
                    className="flex-shrink-0 group" 
                    onClick={handleProfileClick}
                    aria-label={`View ${authorName}'s profile`}
                >
                    <img
                        src={authorAvatar}
                        alt={authorName}
                        className="w-10 h-10 rounded-full object-cover group-hover:opacity-80 transition-opacity"
                        onError={(e) => {
                            if (!imageError) {
                                e.currentTarget.src = 'https://i.pravatar.cc/100?u=user';
                                setImageError(true);
                            }
                        }}
                    />
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-1 mb-0.5">
                        <Link
                            href={`/profile/${authorUsername}`}
                            onClick={handleProfileClick}
                            className="font-bold text-[15px] text-gray-900 dark:text-gray-100 hover:underline truncate"
                        >
                            {authorName}
                        </Link>
                        <Link
                            href={`/profile/${authorUsername}`}
                            onClick={handleProfileClick}
                            className="text-[15px] text-gray-500 dark:text-gray-400 hover:underline truncate"
                        >
                            @{authorUsername}
                        </Link>
                        <span className="text-gray-500 dark:text-gray-400">·</span>
                        <span className="text-[15px] text-gray-500 dark:text-gray-400 hover:underline">
                            {formatTimeAgo(post.createdAt)}
                        </span>
                        {/* Pinned Badge */}
                        {post.isPinned && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                                📌 Pinned
                            </span>
                        )}
                    </div>

                    {/* Post Content */}
                    <div className="text-[15px] text-gray-900 dark:text-gray-100 leading-5 mb-3 whitespace-pre-wrap break-words">
                        {post.content || post.body || ''}
                    </div>

                    {/* Media */}
                    {mediaUrls.length > 0 && (
                        <div className={`mb-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 ${mediaUrls.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'
                            }`}>
                            {mediaUrls.slice(0, 4).map((url, index) => (
                                <div
                                    key={index}
                                    className={`relative ${mediaUrls.length === 1 ? 'aspect-video' : 'aspect-square'
                                        } ${mediaUrls.length === 3 && index === 0 ? 'col-span-2' : ''}`}
                                >
                                    <img
                                        src={url}
                                        alt={`Post media ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {mediaUrls.length > 4 && index === 3 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-white text-2xl font-bold">
                                                +{mediaUrls.length - 4}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between max-w-md -ml-2">
                        {/* Comment */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onComment();
                            }}
                            className="flex items-center gap-1 group p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                            <i className="bi bi-chat text-lg text-gray-500 group-hover:text-blue-500 transition-colors" />
                            {post.comments > 0 && (
                                <span className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
                                    {post.comments}
                                </span>
                            )}
                        </button>

                        {/* Repost/Share */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onShare();
                            }}
                            className="flex items-center gap-1 group p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                        >
                            <i className="bi bi-repeat text-lg text-gray-500 group-hover:text-green-500 transition-colors" />
                            {post.shares > 0 && (
                                <span className="text-xs text-gray-500 group-hover:text-green-500 transition-colors">
                                    {post.shares}
                                </span>
                            )}
                        </button>

                        {/* Like */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onLike();
                            }}
                            className="flex items-center gap-1 group p-2 rounded-full hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                        >
                            <i
                                className={`bi ${post.isLiked ? 'bi-heart-fill text-pink-600' : 'bi-heart'
                                    } text-lg ${post.isLiked ? '' : 'text-gray-500 group-hover:text-pink-600'
                                    } transition-colors`}
                            />
                            {post.likes > 0 && (
                                <span
                                    className={`text-xs ${post.isLiked ? 'text-pink-600' : 'text-gray-500 group-hover:text-pink-600'
                                        } transition-colors`}
                                >
                                    {post.likes}
                                </span>
                            )}
                        </button>

                        {/* Views */}
                        <button className="flex items-center gap-1 group p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <i className="bi bi-bar-chart text-lg text-gray-500 group-hover:text-blue-500 transition-colors" />
                            {post.views > 0 && (
                                <span className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
                                    {post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views}
                                </span>
                            )}
                        </button>

                        {/* Bookmark/Save */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSave();
                            }}
                            className="flex items-center gap-1 group p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                            <i
                                className={`bi ${post.isSaved ? 'bi-bookmark-fill text-blue-500' : 'bi-bookmark'
                                    } text-lg ${post.isSaved ? '' : 'text-gray-500 group-hover:text-blue-500'
                                    } transition-colors`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
