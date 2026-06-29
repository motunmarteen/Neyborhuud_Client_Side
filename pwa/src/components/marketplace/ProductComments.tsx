/**
 * ProductComments Component
 * Displays and manages comments for marketplace products
 */

import { useProductComments, useProductCommentMutations } from "@/hooks/useMarketplace";
import { useState, useRef, useEffect } from "react";
import { formatTimeAgo } from "@/utils/timeAgo";
import { Comment } from "@/types/api";

interface ProductCommentsProps {
  productId: string;
  currentUserId?: string;
  /** Tighter layout for bottom sheets */
  embedded?: boolean;
}

export function ProductComments({ productId, currentUserId, embedded }: ProductCommentsProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useProductComments(productId);
  const { addComment } = useProductCommentMutations(productId);

  const [commentBody, setCommentBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const comments = data?.pages.flatMap((page) => ((page as any).data?.comments || (page as any).comments) || []) ?? [];
  const totalComments = ((data?.pages[0] as any)?.data?.pagination?.total || (data?.pages[0] as any)?.pagination?.total) ?? 0;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || !currentUserId) return;

    await addComment.mutateAsync({
      body: commentBody.trim(),
      parentId: replyingTo ?? undefined,
    });

    setCommentBody("");
    setReplyingTo(null);
  };

  const handleReplyClick = (commentId: string, username: string) => {
    setReplyingTo(commentId);
    setCommentBody(`@${username} `);
    textareaRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setCommentBody("");
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [commentBody]);

  if (isLoading) {
    const skelBg = embedded ? "bg-[var(--surface-light)] dark:bg-white/10" : "bg-brand-black";
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-3">
              <div className={`h-10 w-10 rounded-full ${skelBg}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-4 w-24 rounded ${skelBg}`} />
                <div className={`h-16 rounded ${skelBg}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Comments {totalComments > 0 && `(${totalComments})`}
          </h3>
        </div>
      )}

      {/* Comment Form — unified pill design (marketplace framing) */}
      {currentUserId ? (
        <form onSubmit={handleSubmitComment} className="space-y-2">
          {replyingTo && (
            <div className="flex items-center justify-between rounded-xl border border-black/5 bg-black/[0.03] px-3 py-2 text-[12px] dark:border-white/10 dark:bg-white/[0.04]">
              <span className="font-semibold text-[#65676B] dark:text-[#B0B3B8]">Replying to comment</span>
              <button
                type="button"
                onClick={handleCancelReply}
                className="font-bold text-brand-red transition-colors hover:opacity-80"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-[24px] border border-black/[0.06] bg-black/[0.03] px-2 py-1 transition-all focus-within:border-black/10 dark:border-white/[0.06] dark:bg-white/[0.04] dark:focus-within:border-white/15">
            <textarea
              ref={textareaRef}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Ask about this item…"
              aria-label="Ask about this item"
              className="max-h-[120px] min-h-[36px] flex-1 resize-none border-none bg-transparent py-2 pl-2 text-[15px] text-[var(--neu-text)] placeholder:text-[var(--neu-text-muted)] focus:outline-none focus:ring-0"
              rows={1}
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!commentBody.trim() || addComment.isPending}
              className="mb-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-primary transition-all hover:bg-primary/10 active:scale-90 disabled:opacity-45"
              aria-label={replyingTo ? "Send reply" : "Post comment"}
            >
              {addComment.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <span className="material-symbols-outlined text-[20px] fill-1">send</span>
              )}
            </button>
          </div>
          <div className="flex items-center justify-between px-1 text-[11px] text-[var(--neu-text-muted)]">
            <span>Be respectful — sellers and neighbors are reading.</span>
            <span className="tabular-nums">{commentBody.length}/1000</span>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-black/5 bg-black/[0.03] p-4 text-center text-[13px] text-[var(--neu-text-muted)] dark:border-white/10 dark:bg-white/[0.04]">
          Please log in to ask about this item.
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id || comment._id}
              comment={comment}
              onReply={handleReplyClick}
              currentUserId={currentUserId}
              embedded={!!embedded}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-[var(--neu-text-muted)]">
          <span className="material-symbols-outlined text-3xl opacity-40">sell</span>
          <p className="mt-2 text-sm">No questions yet — be the first to ask about this item.</p>
        </div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className={
            embedded
              ? "mod-chip w-full rounded-xl py-3 text-sm font-bold transition-colors disabled:opacity-50"
              : "w-full rounded-lg bg-brand-black py-3 text-white transition-colors hover:bg-brand-black disabled:opacity-50"
          }
          style={embedded ? { color: "var(--neu-text)" } : undefined}
        >
          {isFetchingNextPage ? "Loading..." : "Load More Comments"}
        </button>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string, username: string) => void;
  currentUserId?: string;
  embedded?: boolean;
}

function CommentItem({ comment, onReply, currentUserId, embedded }: CommentItemProps) {
  const user = comment.user || (comment as any).author || (typeof comment.userId === 'object' ? comment.userId : null);
  const username = user?.username || "Anonymous";
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || username;
  const avatar = user?.avatar || user?.avatarUrl;
  const commentId = comment.id || comment._id || "";
  const likesCount = comment.likesCount || comment.likes || 0;
  const isSeller = (comment as any).isSeller || (user as any)?.isSeller;

  return (
    <div className="flex gap-2.5 py-2">
      {/* Avatar — feed-aligned */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-white/60 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#1A221C] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        {avatar ? (
          <img src={avatar} alt={username} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[15px] font-bold text-[#65676B] dark:text-[#B0B3B8]">{username[0]?.toUpperCase()}</span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {/* Bubble (Facebook style) */}
            <div className="inline-block max-w-full rounded-[18px] bg-black/[0.045] px-3.5 py-2 dark:bg-white/[0.06]">
              <span className="mr-1.5 text-[14px] font-semibold leading-[1.45] text-[#050505] dark:text-[#E4E6EB]">
                {displayName}
              </span>
              {/* Seller badge — marketplace-specific context */}
              {isSeller && (
                <span className="mr-1.5 inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-px align-middle text-[10px] font-bold text-primary">
                  <span className="material-symbols-outlined text-[12px]">storefront</span>
                  Seller
                </span>
              )}
              <span className="text-[12px] font-normal text-[#65676B] dark:text-[#B0B3B8]">@{username}</span>
              <span className="ml-1.5 whitespace-pre-wrap break-words text-[14px] font-normal leading-[1.45] text-[#050505] dark:text-[#E4E6EB]">
                {comment.body}
              </span>
            </div>

            {/* Media — fills the comment content width */}
            {comment.mediaUrls && comment.mediaUrls.length > 0 && (
              <div className="mt-2 grid w-full grid-cols-2 gap-0.5 overflow-hidden rounded-xl">
                {comment.mediaUrls.map((url, idx) => (
                  <div key={idx} className={`${comment.mediaUrls?.length === 1 ? "col-span-2" : ""} relative aspect-square`}>
                    <img
                      src={url}
                      alt={`Attachment ${idx + 1}`}
                      className="h-full w-full cursor-zoom-in object-cover transition-all hover:brightness-90"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Micro action row (Facebook: Like · Reply · time) */}
            <div className="mt-1 flex items-center gap-4 pl-1 text-[12px] font-bold text-[#65676B] dark:text-[#B0B3B8]">
              <button type="button" className="transition-colors hover:text-[#050505] dark:hover:text-[#E4E6EB]">
                Like
              </button>
              {currentUserId && (
                <button
                  type="button"
                  onClick={() => onReply(commentId, username)}
                  className="transition-colors hover:text-[#050505] dark:hover:text-[#E4E6EB]"
                >
                  Reply
                </button>
              )}
              <span className="font-normal">{formatTimeAgo(comment.createdAt)}</span>
            </div>
          </div>

          {/* Right-edge heart (Instagram style) */}
          <div className="mt-1 flex flex-shrink-0 flex-col items-center gap-0.5 pr-0.5 text-[#65676B] dark:text-[#B0B3B8]">
            <span className="material-symbols-outlined text-[17px]">favorite</span>
            {likesCount > 0 && (
              <span className="text-[11px] font-semibold leading-none tabular-nums">{likesCount}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
