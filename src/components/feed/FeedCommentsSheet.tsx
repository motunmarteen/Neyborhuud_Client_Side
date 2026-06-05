'use client';

import { useEffect, useMemo } from 'react';
import { BottomSheetDragHandle } from '@/components/ui/BottomSheetDragHandle';
import { useBottomSheetDrag } from '@/hooks/useBottomSheetDrag';
import { useBottomSheetMount } from '@/hooks/useBottomSheetMount';
import { usePost } from '@/hooks/usePosts';
import { useCommentMutations } from '@/hooks/useComments';
import { CommentForm } from '@/components/feed/CommentForm';
import { CommentItem } from '@/components/feed/CommentItem';

type CommentTarget = { kind: 'post'; id: string };

interface FeedCommentsSheetProps {
    isOpen: boolean;
    target: CommentTarget | null;
    onClose: () => void;
    desktopAnchor?: { left: number; width: number } | null;
}

export function FeedCommentsSheet({ isOpen, target, onClose, desktopAnchor = null }: FeedCommentsSheetProps) {
    const { mounted: isMounted, visible: isVisible } = useBottomSheetMount({ open: isOpen, onClose });
    const { handleProps, getPanelStyle, reset } = useBottomSheetDrag({ onDismiss: onClose });

    const activeTarget = isOpen ? target : null;
    const activePostId = activeTarget?.id ?? null;

    const { data: postDetails, isLoading: isPostLoading, isError: isPostError } = usePost(activePostId);
    const { isCreating: isPostingComment } = useCommentMutations(activePostId || '');

    const commentsCount = useMemo(() => {
        if (!activeTarget) return 0;
        return postDetails?.content?.comments || postDetails?.comments?.length || 0;
    }, [activeTarget, postDetails]);

    useEffect(() => {
        if (isOpen) reset();
    }, [isOpen, reset]);

    if (!isMounted || !activeTarget) return null;
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

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
                    ...getPanelStyle(isVisible, 520),
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
                <BottomSheetDragHandle handleProps={handleProps} className="pt-2.5 pb-1" />

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
                    {isPostLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
                        </div>
                    ) : isPostError ? (
                        <div className="rounded-2xl border border-status-danger/25 bg-status-danger/8 px-4 py-8 text-center text-sm text-status-danger">
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
                    )}
                </div>

                <div
                    className="relative z-[1] border-t border-[var(--neu-shadow-dark)] bg-[var(--neu-bg)]/88 px-4 py-3 backdrop-blur-xl"
                    style={{ boxShadow: '0 -1px 0 var(--neu-shadow-light)' }}
                >
                    <CommentForm
                        postId={activeTarget.id}
                        placeholder={isPostingComment ? 'Posting...' : 'Add a comment...'}
                    />
                </div>
                </div>
            </section>
        </div>
    );
}
