'use client';

import Link from 'next/link';
import type { Post } from '@/types/api';
import { formatTimeAgo } from '@/utils/timeAgo';

const CONTENT_LABELS: Record<string, string> = {
  post: 'Post',
  fyi: 'FYI',
  help_request: 'Help',
  job: 'Job',
  emergency: 'SOS',
  event: 'Event',
  marketplace: 'Market',
};

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl leading-none">🥇</span>;
  if (rank === 2) return <span className="text-xl leading-none">🥈</span>;
  if (rank === 3) return <span className="text-xl leading-none">🥉</span>;
  return (
    <span className="w-7 text-center text-xs font-bold tabular-nums text-[var(--neu-text-muted)]">
      #{rank}
    </span>
  );
}

function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

function postPreview(post: Post) {
  const text = (post.content ?? post.body ?? '').trim();
  if (text) return text;
  if (post.media?.length) return 'Photo or video post';
  return 'Trending on Street Radar';
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

type TrendingPostRowProps = {
  post: Post;
  rank?: number;
  /** ranked = Street Radar with rank badges; local = Your Huud nearby posts */
  variant?: 'ranked' | 'local';
};

export function TrendingPostRow({ post, rank = 0, variant = 'ranked' }: TrendingPostRowProps) {
  const id = post.id ?? (post as { _id?: string })._id ?? '';
  const username = post.author?.username ?? '';
  const typeKey = post.contentType ?? 'post';
  const typeLabel = CONTENT_LABELS[typeKey] ?? 'Post';
  const createdAt = (post as { createdAt?: string }).createdAt;
  const timeLabel = createdAt ? formatTimeAgo(createdAt) : '';
  const avatar = authorAvatar(post);
  const initial = authorName(post).charAt(0).toUpperCase();
  const topThree = variant === 'ranked' && rank > 0 && rank <= 3;
  const showRank = variant === 'ranked' && rank > 0;

  return (
    <Link
      href="/feed"
      className={`flex items-start gap-3 px-3 py-3 transition-colors hover:bg-black/[0.02] ${
        topThree ? 'bg-primary/[0.03]' : ''
      }`}
    >
      <div className="flex w-8 shrink-0 justify-center pt-0.5">
        {showRank ? (
          <RankDisplay rank={rank} />
        ) : (
          <span
            className="material-symbols-outlined text-[22px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden
          >
            {variant === 'local' ? 'home_pin' : 'article'}
          </span>
        )}
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
        <div className="mt-1.5 flex items-center gap-3 text-[10px] font-semibold text-[var(--neu-text-muted)]">
          <span className={`inline-flex items-center gap-0.5 ${variant === 'ranked' ? 'text-brand-blue' : ''}`}>
            <span
              className="material-symbols-outlined text-[14px]"
              style={variant === 'ranked' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {variant === 'ranked' ? 'radar' : 'favorite'}
            </span>
            {formatCount(post.likes ?? 0)}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
            {formatCount(post.comments ?? 0)}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            {formatCount(post.views ?? 0)}
          </span>
        </div>
      </div>

      <span className="material-symbols-outlined mt-1 shrink-0 text-[20px] text-primary" aria-hidden>
        chevron_right
      </span>
    </Link>
  );
}

export function getPostId(post: Post & { _id?: string }) {
  return post.id ?? post._id ?? '';
}
