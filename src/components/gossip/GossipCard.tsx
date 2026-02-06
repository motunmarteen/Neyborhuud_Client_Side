/**
 * GossipCard Component
 * X.com-style card for displaying gossip posts with anonymous indicator
 */

import { GossipPost } from '@/types/gossip';
import Link from 'next/link';

interface GossipCardProps {
    post: GossipPost;
    onClick?: () => void;
}

export function GossipCard({ post, onClick }: GossipCardProps) {
    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    };

    const getDiscussionTypeColor = (type: string) => {
        switch (type) {
            case 'safety':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'event':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'question':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <article
            className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
            onClick={(e) => {
                // Don't trigger onClick if clicking on a link
                const target = e.target as HTMLElement;
                if (!target.closest('a')) {
                    onClick?.();
                }
            }}
        >
            <div className="flex gap-3">
                {/* Avatar - Only clickable if not anonymous */}
                {!post.anonymous && post.author.username ? (
                    <Link 
                        href={`/profile/${post.author.username}`} 
                        className="flex-shrink-0 group"
                        onClick={handleProfileClick}
                        aria-label={`View ${post.author.name}'s profile`}
                    >
                        <img
                            src={post.author.avatarUrl || '/default-avatar.png'}
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full object-cover group-hover:opacity-80 transition-opacity"
                            onError={(e) => {
                                e.currentTarget.src = 'https://ui-avatars.com/api/?name=Anonymous&background=6B9FED&color=fff';
                            }}
                        />
                    </Link>
                ) : (
                    <div className="flex-shrink-0">
                        <img
                            src={post.author.avatarUrl || '/default-avatar.png'}
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                                e.currentTarget.src = 'https://ui-avatars.com/api/?name=Anonymous&background=6B9FED&color=fff';
                            }}
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {!post.anonymous && post.author.username ? (
                            <Link 
                                href={`/profile/${post.author.username}`}
                                onClick={handleProfileClick}
                                className="font-bold text-[15px] text-gray-900 dark:text-gray-100 hover:underline"
                            >
                                {post.author.name}
                            </Link>
                        ) : (
                            <span className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
                                {post.author.name}
                            </span>
                        )}
                        {post.anonymous && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded-full flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <i className="bi bi-incognito" />
                                Anonymous
                            </span>
                        )}
                        <span className="text-gray-500 dark:text-gray-400 text-[15px]">
                            · {formatTimeAgo(post.createdAt)}
                        </span>
                    </div>

                    {/* Discussion Type Badge */}
                    <div className="mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDiscussionTypeColor(post.discussionType)}`}>
                            {post.discussionType.charAt(0).toUpperCase() + post.discussionType.slice(1)}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-[17px] mb-1 text-gray-900 dark:text-gray-100">
                        {post.title}
                    </h3>

                    {/* Body */}
                    <p className="text-[15px] text-gray-900 dark:text-gray-100 leading-5 whitespace-pre-wrap break-words">
                        {post.body}
                    </p>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="text-blue-500 dark:text-blue-400 text-[15px] hover:underline cursor-pointer"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Location */}
                    {post.location && (
                        <div className="flex items-center gap-1 mt-2 text-gray-500 dark:text-gray-400 text-[13px]">
                            <i className="bi bi-geo-alt" />
                            <span>{post.location.lga}, {post.location.state}</span>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-3 text-gray-500 dark:text-gray-400">
                        <button className="flex items-center gap-1 hover:text-blue-500 transition-colors group">
                            <i className="bi bi-chat text-lg group-hover:text-blue-500" />
                            <span className="text-[13px]">{post.commentsCount || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
