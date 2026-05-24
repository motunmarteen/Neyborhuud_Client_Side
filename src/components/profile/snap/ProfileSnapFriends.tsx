'use client';

import Link from 'next/link';
import { ProfileAuthSectionTitle } from '@/components/profile/ProfileAuthShell';
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
    <section className="flex flex-col gap-3 border-t border-[rgba(26,26,26,0.06)] pt-4">
      <div className="flex items-center justify-between gap-2">
        <ProfileAuthSectionTitle>Linkers</ProfileAuthSectionTitle>
        <Link
          href={`/profile/${username}/followers`}
          className="text-xs font-bold text-[var(--landing-green-deep,#006f35)] no-underline"
        >
          See all {followerCount > 0 ? `(${followerCount})` : ''}
        </Link>
      </div>

      {isOwnProfile && (
        <Link href="/explore" className="auth-signup-location-peek no-underline">
          <span className="auth-signup-location-peek__icon relative" aria-hidden>
            <span className="material-symbols-outlined text-[1rem]">person_add</span>
            {pendingFollowRequests > 0 && (
              <span className="profile-auth-friends-badge">{pendingFollowRequests}</span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="auth-signup-location-peek__label">Find linkers</p>
            <p className="auth-signup-location-peek__name">HuudLink with neighbours nearby</p>
          </div>
          <span className="auth-signup-location-peek__chevron" aria-hidden>›</span>
        </Link>
      )}

      {followers.length > 0 ? (
        <div className="profile-auth-friends-strip">
          {followers.slice(0, 12).map((user) => {
            const avatar = resolveUserAvatarUrl(user);
            const initial =
              user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?';
            return (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="profile-auth-friends-avatar no-underline"
                title={`@${user.username}`}
              >
                {avatar ? (
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="auth-flow-hero-card__meta m-0">
          {isOwnProfile
            ? 'HuudLink with neighbours to see them here.'
            : `@${username} has no linkers yet.`}
        </p>
      )}
    </section>
  );
}
