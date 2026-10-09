'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, BookmarkX } from 'lucide-react';
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
    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-black/[0.08] shadow-xs mb-2.5 transition-all hover:border-black/[0.14] hover:shadow-sm">
      <Link href="/feed" className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex w-7 shrink-0 justify-center pt-0.5 text-[#008A20]">
          <Bookmark size={18} className="fill-[#008A20] text-[#008A20]" />
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-black text-[#008A20] bg-emerald-50 border border-emerald-300/60">
          {avatar ? (
            <Image src={avatar} alt="" width={36} height={36} className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-xs font-black text-[#111827]">
              {authorName(post)}
            </span>
            <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-[#008A20] border border-emerald-200/50">
              {typeLabel}
            </span>
            {timeLabel ? (
              <span className="text-[10px] font-medium text-[#9CA3AF]">{timeLabel}</span>
            ) : null}
          </div>
          {username ? (
            <p className="truncate text-[11px] font-semibold text-[#6B7280]">@{username}</p>
          ) : null}
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-[#1F2937]">
            {postPreview(post)}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => onUnsave(id)}
        disabled={!id || isRemoving}
        className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 border border-black/[0.06] transition-colors disabled:opacity-40 cursor-pointer"
        aria-label="Remove bookmark"
      >
        <BookmarkX size={16} className={isRemoving ? 'animate-pulse' : ''} />
      </button>
    </div>
  );
}
