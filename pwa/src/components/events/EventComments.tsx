"use client";

/**
 * EventComments — unified comment design (Facebook bubble + Instagram heart),
 * adapted for community events. No safety-status pills, no anonymity:
 * events are public/social, so comments carry an optional "Organizer" badge instead.
 */

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatTimeAgo } from "@/utils/timeAgo";
import { useEventComments, useEventCommentMutations } from "@/hooks/useEvents";
import type { Comment } from "@/types/api";

interface EventCommentsProps {
  eventId: string;
  organizerId?: string;
  currentUserId?: string;
}

const QUICK_EMOJIS = ["🎉", "🙌", "🔥", "👏", "❤️", "😍", "📍", "🗓️"];

export function EventComments({ eventId, organizerId, currentUserId }: EventCommentsProps) {
  const { data, isLoading } = useEventComments(eventId);
  const { addComment, deleteComment } = useEventCommentMutations(eventId);

  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const comments: Comment[] = data?.comments ?? [];
  const total = data?.pagination?.total ?? comments.length;

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addComment.mutate(
      { body: body.trim() },
      { onSuccess: () => setBody("") },
    );
  };

  const insertEmoji = (emoji: string) => {
    setBody((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="mod-card rounded-2xl border border-white/10 p-5 backdrop-blur-xl">
      <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
        Discussion {total > 0 && <span className="tabular-nums opacity-60">({total})</span>}
      </h2>

      {/* Composer — unified pill */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mt-3">
          <div className="mb-2 flex items-center gap-1 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                disabled={addComment.isPending}
                className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[20px] leading-none transition-transform hover:bg-black/5 active:scale-90 disabled:opacity-50"
                aria-label={`Add ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2 rounded-[24px] border border-black/[0.06] bg-black/[0.03] px-2 py-1 transition-all focus-within:border-black/10 dark:border-white/[0.06] dark:bg-white/[0.04] dark:focus-within:border-white/15">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask a question or share excitement…"
              aria-label="Add a comment"
              rows={1}
              maxLength={2000}
              className="max-h-[120px] min-h-[36px] flex-1 resize-none border-none bg-transparent py-2 pl-2 text-[15px] text-[var(--neu-text)] placeholder:text-[var(--neu-text-muted)] focus:outline-none focus:ring-0"
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              }}
              disabled={addComment.isPending}
            />
            <button
              type="submit"
              disabled={!body.trim() || addComment.isPending}
              className="mb-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-primary transition-all hover:bg-primary/10 active:scale-90 disabled:opacity-45"
              aria-label="Post comment"
            >
              {addComment.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <span className="material-symbols-outlined text-[20px] fill-1">send</span>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3 rounded-xl border border-black/5 bg-black/[0.03] p-4 text-center text-[13px] text-[var(--neu-text-muted)] dark:border-white/10 dark:bg-white/[0.04]">
          Log in to join the discussion.
        </div>
      )}

      {/* List */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center text-[var(--neu-text-muted)]">
            <span className="material-symbols-outlined text-3xl opacity-40">celebration</span>
            <p className="mt-2 text-sm">No comments yet — start the conversation.</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {comments.map((comment) => (
              <EventCommentItem
                key={comment.id || comment._id}
                comment={comment}
                organizerId={organizerId}
                currentUserId={currentUserId}
                onDelete={(id) => deleteComment.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCommentItem({
  comment,
  organizerId,
  currentUserId,
  onDelete,
}: {
  comment: Comment;
  organizerId?: string;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  const author =
    (comment as any).author ||
    comment.user ||
    (typeof comment.userId === "object" ? comment.userId : null);
  const authorId = author?.id || author?._id || "";
  const username = author?.username || "user";
  const displayName = [author?.firstName, author?.lastName].filter(Boolean).join(" ") || username;
  const avatar = author?.avatarUrl || author?.avatar || null;
  const commentId = comment.id || comment._id || "";
  const likesCount = comment.likesCount || comment.likes || 0;

  const isOrganizer = !!organizerId && authorId === organizerId;
  const isOwner = !!currentUserId && authorId === currentUserId;

  return (
    <div className="flex gap-2.5 py-2">
      {/* Avatar — feed-aligned */}
      <Link href={`/profile/${username}`} className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-white/60 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#1A221C] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          {avatar ? (
            <Image src={avatar} alt={username} width={40} height={40} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[15px] font-bold text-[#65676B] dark:text-[#B0B3B8]">
              {username[0]?.toUpperCase()}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {/* Bubble (Facebook style) */}
            <div className="inline-block max-w-full rounded-[18px] bg-black/[0.045] px-3.5 py-2 dark:bg-white/[0.06]">
              <Link
                href={`/profile/${username}`}
                className="mr-1.5 text-[14px] font-semibold leading-[1.45] text-[#050505] hover:underline dark:text-[#E4E6EB]"
              >
                {displayName}
              </Link>
              {isOrganizer && (
                <span className="mr-1.5 inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-px align-middle text-[10px] font-bold text-primary">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Organizer
                </span>
              )}
              <span className="text-[12px] font-normal text-[#65676B] dark:text-[#B0B3B8]">@{username}</span>
              <span className="ml-1.5 whitespace-pre-wrap break-words text-[14px] font-normal leading-[1.45] text-[#050505] dark:text-[#E4E6EB]">
                {comment.body}
              </span>
            </div>

            {/* Media */}
            {comment.mediaUrls && comment.mediaUrls.length > 0 && (
              <div className="mt-2 grid w-full grid-cols-2 gap-0.5 overflow-hidden rounded-xl">
                {comment.mediaUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className={`${comment.mediaUrls?.length === 1 ? "col-span-2" : ""} relative aspect-square`}
                  >
                    <Image
                      src={url}
                      alt={`Attachment ${idx + 1}`}
                      fill
                      sizes="50vw"
                      className="cursor-zoom-in object-cover transition-all hover:brightness-90"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Micro action row */}
            <div className="mt-1 flex items-center gap-4 pl-1 text-[12px] font-bold text-[#65676B] dark:text-[#B0B3B8]">
              <button type="button" className="transition-colors hover:text-[#050505] dark:hover:text-[#E4E6EB]">
                Like
              </button>
              <span className="font-normal">{formatTimeAgo(comment.createdAt)}</span>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => onDelete(commentId)}
                  className="transition-colors hover:text-brand-red"
                >
                  Delete
                </button>
              )}
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
