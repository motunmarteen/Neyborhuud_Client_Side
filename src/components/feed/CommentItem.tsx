import React, { useState } from 'react';
import { Comment } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { useCommentMutations } from '@/hooks/useComments';
import { CommentForm } from './CommentForm';
import Link from 'next/link';

interface CommentItemProps {
    comment: Comment;
    postId: string;
    isReply?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, isReply }) => {
    const { user } = useAuth();
    const { deleteComment, likeComment, unlikeComment } = useCommentMutations(postId);
    const [isReplying, setIsReplying] = useState(false);

    const author = typeof comment.userId === 'object' ? comment.userId : null;
    const authorId = author?.id || author?._id || (typeof comment.userId === 'string' ? comment.userId : '');
    const username = author?.username || 'user';
    const avatarUrl = author?.avatarUrl || 'https://i.pravatar.cc/100?u=' + username;
    const displayName = [author?.firstName, author?.lastName].filter(Boolean).join(' ') || username;

    const isAuthor = user?.id === authorId;

    const handleLike = () => {
        if (comment.isLiked) {
            unlikeComment(comment.id);
        } else {
            likeComment(comment.id);
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            deleteComment(comment.id);
        }
    };

    const formatTimeAgo = (dateString: string): string => {
        if (!dateString) return '';
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

    return (
        <div className={`flex gap-3 ${isReply ? 'mt-3 pl-2 sm:pl-4' : 'py-4'}`} style={isReply ? { borderLeft: '2px solid var(--neu-shadow-dark)' } : {}}>
            {/* Avatar & Thread Line - Avatar is smaller for replies */}
            <Link 
                href={`/profile/${username}`} 
                className="flex flex-col items-center flex-shrink-0"
            >
                <img
                    src={avatarUrl}
                    alt={username}
                    className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover transition-opacity hover:opacity-80 cursor-pointer neu-avatar`}
                    onError={(e) => {
                        e.currentTarget.src = 'https://i.pravatar.cc/100?u=' + username;
                    }}
                />
            </Link>

            {/* Content Container */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Link 
                            href={`/profile/${username}`}
                            className="font-bold text-[15px] hover:underline cursor-pointer"
                            style={{ color: 'var(--neu-text)' }}
                        >
                            {displayName}
                        </Link>
                        <Link
                            href={`/profile/${username}`}
                            className="text-[14px] hover:underline truncate max-w-[100px] sm:max-w-none"
                            style={{ color: 'var(--neu-text-muted)' }}
                        >
                            @{username}
                        </Link>
                        <span style={{ color: 'var(--neu-text-muted)' }}>·</span>
                        <span className="text-[14px] hover:underline cursor-pointer" style={{ color: 'var(--neu-text-muted)' }}>
                            {formatTimeAgo(comment.createdAt)}
                        </span>
                    </div>

                    {isAuthor && (
                        <button
                            onClick={handleDelete}
                            className="hover:text-red-400 transition-colors p-1.5 rounded-full hover:bg-red-400/10"
                            style={{ color: 'var(--neu-text-muted)' }}
                            title="Delete comment"
                        >
                            <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                    )}
                </div>

                {/* Comment Body */}
                <div className="text-[15px] leading-normal mt-0.5 whitespace-pre-wrap break-words" style={{ color: 'var(--neu-text)' }}>
                    {comment.body}
                </div>

                {/* Media Grid */}
                {comment.mediaUrls && comment.mediaUrls.length > 0 && (
                    <div className="mt-3 neu-card-sm rounded-xl overflow-hidden grid grid-cols-2 gap-0.5 max-w-md">
                        {comment.mediaUrls.map((url, idx) => (
                            <div key={idx} className={`${comment.mediaUrls?.length === 1 ? 'col-span-2' : ''} relative aspect-square`}>
                                <img
                                    src={url}
                                    alt="Comment media"
                                    className="w-full h-full object-cover cursor-zoom-in hover:brightness-90 transition-all"
                                    onError={(e) => {
                                        e.currentTarget.src = 'https://placehold.co/400x400?text=Image+Unavailable';
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions Toolbar */}
                <div className="flex items-center gap-6 mt-3" style={{ color: 'var(--neu-text-muted)' }}>
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 group transition-colors ${comment.isLiked ? 'text-pink-400' : 'hover:text-pink-400'}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:bg-pink-400/10 transition-colors`}>
                            <span className={`material-symbols-outlined text-[18px] ${comment.isLiked ? 'fill-1' : ''}`}>favorite</span>
                        </div>
                        {comment.likes > 0 && <span className="text-xs font-medium">{comment.likes}</span>}
                    </button>

                    <button
                        onClick={() => setIsReplying(!isReplying)}
                        className={`flex items-center gap-2 group transition-colors ${isReplying ? 'text-primary' : 'hover:text-primary'}`}
                    >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                        </div>
                        <span className="text-xs font-medium">Reply</span>
                    </button>

                    <button className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors group">
                        <span className="material-symbols-outlined text-[18px]">share</span>
                    </button>
                </div>

                {/* Inline Reply Form */}
                {isReplying && (
                    <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                        <CommentForm
                            postId={postId}
                            parentId={comment.id}
                            onSuccess={() => setIsReplying(false)}
                            placeholder={`Replying to @${username}...`}
                            autoFocus
                        />
                    </div>
                )}

                {/* Recursive Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                postId={postId}
                                isReply
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
