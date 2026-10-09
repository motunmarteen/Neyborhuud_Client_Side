'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, FileText, Radio, Heart, MessageSquare, Eye, ChevronRight } from 'lucide-react';
import type { Post } from '@/types/api';
import { formatTimeAgo } from '@/utils/timeAgo';

const CONTENT_LABELS: Record<string, string> = {
  post: 'Post',
  fyi: 'FYI',
  help_request: 'Help',
  job: 'Job',
  emergency: 'Safety Alert',
  event: 'Event',
  marketplace: 'Market',
};

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl leading-none">🥇</span>;
  if (rank === 2) return <span className="text-xl leading-none">🥈</span>;
  if (rank === 3) return <span className="text-xl leading-none">🥉</span>;
  return (
    <span className="w-7 text-center text-xs font-bold tabular-nums text-charcoal/50 dark:text-white/50">
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
      className={`flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-black/[0.08] shadow-xs mb-2.5 transition-all hover:border-black/[0.14] hover:shadow-sm ${
        topThree ? 'ring-1 ring-emerald-500/20 bg-emerald-50/[0.15]' : ''
      }`}
    >
      <div className="flex w-7 shrink-0 justify-center pt-0.5">
        {showRank ? (
          <RankDisplay rank={rank} />
        ) : variant === 'local' ? (
          <MapPin size={18} className="text-[#008A20]" />
        ) : (
          <FileText size={18} className="text-[#008A20]" />
        )}
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
        <div className="mt-2 flex items-center gap-3 text-[10px] font-semibold text-[#6B7280]">
          <span className={`inline-flex items-center gap-1 ${variant === 'ranked' ? 'text-[#008A20] font-bold' : ''}`}>
            {variant === 'ranked' ? <Radio size={12} /> : <Heart size={12} />}
            {formatCount(post.likes ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare size={12} />
            {formatCount(post.comments ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={12} />
            {formatCount(post.views ?? 0)}
          </span>
        </div>
      </div>

      <ChevronRight size={16} className="mt-1 shrink-0 text-[#9CA3AF]" />
    </Link>
  );
}

export function getPostId(post: Post & { _id?: string }) {
  return post.id ?? post._id ?? '';
}
