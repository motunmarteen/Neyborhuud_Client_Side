/**
 * User Search Result Component
 * Displays a user result in the search dropdown
 */

'use client';
import { SearchUser } from '@/types/search';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Props {
  user: SearchUser;
  onClose: () => void;
}

export const UserSearchResult = ({ user, onClose }: Props) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/profile/${user.username}`);
    onClose();
  };

  // Safety check
  if (!user || !user.username) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-surface-base-dark rounded-lg transition-colors text-left"
    >
      {/* Avatar */}
      <div className="relative h-12 w-12 shrink-0">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-gray-900 dark:text-white truncate">
            {user.name}
          </span>
          {user.isVerified && (
            <i className="bi bi-patch-check-fill text-primary text-sm shrink-0" />
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-text-secondary-dark truncate">@{user.username}</p>
        {user.bio && (
          <p className="text-sm text-gray-600 dark:text-text-secondary-dark/80 truncate mt-1">{user.bio}</p>
        )}
      </div>

      {/* Follower Count */}
      {typeof user?.followerCount === 'number' && (
        <div className="text-sm text-gray-500 dark:text-text-secondary-dark shrink-0">
          {user.followerCount.toLocaleString()} follower{user.followerCount !== 1 ? 's' : ''}
        </div>
      )}
    </button>
  );
};
