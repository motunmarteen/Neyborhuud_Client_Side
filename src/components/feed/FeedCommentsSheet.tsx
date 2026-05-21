'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePost } from '@/hooks/usePosts';
import { useCommentMutations } from '@/hooks/useComments';
import { CommentForm } from '@/components/feed/CommentForm';
import { CommentItem } from '@/components/feed/CommentItem';
import {
    useCommentMutations as useGossipCommentMutations,
    useGossipDetail,
    useGossipMutations,
} from '@/hooks/useGossip';
import { GossipCommentInput } from '@/components/gossip/GossipCommentInput';
import { CommentThread } from '@/components/gossip/CommentThread';

type CommentTarget =
    | { kind: 'post'; id: string }
    | { kind: 'gossip'; id: string };

interface FeedCommentsSheetProps {
    isOpen: boolean;
    target: CommentTarget | null;
    onClose: () => void;
    desktopAnchor?: { left: number; width: number } | null;
}

export function FeedCommentsSheet({ isOpen, target, onClose, desktopAnchor = null }: FeedCommentsSheetProps) {
    const [isMounted, setIsMounted] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState<number | null>(null);
    const [dragStartTs, setDragStartTs] = useState<number | null>(null);

    const activeTarget = isOpen ? target : null;
    const activePostId = activeTarget?.kind === 'post' ? activeTarget.id : null;
    const activeGossipId = activeTarget?.kind === 'gossip' ? activeTarget.id : null;

    const { data: postDetails, isLoading: isPostLoading, isError: isPostError } = usePost(activePostId);
    const {
        data: gossipDetails,
        isLoading: isGossipLoading,
        isError: isGossipError,
    } = useGossipDetail(activeGossipId);

    const { isCreating: isPostingComment } = useCommentMutations(activePostId || '');
    const gossipMutations = useGossipMutations(activeGossipId || '');
    const gossipCommentMutations = useGossipCommentMutations(activeGossipId || '');

    const commentsCount = useMemo(() => {
        if (!activeTarget) return 0;
        if (activeTarget.kind === 'post') {
            return postDetails?.content?.comments || postDetails?.comments?.length || 0;
        }
        return gossipDetails?.gossip?.commentCount || gossipDetails?.comments?.length || 0;
    }, [activeTarget, postDetails, gossipDetails]);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            setDragY(0);
            setIsDragging(false);
            const raf = window.requestAnimationFrame(() => setIsVisible(true));
            return () => window.cancelAnimationFrame(raf);
        }

        setIsVisible(false);
        const timer = window.setTimeout(() => setIsMounted(false), 240);
        return () => window.clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleEsc);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    if (!isMounted || !activeTarget) return null;
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

    const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
        setIsDragging(true);
        setDragStartY(event.clientY);
        setDragStartTs(performance.now());
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
        if (!isDragging || dragStartY === null) return;
        const nextY = Math.max(0, event.clientY - dragStartY);
        setDragY(nextY);
    };

    const handlePointerEnd = () => {
        if (!isDragging) return;

        const elapsedMs = dragStartTs ? Math.max(1, performance.now() - dragStartTs) : 1;
        const velocity = dragY / elapsedMs; // px/ms
        const shouldDismiss = dragY > 120 || velocity > 1.1;

        setIsDragging(false);
        setDragStartY(null);
        setDragStartTs(null);

        if (shouldDismiss) {
            onClose();
            setDragY(0);
            return;
        }

        setDragY(0);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
            <button
                type="button"
                className={`feed-comments-backdrop absolute inset-0 transition-opacity duration-200 ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
                aria-label="Close comments"
            />

            <section
                className={`feed-comments-panel relative flex w-full max-h-[86vh] flex-col overflow-hidden rounded-t-[32px] border border-[var(--neu-shadow-dark)] shadow-[0_-12px_40px_var(--neu-shadow-dark)] md:max-w-[560px] md:shadow-[0_20px_50px_var(--neu-shadow-dark)]`}
                style={{
                    transform: `translate3d(0, ${(isVisible ? 0 : 520) + dragY}px, 0)`,
                    opacity: isVisible ? 1 : 0,
                    transitionProperty: isDragging ? 'none' : 'transform, opacity',
                    transitionDuration: isDragging ? '0ms' : '300ms',
                    transitionTimingFunction: isDragging ? 'linear' : 'cubic-bezier(0.22, 1, 0.36, 1)',
                    position: isDesktop && desktopAnchor ? 'fixed' : 'relative',
                    left: isDesktop && desktopAnchor ? `${desktopAnchor.left}px` : undefined,
                    bottom: isDesktop && desktopAnchor ? 0 : undefined,
                    width: isDesktop && desktopAnchor ? `${desktopAnchor.width}px` : undefined,
                    maxWidth: isDesktop && desktopAnchor ? `${desktopAnchor.width}px` : undefined,
                }}
                role="dialog"
                aria-modal="true"
                aria-label="Comments"
            >
                <div className="feed-comments-panel-wash z-0" aria-hidden />
                <div className="feed-comments-ambient z-0 motion-safe:animate-soft-float" aria-hidden>
                    <div className="feed-comments-ambient-float" />
                </div>

                <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
                <div
                    className="flex cursor-grab touch-none justify-center pt-2.5 pb-1 active:cursor-grabbing"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerCancel={handlePointerEnd}
                >
                    <div className="h-1 w-12 rounded-full bg-[var(--neu-text-muted)]/40" />
                </div>

                <div
                    className="flex items-center justify-between border-b border-[var(--neu-shadow-dark)] px-4 py-2.5"
                    style={{ boxShadow: '0 1px 0 var(--neu-shadow-light)' }}
                >
                    <h2 className="text-[15px] font-semibold tracking-tight text-[var(--neu-text)]">Comments</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-[var(--neu-text-secondary)]">{commentsCount}</span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-ghost grid h-8 w-8 place-items-center rounded-full transition-colors"
                            aria-label="Close comments"
                        >
                            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-text-secondary)' }}>
                                close
                            </span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3">
                    {activeTarget.kind === 'post' ? (
                        isPostLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
                            </div>
                        ) : isPostError ? (
                            <div className="rounded-2xl border border-brand-red/25 bg-brand-red/10 px-4 py-8 text-center text-sm text-red-700 dark:text-red-100">
                                Unable to load comments for this post.
                            </div>
                        ) : postDetails?.comments?.length ? (
                            <div className="space-y-0.5">
                                {postDetails.comments.map((comment) => (
                                    <CommentItem key={comment.id} comment={comment} postId={activeTarget.id} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-14 text-center text-[var(--neu-text-muted)]">
                                <span className="material-symbols-outlined text-3xl opacity-40">chat_bubble_outline</span>
                                <p className="mt-2 text-sm">Start the conversation.</p>
                            </div>
                        )
                    ) : isGossipLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
                        </div>
                    ) : isGossipError ? (
                        <div className="rounded-2xl border border-brand-red/25 bg-brand-red/10 px-4 py-8 text-center text-sm text-red-700 dark:text-red-100">
                            Unable to load comments for this discussion.
                        </div>
                    ) : gossipDetails?.comments?.length ? (
                        <div className="divide-y divide-[var(--neu-shadow-dark)]">
                            {gossipDetails.comments.map((comment) => (
                                <CommentThread
                                    key={comment.id || comment._id}
                                    comment={comment}
                                    replies={(comment as any).replies || []}
                                    onReply={async (body, anonymous, parentId) => {
                                        await gossipMutations.addComment({ body, anonymous, parentId });
                                    }}
                                    isSubmitting={gossipMutations.isCommenting}
                                    onLikeComment={gossipCommentMutations.likeComment}
                                    onDeleteComment={gossipCommentMutations.deleteComment}
                                    isLikingCommentId={gossipCommentMutations.likingCommentId}
                                    isDeletingCommentId={gossipCommentMutations.deletingCommentId}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-14 text-center text-[var(--neu-text-muted)]">
                            <span className="material-symbols-outlined text-3xl opacity-40">chat_bubble_outline</span>
                            <p className="mt-2 text-sm">No comments yet. Be the first.</p>
                        </div>
                    )}
                </div>

                <div
                    className="relative z-[1] border-t border-[var(--neu-shadow-dark)] bg-[var(--neu-bg)]/88 px-4 py-3 backdrop-blur-xl"
                    style={{ boxShadow: '0 -1px 0 var(--neu-shadow-light)' }}
                >
                    {activeTarget.kind === 'post' ? (
                        <CommentForm
                            postId={activeTarget.id}
                            placeholder={isPostingComment ? 'Posting...' : 'Add a comment...'}
                        />
                    ) : (
                        <GossipCommentInput
                            onSubmit={async (body, anonymous) => {
                                await gossipMutations.addComment({ body, anonymous });
                            }}
                            isSubmitting={gossipMutations.isCommenting}
                            placeholder="Add a comment..."
                        />
                    )}
                </div>
                </div>
            </section>
        </div>
    );
}
