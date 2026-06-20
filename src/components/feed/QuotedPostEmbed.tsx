'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Post, PostAuthor } from '@/types/api';
import { PostCardMediaSlider, type PostCardMediaItem } from '@/components/feed/PostCardMediaSlider';
import { PostCardVerificationBadge } from '@/components/feed/PostCardVerificationBadge';
import { formatTimeAgo } from '@/utils/timeAgo';

type QuotedPostEmbedProps = {
  post: Post;
  compact?: boolean;
  onClick?: () => void;
};

function toMediaItems(post: Post): PostCardMediaItem[] {
  const raw = post.media ?? (post as Post & { mediaUrls?: string[] }).mediaUrls ?? [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => (typeof m === 'string' ? { url: m } : { url: m.url, type: m.type, thumbnailUrl: m.thumbnailUrl }))
    .filter((m) => Boolean(m.url));
}

export function QuotedPostEmbed({ post, compact = true, onClick }: QuotedPostEmbedProps) {
  const author = post.author as PostAuthor;
  const fullName = author ? [author.firstName, author.lastName].filter(Boolean).join(' ') : '';
  const authorDisplayName = fullName || author?.name || author?.username || 'Anonymous';
  const authorUsername = author?.username || 'user';
  const authorAvatar = author?.avatarUrl || author?.profilePicture || null;
  const text = (post.content || post.body || '').trim();
  const mediaItems = toMediaItems(post);
  const postId = post.id ?? post._id ?? '';

  const inner = (
    <>
      <div className="quoted-post-embed__header">
        <div className="quoted-post-embed__avatar">
          {authorAvatar ? (
            <Image src={authorAvatar} alt={authorDisplayName} fill sizes="20px" className="object-cover" unoptimized />
          ) : (
            <span className="material-symbols-outlined text-[14px] text-neu-text-secondary">person</span>
          )}
        </div>
        <div className="quoted-post-embed__meta min-w-0">
          <span className="quoted-post-embed__name truncate">{authorDisplayName}</span>
          <PostCardVerificationBadge author={author} />
          <span className="quoted-post-embed__handle truncate">@{authorUsername}</span>
          {post.createdAt && (
            <>
              <span className="quoted-post-embed__dot" aria-hidden>·</span>
              <span className="quoted-post-embed__time shrink-0">{formatTimeAgo(post.createdAt)}</span>
            </>
          )}
        </div>
      </div>

      {text && (
        <p className="quoted-post-embed__text">{text}</p>
      )}

      {mediaItems.length > 0 && (
        <PostCardMediaSlider
          items={mediaItems}
          altPrefix={`Post by ${authorDisplayName}`}
          compact={compact}
          className="quoted-post-embed__media"
        />
      )}
    </>
  );

  const className = 'quoted-post-embed';

  if (onClick) {
    return (
      <button type="button" className={`${className} quoted-post-embed--interactive`} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        {inner}
      </button>
    );
  }

  if (postId) {
    return (
      <Link href={`/feed?post=${postId}`} className={`${className} quoted-post-embed--interactive`} onClick={(e) => e.stopPropagation()}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
