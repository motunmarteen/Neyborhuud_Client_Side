/**
 * UserListItem Component
 * Displays a user in followers/following lists with follow/unfollow functionality
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useFollow } from '@/hooks/useFollow';
import type { FollowerUser } from '@/types/follow';
import MapPinAvatar from '@/components/ui/MapPinAvatar';

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
    <div className="flex items-center justify-between px-4 py-3 hover:bg-brand-surface dark:hover:bg-brand-black/80/50 transition-colors">
      {/* User Info */}
      <Link
        href={`/profile/${user.username}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {/* Profile Picture */}
        <MapPinAvatar
          src={user.profilePicture || user.avatarUrl}
          alt={displayName}
          fallbackInitial={userInitial}
          size="md"
        />

        {/* Name and Username */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-[var(--neu-text-muted)] dark:text-white truncate">
              {displayName}
            </p>
            {user.isVerified && (
              <i className="bi bi-patch-check-fill text-primary text-sm shrink-0" />
            )}
          </div>
          <p className="text-[var(--neu-text-muted)] dark:text-[var(--neu-text-muted)] text-sm truncate">
            @{user.username}
          </p>
          {user.bio && (
            <p className="text-[var(--neu-text-muted)] dark:text-[var(--neu-text-muted)] text-sm line-clamp-1 mt-0.5">
              {user.bio}
            </p>
          )}
        </div>
      </Link>

      {/* Follow Button */}
      {!isOwnProfile && currentUser && (
        <div className="ml-3 shrink-0">
          {isLoadingStatus ? (
            <div className="px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-black/[0.08] animate-pulse">
              <div className="w-16 h-4 bg-brand-surface dark:bg-brand-black rounded" />
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
                  ? 'border border-black/[0.08] dark:border-black/[0.08] hover:border-brand-red dark:hover:border-brand-red hover:bg-brand-red/10 dark:hover:bg-brand-red/20 hover:text-brand-red dark:hover:text-brand-red group'
                  : 'bg-brand-black dark:bg-white text-white dark:text-black hover:bg-brand-black dark:hover:bg-brand-surface'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              type="button"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-1.5">
                  <i className="bi bi-hourglass-split animate-spin text-xs" />
                  <span className="hidden sm:inline">
                    {isFollowing ? 'Unlinking...' : 'Linking...'}
                  </span>
                </span>
              ) : (
                <>
                  <span className="hidden group-hover:inline">
                    {isFollowing ? 'Unlink' : 'HuudLink'}
                  </span>
                  <span className="group-hover:hidden">
                    {isFollowing ? 'HuudLinked' : 'HuudLink'}
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
