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
    <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] border-t-8 border-gray-50/80 py-5">
      <div className="px-3">
        <div className="mb-4 flex items-center justify-between gap-2">
          <ProfileBrowseEyebrow>Followers</ProfileBrowseEyebrow>
          <Link href={`/profile/${username}/followers`} className="text-xs font-bold text-blue-600 no-underline hover:underline">
            See all {followerCount > 0 ? `(${followerCount})` : ''}
          </Link>
        </div>

        {isOwnProfile ? (
          <Link
            href="/explore"
            className="flex items-center gap-3.5 border border-dashed border-gray-200 rounded-2xl px-4 py-3.5 mb-4 no-underline bg-gray-50/30 hover:bg-gray-50 transition-all"
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm">
              <span className="material-symbols-outlined text-[19px]">person_add</span>
              {pendingFollowRequests > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {pendingFollowRequests}
                </span>
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-gray-800">
                Find neighbours to follow
              </p>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">Discover active locals around you</p>
            </div>
          </Link>
        ) : null}

        {followers.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {followers.slice(0, 12).map((user) => {
              const avatar = resolveUserAvatarUrl(user);
              const initial =
                user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?';
              return (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-sm font-bold bg-gray-100 hover:bg-gray-200 border border-white hover:border-gray-200/50 shadow-sm transition-all duration-200"
                  title={`@${user.username}`}
                >
                  {avatar ? (
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-gray-600">{initial}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-400 mt-2">
            {isOwnProfile
              ? 'Follow neighbours to see them here.'
              : `@${username} has no followers yet.`}
          </p>
        )}
      </div>
    </div>
  );
}
