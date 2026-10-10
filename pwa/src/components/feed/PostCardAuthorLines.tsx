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
  const fullName = author ? [author.firstName, author.lastName].filter(Boolean).join(' ') : '';
  const displayName = isAnonymousAuthor
    ? 'Anonymous Neyborh'
    : fullName || authorName || author?.name || author?.username || 'Anonymous';

  return (
    <div className="post-card-header__text min-w-0 flex-1">
      <div className="post-card-header__identity flex items-center gap-1.5 min-w-0">
        <Link
          href={`/profile/${authorUsername}`}
          onClick={onProfileClick}
          className="truncate min-w-0 max-w-[60%] text-xs font-black text-[#1D2433] hover:text-[#0E8A3E] transition-colors leading-tight"
        >
          {displayName}
        </Link>
        <PostCardVerificationBadge
          author={author}
          hidden={isAnonymousAuthor}
          isVerified={isVerified}
          verificationBadge={verificationBadge}
        />
        <span className="truncate min-w-0 text-[11px] font-semibold text-[#5B6478] leading-tight">
          @{authorUsername}
        </span>
      </div>
      <div className="post-card-header__meta flex items-center gap-1.5 mt-0.5 min-w-0 overflow-hidden text-[11px] font-medium text-[#9AA3B1] leading-tight">
        <span className="shrink-0">{formatTimeAgo(createdAt)}</span>
        {place ? (
          <>
            <span className="shrink-0 text-[#D1D5DB]">•</span>
            <span className="truncate text-[#5B6478]">{place}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
