/**
 * GossipCard Component
 * Card for displaying gossip posts with anonymous indicator – Stitch theme
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
                return 'bg-red-500/10 text-red-400';
            case 'event':
                return 'bg-blue-500/10 text-blue-400';
            case 'question':
            case 'community_question':
                return 'bg-purple-500/10 text-purple-400';
            default:
                return 'neu-chip';
        }
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <article
            className="neu-card-sm rounded-2xl p-4 hover:opacity-90 transition-all cursor-pointer"
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest('a')) {
                    onClick?.();
                }
            }}
        >
            <div className="flex gap-3">
                {/* Avatar */}
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
                            className="w-10 h-10 rounded-full object-cover group-hover:opacity-80 transition-opacity neu-avatar"
                            onError={(e) => {
                                e.currentTarget.src = 'https://ui-avatars.com/api/?name=Anonymous&background=11d473&color=102219';
                            }}
                        />
                    </Link>
                ) : (
                    <div className="flex-shrink-0">
                        <img
                            src={post.author.avatarUrl || '/default-avatar.png'}
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full object-cover neu-avatar"
                            onError={(e) => {
                                e.currentTarget.src = 'https://ui-avatars.com/api/?name=AN&background=11d473&color=102219';
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
                                className="font-bold text-[15px] hover:underline"
                                style={{ color: 'var(--neu-text)' }}
                            >
                                {post.author.name}
                            </Link>
                        ) : (
                            <span className="font-bold text-[15px]" style={{ color: 'var(--neu-text)' }}>
                                {post.author.name}
                            </span>
                        )}
                        {post.anonymous && (
                            <span className="neu-chip px-2 py-0.5 text-xs rounded-full flex items-center gap-1" style={{ color: 'var(--neu-text-muted)' }}>
                                <span className="material-symbols-outlined text-xs">lock</span>
                                Anonymous
                            </span>
                        )}
                        <span className="text-[15px]" style={{ color: 'var(--neu-text-muted)' }}>
                            · {formatTimeAgo(post.createdAt)}
                        </span>
                    </div>

                    {/* Discussion Type Badge */}
                    <div className="mb-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getDiscussionTypeColor(post.discussionType)}`}>
                            {post.discussionType.charAt(0).toUpperCase() + post.discussionType.slice(1)}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-[17px] mb-1" style={{ color: 'var(--neu-text)' }}>
                        {post.title}
                    </h3>

                    {/* Body */}
                    <p className="text-[15px] leading-5 whitespace-pre-wrap break-words" style={{ color: 'var(--neu-text)' }}>
                        {post.body}
                    </p>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="text-primary text-[15px] hover:underline cursor-pointer"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Location */}
                    {post.location && (
                        <div className="flex items-center gap-1 mt-2 text-[13px]" style={{ color: 'var(--neu-text-muted)' }}>
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            <span>{post.location.lga}, {post.location.state}</span>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-3" style={{ color: 'var(--neu-text-muted)' }}>
                        <button className="flex items-center gap-1 hover:text-primary transition-colors group">
                            <span className="material-symbols-outlined text-lg group-hover:text-primary transition-colors">chat_bubble_outline</span>
                            <span className="text-[13px]">{post.commentsCount || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
