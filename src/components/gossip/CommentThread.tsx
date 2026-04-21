/**
 * CommentThread Component
 * Recursive threaded comment display for gossip discussions
 */

'use client';

import { useState } from 'react';
import { GossipComment } from '@/types/gossip';
import { formatTimeAgo } from '@/utils/timeAgo';
import { GossipCommentInput } from './GossipCommentInput';
import Link from 'next/link';
import MapPinAvatar from '@/components/ui/MapPinAvatar';

interface CommentThreadProps {
    comment: GossipComment;
    onReply: (body: string, anonymous: boolean, parentId: string) => Promise<void>;
    isSubmitting?: boolean;
    replies?: GossipComment[];
    onLoadReplies?: (parentId: string) => void;
    maxDepth?: number;
    currentUserId?: string;
    onLikeComment?: (commentId: string) => void;
    onDeleteComment?: (commentId: string) => Promise<unknown>;
    isLikingCommentId?: string;
    isDeletingCommentId?: string;
}

export function CommentThread({
    comment,
    onReply,
    isSubmitting = false,
    replies = [],
    onLoadReplies,
    maxDepth = 5,
    currentUserId,
    onLikeComment,
    onDeleteComment,
    isLikingCommentId,
    isDeletingCommentId,
}: CommentThreadProps) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    const commentId = comment.id || comment._id || '';
    const canReply = comment.depth < maxDepth;
    const hasReplies = comment.replyCount > 0;

    const handleReply = async (body: string, anonymous: boolean) => {
        await onReply(body, anonymous, commentId);
        setShowReplyInput(false);
    };

    const toggleReplies = () => {
        if (!showReplies && onLoadReplies) {
            onLoadReplies(commentId);
        }
        setShowReplies(!showReplies);
    };

    return (
        <div className={`${comment.depth > 0 ? 'ml-6 pl-3 border-l-2' : ''}`} style={{ borderColor: 'var(--neu-shadow-light)' }}>
            <div className="py-3">
                {/* Comment header */}
                <div className="flex items-start gap-2">
                    {/* Avatar */}
                    {!comment.anonymous && comment.author?.username ? (
                        <Link href={`/profile/${comment.author.username}`} className="flex-shrink-0">
                            <MapPinAvatar
                                src={comment.author.avatarUrl}
                                alt={comment.author.name}
                                size="xs"
                            />
                        </Link>
                    ) : (
                        <div className="flex-shrink-0">
                            <MapPinAvatar
                                src={null}
                                alt="Anonymous"
                                size="xs"
                                fallbackInitial="?"
                            />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        {/* Author line */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {!comment.anonymous && comment.author?.username ? (
                                <Link
                                    href={`/profile/${comment.author.username}`}
                                    className="font-bold text-[13px] hover:underline"
                                    style={{ color: 'var(--neu-text)' }}
                                >
                                    {comment.author.name}
                                </Link>
                            ) : (
                                <span className="font-bold text-[13px]" style={{ color: 'var(--neu-text)' }}>
                                    Anonymous Neighbor
                                </span>
                            )}
                            {comment.anonymous && (
                                <span className="text-[11px] flex items-center gap-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                                    <span className="material-symbols-outlined text-[11px]">lock</span>
                                </span>
                            )}
                            <span className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>
                                · {formatTimeAgo(comment.createdAt)}
                            </span>
                        </div>

                        {/* Comment body */}
                        <p className="text-[14px] leading-5 mt-1 whitespace-pre-wrap break-words" style={{ color: 'var(--neu-text)' }}>
                            {comment.body}
                        </p>

                        {/* Slang enrichment tooltip */}
                        {comment.slangEnrichment?.hasSlang && comment.slangEnrichment.meanings && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                                {comment.slangEnrichment.meanings.map((m) => (
                                    <span
                                        key={m.term}
                                        className="text-[11px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400"
                                        title={`${m.term}: ${m.meaning}`}
                                    >
                                        {m.term} → {m.meaning}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-1.5" style={{ color: 'var(--neu-text-muted)' }}>
                            {/* Like button */}
                            {onLikeComment && (
                                <button
                                    onClick={() => onLikeComment(commentId)}
                                    disabled={isLikingCommentId === commentId}
                                    className="flex items-center gap-1 text-[12px] hover:text-red-400 transition-colors group disabled:opacity-50"
                                >
                                    <span className={`material-symbols-outlined text-sm transition-colors ${
                                        comment.isLiked ? 'fill-1 text-red-400' : 'group-hover:text-red-400'
                                    }`}>
                                        favorite
                                    </span>
                                    {(comment.likeCount || 0) > 0 && (
                                        <span>{comment.likeCount}</span>
                                    )}
                                </button>
                            )}
                            {canReply && (
                                <button
                                    onClick={() => setShowReplyInput(!showReplyInput)}
                                    className="text-[12px] font-medium hover:text-primary transition-colors"
                                >
                                    Reply
                                </button>
                            )}
                            {hasReplies && (
                                <button
                                    onClick={toggleReplies}
                                    className="text-[12px] font-medium hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        {showReplies ? 'expand_less' : 'expand_more'}
                                    </span>
                                    {showReplies ? 'Hide' : `${comment.replyCount}`} {comment.replyCount === 1 ? 'reply' : 'replies'}
                                </button>
                            )}
                            {/* Delete button — owner-only, non-anonymous */}
                            {onDeleteComment && currentUserId && !comment.anonymous && comment.author?.id === currentUserId && (
                                <button
                                    onClick={() => onDeleteComment(commentId)}
                                    disabled={isDeletingCommentId === commentId}
                                    className="text-[12px] font-medium text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50"
                                >
                                    {isDeletingCommentId === commentId ? 'Deleting...' : 'Delete'}
                                </button>
                            )}
                        </div>

                        {/* Reply input */}
                        {showReplyInput && (
                            <div className="mt-2">
                                <GossipCommentInput
                                    onSubmit={handleReply}
                                    parentId={commentId}
                                    placeholder="Write a reply..."
                                    isSubmitting={isSubmitting}
                                    autoFocus
                                    onCancel={() => setShowReplyInput(false)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Nested replies */}
            {showReplies && replies.length > 0 && (
                <div>
                    {replies.map((reply) => (
                        <CommentThread
                            key={reply.id || reply._id}
                            comment={reply}
                            onReply={onReply}
                            isSubmitting={isSubmitting}
                            maxDepth={maxDepth}
                            currentUserId={currentUserId}
                            onLikeComment={onLikeComment}
                            onDeleteComment={onDeleteComment}
                            isLikingCommentId={isLikingCommentId}
                            isDeletingCommentId={isDeletingCommentId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
