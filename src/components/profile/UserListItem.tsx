/**
 * UserListItem Component
 * Displays a user in followers/following lists with follow/unfollow functionality
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useFollow } from '@/hooks/useFollow';
import type { FollowerUser } from '@/types/follow';

interface UserListItemProps {
  user: FollowerUser;
}

export function UserListItem({ user }: UserListItemProps) {
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === user._id;

  // Get follow status and actions
  const {
    isFollowing,
    toggleFollow,
    isPending,
    isLoadingStatus,
  } = useFollow(user._id, { enabled: !isOwnProfile && !!currentUser });

  // Get display name
  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.username;

  const userInitial = displayName[0]?.toUpperCase() || 'U';

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
      {/* User Info */}
      <Link
        href={`/profile/${user.username}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {/* Profile Picture */}
        <div className="w-12 h-12 rounded-full bg-linear-to-br from-neon-green to-brand-blue flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
          {user.profilePicture || user.avatarUrl ? (
            <img
              src={user.profilePicture || user.avatarUrl || ''}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            userInitial
          )}
        </div>

        {/* Name and Username */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-gray-900 dark:text-white truncate">
              {displayName}
            </p>
            {user.isVerified && (
              <i className="bi bi-patch-check-fill text-blue-500 text-sm shrink-0" />
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm truncate">
            @{user.username}
          </p>
          {user.bio && (
            <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-1 mt-0.5">
              {user.bio}
            </p>
          )}
        </div>
      </Link>

      {/* Follow Button */}
      {!isOwnProfile && currentUser && (
        <div className="ml-3 shrink-0">
          {isLoadingStatus ? (
            <div className="px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 animate-pulse">
              <div className="w-16 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleFollow();
              }}
              disabled={isPending}
              className={`px-4 py-1.5 rounded-full font-semibold text-sm transition-all ${
                isFollowing
                  ? 'border border-gray-300 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-500 group'
                  : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              type="button"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-1.5">
                  <i className="bi bi-hourglass-split animate-spin text-xs" />
                  <span className="hidden sm:inline">
                    {isFollowing ? 'Unfollowing...' : 'Following...'}
                  </span>
                </span>
              ) : (
                <>
                  <span className="hidden group-hover:inline">
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </span>
                  <span className="group-hover:hidden">
                    {isFollowing ? 'Following' : 'Follow'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
