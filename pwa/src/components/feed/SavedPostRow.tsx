'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
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
  const { t } = useTranslation();
  const id = getPostId(post);
  const username = post.author?.username ?? '';
  const typeKey = post.contentType ?? 'post';
  const typeLabel = CONTENT_LABELS[typeKey] ?? 'Post';
  const createdAt = (post as { createdAt?: string }).createdAt;
  const timeLabel = createdAt ? formatTimeAgo(createdAt) : '';
  const avatar = authorAvatar(post);
  const initial = authorName(post).charAt(0).toUpperCase();

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
      <Link href={id ? `/feed?post=${encodeURIComponent(id)}` : '/feed'} className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex w-7 shrink-0 justify-center pt-0.5 text-[#0E8A3E]">
          <Bookmark size={18} className="fill-[#0E8A3E] text-[#0E8A3E]" />
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-black text-[#0E8A3E] bg-emerald-50 border border-emerald-300/60">
          {avatar ? (
            <Image src={avatar} alt="" width={36} height={36} className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-xs font-black text-[#1D2433]">
              {authorName(post)}
            </span>
            <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-[#0E8A3E] border border-emerald-200/50">
              {typeLabel}
            </span>
            {timeLabel ? (
              <span className="text-[10px] font-medium text-[#9AA3B1]">{timeLabel}</span>
            ) : null}
          </div>
          {username ? (
            <p className="truncate text-[11px] font-semibold text-[#5B6478]">@{username}</p>
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
        className="-mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-red transition-colors hover:bg-red-soft disabled:opacity-40"
        aria-label={t('saved.remove')}
      >
        <BookmarkX size={18} className={isRemoving ? 'animate-pulse motion-reduce:animate-none' : ''} aria-hidden />
      </button>
    </div>
  );
}
