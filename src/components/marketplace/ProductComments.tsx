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
}

export function ProductComments({ productId, currentUserId }: ProductCommentsProps) {
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
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-800 rounded w-24" />
                <div className="h-16 bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Count */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Comments {totalComments > 0 && `(${totalComments})`}
        </h3>
      </div>

      {/* Comment Form */}
      {currentUserId ? (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          {replyingTo && (
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 rounded-lg text-sm">
              <span className="text-gray-400">Replying to comment</span>
              <button
                type="button"
                onClick={handleCancelReply}
                className="text-red-400 hover:text-red-300"
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
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none min-h-[80px]"
              maxLength={1000}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
              {commentBody.length}/1000
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Maximum 3 comments per minute
            </span>
            <button
              type="submit"
              disabled={!commentBody.trim() || addComment.isPending}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {addComment.isPending ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-gray-800/50 rounded-lg text-center text-gray-400">
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
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
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
}

function CommentItem({ comment, onReply, currentUserId }: CommentItemProps) {
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
      <div className="flex-1 min-w-0">
        <div className="bg-gray-800 rounded-lg px-4 py-3">
          {/* Username and time */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-white">{username}</span>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Body */}
          <p className="text-gray-300 whitespace-pre-wrap break-words">
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
        <div className="flex items-center gap-4 mt-2 px-4">
          {likesCount > 0 && (
            <span className="text-xs text-gray-500">
              {likesCount} {likesCount === 1 ? "like" : "likes"}
            </span>
          )}
          {currentUserId && (
            <button
              onClick={() => onReply(commentId, username)}
              className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
