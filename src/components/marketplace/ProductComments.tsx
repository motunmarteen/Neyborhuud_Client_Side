/**
 * ProductComments Component
 * Displays and manages comments for marketplace products
 */

import { useProductComments, useProductCommentMutations } from "@/hooks/useMarketplace";
import { useState, useRef, useEffect } from "react";
import { formatTimeAgo } from "@/utils/timeAgo";
import { Comment } from "@/types/api";
import { glassField } from "@/lib/glass-form-styles";

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

      {/* Comment Form */}
      {currentUserId ? (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          {replyingTo && (
            <div
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                embedded
                  ? "border border-[var(--border-light)] bg-[var(--surface-light)]/80 dark:border-white/12 dark:bg-white/[0.06]"
                  : "bg-brand-black/50"
              }`}
            >
              <span className={embedded ? "text-[var(--neu-text-muted)]" : "text-[var(--neu-text-muted)]"}>Replying to comment</span>
              <button
                type="button"
                onClick={handleCancelReply}
                className="text-brand-red hover:text-brand-red dark:text-brand-red dark:hover:text-brand-red"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Add a comment..."
              className={
                embedded
                  ? `${glassField} min-h-[64px] resize-none`
                  : `min-h-[80px] w-full resize-none rounded-lg border border-black/[0.08] bg-brand-black px-4 py-3 text-white outline-none placeholder:text-[var(--neu-text-muted)] focus:border-brand-blue focus:ring-1 focus:ring-brand-blue`
              }
              maxLength={1000}
            />
            <div
              className={`absolute bottom-3 right-3 text-xs ${
                embedded ? "text-[var(--neu-text-muted)]" : "text-[var(--neu-text-muted)]"
              }`}
            >
              {commentBody.length}/1000
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${embedded ? "text-[var(--neu-text-muted)]" : "text-[var(--neu-text-muted)]"}`}>
              Maximum 3 comments per minute
            </span>
            <button
              type="submit"
              disabled={!commentBody.trim() || addComment.isPending}
              className={
                embedded
                  ? "rounded-full bg-gradient-to-r from-primary to-[#006F35] px-6 py-2 text-sm font-bold text-white shadow-md transition-opacity disabled:cursor-not-allowed disabled:opacity-45 dark:from-emerald-500 dark:to-teal-600"
                  : "rounded-lg bg-brand-blue px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-brand-black disabled:text-[var(--neu-text-muted)]"
              }
            >
              {addComment.isPending ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div
          className={`rounded-lg p-4 text-center ${
            embedded
              ? "border border-[var(--border-light)] bg-[var(--surface-light)]/70 text-[var(--neu-text-muted)] dark:border-white/12 dark:bg-white/[0.05]"
              : "bg-brand-black/50 text-[var(--neu-text-muted)]"
          }`}
        >
          Please log in to comment
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
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
        <div className={`py-8 text-center ${embedded ? "text-[var(--neu-text-muted)]" : "text-[var(--neu-text-muted)]"}`}>
          No comments yet. Be the first to comment!
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
  const avatar = user?.avatar || user?.avatarUrl;
  const commentId = comment.id || comment._id || "";
  const likesCount = comment.likesCount || comment.likes || 0;

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
            {username[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div className="min-w-0 flex-1">
        <div
          className={
            embedded
              ? "rounded-xl border border-[var(--border-light)] bg-[var(--surface-light)]/75 px-4 py-3 dark:border-white/12 dark:bg-white/[0.06]"
              : "rounded-lg bg-brand-black px-4 py-3"
          }
        >
          {/* Username and time */}
          <div className="mb-2 flex items-center gap-2">
            <span className={`font-semibold ${embedded ? "text-[var(--neu-text)]" : "text-white"}`}>{username}</span>
            <span className={`text-xs ${embedded ? "text-[var(--neu-text-muted)]" : "text-[var(--neu-text-muted)]"}`}>
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Body */}
          <p
            className={`whitespace-pre-wrap break-words ${embedded ? "text-[var(--neu-text-secondary)]" : "text-[var(--neu-text-muted)]"}`}
          >
            {comment.body}
          </p>

          {/* Media */}
          {comment.mediaUrls && comment.mediaUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {comment.mediaUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Attachment ${idx + 1}`}
                  className="rounded-lg w-full h-32 object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-4 px-4">
          {likesCount > 0 && (
            <span className={`text-xs ${embedded ? "text-[var(--neu-text-muted)]" : "text-[var(--neu-text-muted)]"}`}>
              {likesCount} {likesCount === 1 ? "like" : "likes"}
            </span>
          )}
          {currentUserId && (
            <button
              onClick={() => onReply(commentId, username)}
              className={`text-xs transition-colors ${
                embedded ? "text-[var(--neu-text-muted)] hover:text-primary" : "text-[var(--neu-text-muted)] hover:text-brand-blue"
              }`}
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
