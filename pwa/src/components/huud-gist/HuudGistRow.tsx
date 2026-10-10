'use client';

import Link from 'next/link';
import { MessageSquare, ChevronRight, Heart, MessageCircle } from 'lucide-react';
import {
  gistPostId,
  gistSectionLabel,
  type HuudGistPost,
} from '@/types/huudGist';
import { formatTimeAgo } from '@/utils/timeAgo';

type HuudGistRowProps = {
  post: HuudGistPost;
};

export function HuudGistRow({ post }: HuudGistRowProps) {
  const id = gistPostId(post);
  const sectionLabel = gistSectionLabel(post.discussionType);
  const authorName = post.anonymous
    ? 'Anonymous Resident'
    : post.author?.name || post.author?.username || 'Neighbour';
  const timeLabel = post.createdAt ? formatTimeAgo(post.createdAt) : '';

  return (
    <Link
      href={`/gist/${id}`}
      className="group flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#12161A] border border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12] shadow-sm hover:shadow transition-all active:scale-[0.99] no-underline"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-200/70 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
        <MessageSquare size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="shrink-0 rounded-full bg-slate-100 dark:bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {sectionLabel}
          </span>
          {timeLabel ? (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {timeLabel}
            </span>
          ) : null}
        </div>

        <p className="line-clamp-2 text-sm sm:text-[15px] font-extrabold leading-snug text-slate-900 dark:text-white group-hover:text-[#00B82E] transition-colors">
          {post.title || post.body}
        </p>

        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="truncate">{authorName}</span>
          {post.commentCount ? (
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={12} className="text-slate-400" />
              <span>{post.commentCount}</span>
            </span>
          ) : null}
          {post.likeCount ? (
            <span className="inline-flex items-center gap-1">
              <Heart size={12} className="text-rose-500" />
              <span>{post.likeCount}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-2 shrink-0 text-slate-400 group-hover:text-[#00B82E] group-hover:translate-x-0.5 transition-all">
        <ChevronRight size={18} />
      </div>
    </Link>
  );
}
