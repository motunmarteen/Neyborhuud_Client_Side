import React, { useState } from 'react';
import { Comment } from '@/types/api';
import { formatTimeAgo } from '@/utils/timeAgo';
import { useAuth } from '@/hooks/useAuth';
import { useCommentMutations } from '@/hooks/useComments';
import { CommentForm } from './CommentForm';
import Link from 'next/link';
import MapPinAvatar from '@/components/ui/MapPinAvatar';

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
    const avatarUrl = author?.avatarUrl || null;
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



    return (
        <div className={`flex gap-3 ${isReply ? 'mt-3 pl-2 sm:pl-4' : 'py-4'}`} style={isReply ? { borderLeft: '2px solid var(--neu-shadow-dark)' } : {}}>
            {/* Avatar & Thread Line - Avatar is smaller for replies */}
            <Link 
                href={`/profile/${username}`} 
                className="flex flex-col items-center flex-shrink-0"
            >
                <MapPinAvatar
                    src={avatarUrl}
                    alt={username}
                    size={isReply ? 'xs' : 'sm'}
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
                            className="max-w-[100px] truncate text-[14px] text-[var(--neu-text-secondary)] hover:underline sm:max-w-none"
                        >
                            @{username}
                        </Link>
                        <span className="text-[var(--neu-text-muted)]">·</span>
                        <span className="cursor-pointer text-[14px] text-[var(--neu-text-muted)] hover:underline">
                            {formatTimeAgo(comment.createdAt)}
                        </span>
                    </div>

                    {isAuthor && (
                        <button
                            onClick={handleDelete}
                            className="rounded-full p-1.5 text-[var(--neu-text-muted)] transition-colors hover:bg-red-400/10 hover:text-red-600 dark:hover:text-red-300"
                            title="Delete comment"
                        >
                            <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                    )}
                </div>

                {/* Comment Body */}
                <div className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-normal text-[var(--neu-text)]">
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
                <div className="mt-3 flex items-center gap-6 text-[var(--neu-text-muted)]">
                    <button
                        onClick={handleLike}
                        className={`group flex items-center gap-2 transition-colors ${comment.isLiked ? 'text-pink-500 dark:text-pink-400' : 'hover:text-pink-500 dark:hover:text-pink-400'}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:bg-pink-400/10 transition-colors`}>
                            <span className={`material-symbols-outlined text-[18px] ${comment.isLiked ? 'fill-1' : ''}`}>favorite</span>
                        </div>
                        {comment.likes > 0 && <span className="text-xs font-medium">{comment.likes}</span>}
                    </button>

                    <button
                        onClick={() => setIsReplying(!isReplying)}
                        className={`group flex items-center gap-2 transition-colors ${isReplying ? 'text-primary' : 'hover:text-primary'}`}
                    >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                        </div>
                        <span className="text-xs font-medium">Reply</span>
                    </button>

                    <button className="group flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-primary/10 hover:text-primary">
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
