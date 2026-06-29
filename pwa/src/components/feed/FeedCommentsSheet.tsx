'use client';

import { useEffect, useMemo, useState } from 'react';
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
    const [sortBy, setSortBy] = useState<'relevant' | 'newest'>('relevant');

    const activeTarget = isOpen ? target : null;
    const activePostId = activeTarget?.id ?? null;

    const { data: postDetails, isLoading: isPostLoading, isError: isPostError } = usePost(activePostId);
    const { isCreating: isPostingComment } = useCommentMutations(activePostId || '');

    const commentsCount = useMemo(() => {
        if (!activeTarget) return 0;
        return postDetails?.content?.comments || postDetails?.comments?.length || 0;
    }, [activeTarget, postDetails]);

    const sortedComments = useMemo(() => {
        const comments = postDetails?.comments;
        if (!comments?.length) return [];
        const copy = [...comments];
        if (sortBy === 'newest') {
            return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        // "Most relevant" — most-liked first, ties broken by recency
        return copy.sort((a, b) => {
            if ((b.likes || 0) !== (a.likes || 0)) return (b.likes || 0) - (a.likes || 0);
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [postDetails?.comments, sortBy]);

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

                <div className="flex items-center justify-between border-b border-black/5 px-3 py-2.5 dark:border-white/5">
                    <h2 className="text-[15px] font-semibold tracking-tight text-[#050505] dark:text-[#E4E6EB]">Comments</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-[12px] font-bold tabular-nums text-[#65676B] dark:text-[#B0B3B8]">{commentsCount}</span>
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

                <div className="flex-1 overflow-y-auto px-3 py-2">
                    {/* Sort header (Facebook style) */}
                    {!isPostLoading && !isPostError && !!postDetails?.comments?.length && (
                        <div className="mb-1 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setSortBy((prev) => (prev === 'relevant' ? 'newest' : 'relevant'))}
                                className="flex items-center gap-1 text-[13px] font-bold text-[#050505] transition-colors hover:text-brand-blue dark:text-[#E4E6EB]"
                            >
                                {sortBy === 'relevant' ? 'Most relevant' : 'Newest'}
                                <span className="material-symbols-outlined text-[18px]">expand_more</span>
                            </button>
                        </div>
                    )}
                    {isPostLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
                        </div>
                    ) : isPostError ? (
                        <div className="rounded-2xl border border-status-danger/25 bg-status-danger/8 px-4 py-8 text-center text-sm text-status-danger">
                            Unable to load comments for this post.
                        </div>
                    ) : sortedComments.length ? (
                        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                            {sortedComments.map((comment) => (
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

                <div className="relative z-[1] border-t border-black/5 bg-[var(--neu-bg)]/88 px-3 py-2.5 backdrop-blur-xl dark:border-white/5">
                    <CommentForm
                        postId={activeTarget.id}
                        post={postDetails?.content}
                        placeholder={isPostingComment ? 'Posting...' : 'Add a comment...'}
                    />
                </div>
                </div>
            </section>
        </div>
    );
}
