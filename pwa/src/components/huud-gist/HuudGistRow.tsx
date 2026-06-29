'use client';

import Link from 'next/link';
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
    ? 'Anonymous NeyburH'
    : post.author?.name || post.author?.username || 'Neighbour';
  const timeLabel = post.createdAt ? formatTimeAgo(post.createdAt) : '';

  return (
    <Link
      href={`/gist/${id}`}
      className="flex items-start gap-4 px-6 py-4.5 transition-colors hover:bg-slate-50 border-b border-gray-100 last:border-b-0 no-underline bg-white"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
        <span className="material-symbols-outlined text-[20px]">forum</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {sectionLabel}
          </span>
          {timeLabel ? (
            <span className="text-[11px] text-slate-400 font-medium">{timeLabel}</span>
          ) : null}
        </div>
        <p className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-slate-800">
          {post.title || post.body}
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-slate-400 font-medium">
          {authorName}
          {post.commentCount ? ` · ${post.commentCount} replies` : ''}
          {post.likeCount ? ` · ${post.likeCount} likes` : ''}
        </p>
      </div>

      <span className="material-symbols-outlined mt-2.5 shrink-0 text-[18px] text-slate-350" aria-hidden>
        chevron_right
      </span>
    </Link>
  );
}
