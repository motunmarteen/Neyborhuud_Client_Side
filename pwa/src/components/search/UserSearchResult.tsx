'use client';
import { SearchUser } from '@/types/search';
import { useRouter } from 'next/navigation';
import MapPinAvatar from '@/components/ui/MapPinAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useFollow } from '@/hooks/useFollow';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

interface Props {
  user: SearchUser;
  onClose: () => void;
}

export const UserSearchResult = ({ user, onClose }: Props) => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const isOwnProfile = currentUser?.id === user._id || currentUser?.username === user.username;

  // Get follow status and actions
  const {
    isFollowing,
    toggleFollow,
    isPending,
    isLoadingStatus,
  } = useFollow(user._id, { enabled: !isOwnProfile && !!currentUser });

  // Seed the follow status cache with the backend-returned state
  useEffect(() => {
    if (user.isFollowing !== undefined && user._id) {
      queryClient.setQueryData(['follow-status', user._id], {
        success: true,
        message: 'Search follow status',
        data: {
          isFollowing: user.isFollowing,
          followsYou: false,
          isMutual: false,
        },
      });
    }
  }, [queryClient, user._id, user.isFollowing]);

  const handleClick = () => {
    router.push(`/profile/${user.username}`);
    onClose();
  };

  // Safety check
  if (!user || !user.username) {
    return null;
  }

  const displayName = user.name || (
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.username
  );

  return (
    <div className="w-full flex items-center justify-between p-3 hover:bg-brand-surface dark:hover:bg-surface-base-dark rounded-lg transition-colors text-left">
      {/* Clickable Info Area */}
      <div
        onClick={handleClick}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
      >
        {/* Avatar */}
        <MapPinAvatar
          src={user.avatarUrl}
          alt={displayName}
          fallbackInitial={displayName.charAt(0).toUpperCase()}
          size="md"
        />

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-[var(--neu-text-muted)] dark:text-white truncate">
              {displayName}
            </span>
            {user.isVerified && (
              <span className="material-symbols-outlined text-primary text-sm shrink-0" aria-hidden="true">
                verified
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--neu-text-muted)] dark:text-text-secondary-dark truncate">
            @{user.username}
          </p>
          {user.bio && (
            <p className="text-sm text-[var(--neu-text-secondary)] dark:text-text-secondary-dark/80 truncate mt-1">
              {user.bio}
            </p>
          )}
        </div>

        {/* Follower Count */}
        {typeof user?.followerCount === 'number' && (
          <div className="text-sm text-[var(--neu-text-muted)] dark:text-text-secondary-dark shrink-0 mr-2">
            {user.followerCount.toLocaleString()} follower{user.followerCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

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
                e.stopPropagation();
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
                  <span className="material-symbols-outlined animate-spin text-xs" aria-hidden="true">
                    hourglass_empty
                  </span>
                  <span className="hidden sm:inline">
                    {isFollowing ? 'Unfollowing…' : 'Following…'}
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
};

