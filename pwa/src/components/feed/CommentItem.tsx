import React, { useState } from 'react';
import { Comment } from '@/types/api';
import { formatTimeAgo } from '@/utils/timeAgo';
import { useAuth } from '@/hooks/useAuth';
import { useCommentMutations } from '@/hooks/useComments';
import { CommentForm } from './CommentForm';
import Link from 'next/link';
import Image from 'next/image';

interface CommentItemProps {
    comment: Comment;
    postId: string;
    isReply?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, isReply }) => {
    const { user } = useAuth();
    const { deleteComment, likeComment, unlikeComment } = useCommentMutations(postId);
    const [isReplying, setIsReplying] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    const author = typeof comment.userId === 'object' ? comment.userId : null;
    const authorId = author?.id || author?._id || (typeof comment.userId === 'string' ? comment.userId : '');
    const username = author?.username || 'user';
    const avatarUrl = author?.avatarUrl || null;
    const displayName = [author?.firstName, author?.lastName].filter(Boolean).join(' ') || username;

    const isAuthor = user?.id === authorId;
    const replyCount = comment.replies?.length || 0;

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

    // Detect status-update comments (emergency quick actions)
    let isStatusUpdate = false;
    let statusType = '';
    let cleanBody = comment.body;

    const statusMatch = comment.body.match(/^\[STATUS:(AWARE|NEARBY|SAFE|CONFIRM|DISPUTE)\]/);
    if (statusMatch) {
        isStatusUpdate = true;
        statusType = statusMatch[1];
        cleanBody = comment.body.replace(statusMatch[0], '').trim();
    } else {
        const legacyMap: Record<string, string> = {
            '🔔 I am aware of this situation.': 'AWARE',
            '📍 I am nearby and monitoring.': 'NEARBY',
            '🛡️ I have marked myself as safe.': 'SAFE',
            '✅ I can confirm this alert is accurate.': 'CONFIRM',
            '❌ I am disputing this alert. Please verify.': 'DISPUTE',
        };
        if (legacyMap[comment.body]) {
            isStatusUpdate = true;
            statusType = legacyMap[comment.body];
            cleanBody = '';
        }
    }

    const statusMeta = (() => {
        switch (statusType) {
            case 'AWARE': return { icon: 'notifications_active', label: 'Aware of situation', colors: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' };
            case 'NEARBY': return { icon: 'location_on', label: 'Nearby and monitoring', colors: 'bg-brand-red/10 text-brand-red border-brand-red/20' };
            case 'SAFE': return { icon: 'shield', label: 'Marked as safe', colors: 'bg-brand-green/10 text-brand-green border-brand-green/20' };
            case 'CONFIRM': return { icon: 'check_circle', label: 'Confirmed alert', colors: 'bg-primary/10 text-primary border-primary/20' };
            case 'DISPUTE': return { icon: 'cancel', label: 'Disputed alert', colors: 'bg-brand-red/10 text-brand-red border-brand-red/20' };
            default: return null;
        }
    })();

    const hasBubbleContent = !isStatusUpdate || !!cleanBody;

    return (
        <div className={`flex gap-2.5 ${isReply ? 'mt-2.5' : 'py-2'}`}>
            {/* Avatar (smaller for replies — IG style) */}
            <Link
                href={`/profile/${username}`}
                className="flex-shrink-0"
            >
                <div className={`relative flex ${isReply ? 'h-8 w-8' : 'h-10 w-10'} items-center justify-center overflow-hidden rounded-full border-[1.5px] border-white/60 dark:border-white/10 bg-white dark:bg-[#1A221C] shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-transform active:scale-95`}>
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt={username}
                            fill
                            sizes={isReply ? '32px' : '40px'}
                            className="object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-[16px] opacity-50">person</span>';
                            }}
                        />
                    ) : (
                        <span className="material-symbols-outlined text-[16px] opacity-50">person</span>
                    )}
                </div>
            </Link>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                    {/* Bubble (Facebook style) */}
                    <div className="min-w-0 flex-1">
                        {isStatusUpdate && statusMeta && (
                            <div className={`mb-1 inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${statusMeta.colors}`}>
                                <span className="material-symbols-outlined text-[16px]">{statusMeta.icon}</span>
                                {statusMeta.label}
                            </div>
                        )}

                        {hasBubbleContent && (
                            <div className="inline-block max-w-full rounded-[18px] bg-black/[0.045] px-3.5 py-2 dark:bg-white/[0.06]">
                                <Link
                                    href={`/profile/${username}`}
                                    className="mr-1.5 text-[14px] font-semibold leading-[1.45] text-[#050505] hover:underline dark:text-[#E4E6EB]"
                                >
                                    {displayName}
                                </Link>
                                <span className="text-[12px] font-normal text-[#65676B] dark:text-[#B0B3B8]">@{username}</span>
                                <span className="ml-1.5 whitespace-pre-wrap break-words text-[14px] font-normal leading-[1.45] text-[#050505] dark:text-[#E4E6EB]">
                                    {isStatusUpdate ? cleanBody : comment.body}
                                </span>
                            </div>
                        )}

                        {/* Media Grid — fills the comment content width (feed-style) */}
                        {comment.mediaUrls && comment.mediaUrls.length > 0 && (
                            <div className="mt-2 grid w-full grid-cols-2 gap-0.5 overflow-hidden rounded-xl">
                                {comment.mediaUrls.map((url, idx) => (
                                    <div key={idx} className={`${comment.mediaUrls?.length === 1 ? 'col-span-2' : ''} relative aspect-square`}>
                                        <Image
                                            src={url}
                                            alt="Comment media"
                                            fill
                                            sizes="50vw"
                                            className="cursor-zoom-in object-cover transition-all hover:brightness-90"
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://placehold.co/400x400?text=Image+Unavailable';
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Micro action row (Facebook: Like · Reply · time) */}
                        <div className="mt-1 flex items-center gap-4 pl-1 text-[12px] font-bold text-[#65676B] dark:text-[#B0B3B8]">
                            <button
                                type="button"
                                onClick={handleLike}
                                className={`transition-colors ${comment.isLiked ? 'text-brand-red' : 'hover:text-[#050505] dark:hover:text-[#E4E6EB]'}`}
                            >
                                Like
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsReplying(!isReplying)}
                                className={`transition-colors ${isReplying ? 'text-brand-blue' : 'hover:text-[#050505] dark:hover:text-[#E4E6EB]'}`}
                            >
                                Reply
                            </button>
                            <span className="font-normal">
                                {formatTimeAgo(comment.createdAt)}
                            </span>
                            {isAuthor && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="transition-colors hover:text-brand-red"
                                    title="Delete comment"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right-edge heart (Instagram style) */}
                    <button
                        type="button"
                        onClick={handleLike}
                        className="mt-1 flex flex-shrink-0 flex-col items-center gap-0.5 pr-0.5 text-[var(--neu-text-muted)] transition-colors"
                        aria-label={comment.isLiked ? 'Unlike comment' : 'Like comment'}
                    >
                        <span className={`material-symbols-outlined text-[17px] ${comment.isLiked ? 'fill-1 text-brand-red' : ''}`}>
                            favorite
                        </span>
                        {comment.likes > 0 && (
                            <span className="text-[11px] font-semibold leading-none tabular-nums">{comment.likes}</span>
                        )}
                    </button>
                </div>

                {/* Inline Reply Form */}
                {isReplying && (
                    <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                        <CommentForm
                            postId={postId}
                            parentId={comment.id}
                            onSuccess={() => setIsReplying(false)}
                            placeholder={`Replying to @${username}...`}
                            autoFocus
                        />
                    </div>
                )}

                {/* Replies — collapsed behind a toggle (hybrid) */}
                {replyCount > 0 && (
                    <div className="mt-1.5">
                        <button
                            type="button"
                            onClick={() => setShowReplies(!showReplies)}
                            className="flex items-center gap-2 pl-1 text-[12px] font-bold text-[#65676B] transition-colors hover:text-[#050505] dark:text-[#B0B3B8] dark:hover:text-[#E4E6EB]"
                        >
                            <span className="h-px w-5 bg-[var(--neu-shadow-dark)]" aria-hidden />
                            {showReplies
                                ? 'Hide replies'
                                : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
                        </button>

                        {showReplies && (
                            <div className="mt-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                {comment.replies!.map((reply) => (
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
                )}
            </div>
        </div>
    );
};
