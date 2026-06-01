'use client';

import Link from 'next/link';
import { ProfileBrowseEyebrow } from '@/components/profile/browse/ProfileBrowseSectionTitle';
import { resolveUserAvatarUrl } from '@/lib/userAvatar';

type FriendPreview = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  profilePicture?: string | null;
  firstName?: string;
  lastName?: string;
};

type ProfileSnapFriendsProps = {
  username: string;
  isOwnProfile: boolean;
  followers: FriendPreview[];
  followerCount: number;
  pendingFollowRequests?: number;
};

export function ProfileSnapFriends({
  username,
  isOwnProfile,
  followers,
  followerCount,
  pendingFollowRequests = 0,
}: ProfileSnapFriendsProps) {
  return (
    <div className="mod-card rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <ProfileBrowseEyebrow>Followers</ProfileBrowseEyebrow>
        <Link href={`/profile/${username}/followers`} className="text-xs font-bold text-primary no-underline">
          See all {followerCount > 0 ? `(${followerCount})` : ''}
        </Link>
      </div>

      {isOwnProfile ? (
        <Link
          href="/explore"
          className="mod-inset mb-3 flex items-center gap-3 rounded-xl px-3 py-2.5 no-underline"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            {pendingFollowRequests > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[9px] font-bold text-white">
                {pendingFollowRequests}
              </span>
            ) : null}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
              Find people to follow
            </p>
            <p className="text-xs text-[var(--neu-text-muted)]">Discover neighbours nearby</p>
          </div>
        </Link>
      ) : null}

      {followers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {followers.slice(0, 12).map((user) => {
            const avatar = resolveUserAvatarUrl(user);
            const initial =
              user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?';
            return (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="mod-inset flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-primary no-underline"
                title={`@${user.username}`}
              >
                {avatar ? (
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--neu-text-muted)]">
          {isOwnProfile
            ? 'Follow neighbours to see them here.'
            : `@${username} has no followers yet.`}
        </p>
      )}
    </div>
  );
}
