import Link from 'next/link';
import type { MouseEvent } from 'react';
import type { PostAuthor } from '@/types/api';
import { formatTimeAgo } from '@/utils/timeAgo';
import { PostCardVerificationBadge } from '@/components/feed/PostCardVerificationBadge';

type PostCardAuthorLinesProps = {
  authorName: string;
  authorUsername: string;
  author?: PostAuthor | null;
  isAnonymousAuthor: boolean;
  isVerified?: boolean;
  verificationBadge?: PostAuthor['verificationBadge'];
  createdAt: string;
  postLocation?: { lga?: string; state?: string } | null;
  authorLocation?: { lga?: string; state?: string } | null;
  onProfileClick?: (e: MouseEvent) => void;
};

function locationLabel(
  postLocation?: { lga?: string; state?: string } | null,
  authorLocation?: { lga?: string; state?: string } | null,
) {
  const loc = postLocation?.lga || postLocation?.state ? postLocation : authorLocation;
  if (!loc?.lga && !loc?.state) return null;
  return [loc.lga, loc.state].filter(Boolean).join(', ');
}

export function PostCardAuthorLines({
  authorName,
  authorUsername,
  author,
  isAnonymousAuthor,
  isVerified,
  verificationBadge,
  createdAt,
  postLocation,
  authorLocation,
  onProfileClick,
}: PostCardAuthorLinesProps) {
  const place = locationLabel(postLocation, authorLocation);
  const displayName = isAnonymousAuthor ? 'Anonymous Neyborh' : authorName;

  return (
    <div className="post-card-header__text min-w-0 flex-1">
      <div className="post-card-header__identity flex items-center gap-1 min-w-0">
        <Link
          href={`/profile/${authorUsername}`}
          onClick={onProfileClick}
          className="truncate min-w-0 max-w-[46%] text-xs font-black text-neu-text dark:text-white hover:underline leading-tight"
        >
          {displayName}
        </Link>
        <PostCardVerificationBadge
          author={author ?? { isVerified, verificationBadge }}
          hidden={isAnonymousAuthor}
        />
        <span className="truncate min-w-0 text-[11px] font-medium text-neu-text-secondary dark:text-white/50 leading-tight">
          @{authorUsername}
        </span>
      </div>
      <div className="post-card-header__meta flex items-center gap-1 mt-1 min-w-0 overflow-hidden text-[9px] font-bold text-neu-text-secondary dark:text-white/50 leading-tight">
        <span className="shrink-0">{formatTimeAgo(createdAt)}</span>
        {place ? (
          <>
            <span className="shrink-0">•</span>
            <span className="truncate">{place}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
