'use client';

import Link from 'next/link';
import type { Post } from '@/types/api';
import { formatTimeAgo } from '@/utils/timeAgo';
import { getPostId } from '@/components/feed/TrendingPostRow';

const CONTENT_LABELS: Record<string, string> = {
  post: 'Post',
  fyi: 'FYI',
  help_request: 'Help',
  job: 'Job',
  emergency: 'Safety Alert',
  event: 'Event',
  marketplace: 'Market',
};

function postPreview(post: Post) {
  const text = (post.content ?? post.body ?? '').trim();
  if (text) return text;
  if (post.media?.length) return 'Photo or video post';
  return 'Saved post';
}

function authorName(post: Post) {
  const a = post.author;
  if (!a) return 'Neighbour';
  if ('name' in a && a.name) return a.name;
  const first = 'firstName' in a ? a.firstName : '';
  const last = 'lastName' in a ? a.lastName : '';
  const full = [first, last].filter(Boolean).join(' ');
  return full || a.username || 'Neighbour';
}

function authorAvatar(post: Post) {
  const a = post.author;
  if (!a) return null;
  return ('avatarUrl' in a && a.avatarUrl) || ('profilePicture' in a && a.profilePicture) || null;
}

type SavedPostRowProps = {
  post: Post;
  onUnsave: (postId: string) => void;
  isRemoving?: boolean;
};

export function SavedPostRow({ post, onUnsave, isRemoving }: SavedPostRowProps) {
  const id = getPostId(post);
  const username = post.author?.username ?? '';
  const typeKey = post.contentType ?? 'post';
  const typeLabel = CONTENT_LABELS[typeKey] ?? 'Post';
  const createdAt = (post as { createdAt?: string }).createdAt;
  const timeLabel = createdAt ? formatTimeAgo(createdAt) : '';
  const avatar = authorAvatar(post);
  const initial = authorName(post).charAt(0).toUpperCase();

  return (
    <div className="flex items-start gap-2 px-3 py-3 transition-colors hover:bg-black/[0.02]">
      <Link href="/feed" className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex w-8 shrink-0 justify-center pt-0.5">
          <span
            className="material-symbols-outlined text-[22px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden
          >
            bookmark
          </span>
        </div>

        <div className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-[var(--neu-text)]">
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
              {authorName(post)}
            </span>
            <span className="mod-chip shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-[var(--neu-text-muted)]">
              {typeLabel}
            </span>
            {timeLabel ? (
              <span className="text-[10px] text-[var(--neu-text-muted)]">{timeLabel}</span>
            ) : null}
          </div>
          {username ? (
            <p className="truncate text-[11px] text-[var(--neu-text-muted)]">@{username}</p>
          ) : null}
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-[var(--neu-text-muted)]">
            {postPreview(post)}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => onUnsave(id)}
        disabled={!id || isRemoving}
        className="mod-chip mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-red transition-opacity disabled:opacity-40"
        aria-label="Remove bookmark"
      >
        <span
          className={`material-symbols-outlined text-[20px] ${isRemoving ? 'animate-pulse' : ''}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          bookmark_remove
        </span>
      </button>
    </div>
  );
}
