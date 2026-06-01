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
      href={`/local-news/gist/${id}`}
      className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-black/[0.02]"
    >
      <div className="mod-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary">
        <span className="material-symbols-outlined text-[22px]">forum</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="mod-chip shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-[var(--neu-text-muted)]">
            {sectionLabel}
          </span>
          {timeLabel ? (
            <span className="text-[10px] text-[var(--neu-text-muted)]">{timeLabel}</span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug" style={{ color: 'var(--neu-text)' }}>
          {post.title || post.body}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-[var(--neu-text-muted)]">
          {authorName}
          {post.commentCount ? ` · ${post.commentCount} replies` : ''}
          {post.likeCount ? ` · ${post.likeCount} likes` : ''}
        </p>
      </div>

      <span className="material-symbols-outlined mt-1 shrink-0 text-[20px] text-primary" aria-hidden>
        chevron_right
      </span>
    </Link>
  );
}
