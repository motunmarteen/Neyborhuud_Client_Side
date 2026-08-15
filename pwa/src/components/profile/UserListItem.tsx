/**
 * UserListItem Component
 * Displays a user in followers/following lists with follow/unfollow functionality
 */

'use client';

import Link from 'next/link';
import { useFollow } from '@/hooks/useFollow';
import type { FollowerUser } from '@/types/follow';
import MapPinAvatar from '@/components/ui/MapPinAvatar';

interface UserListItemProps {
  user: FollowerUser;
}

export function UserListItem({ user }: UserListItemProps) {
  // Get display name
  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.username;

  const userInitial = displayName[0]?.toUpperCase() || 'U';

  return (
    <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
      {/* User Info */}
      <Link
        href={`/profile/${user.username}`}
        className="flex items-center gap-3.5 flex-1 min-w-0"
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
            <p className="font-semibold text-slate-800 text-[15px] truncate">
              {displayName}
            </p>
            {user.isVerified && (
              <span className="material-symbols-outlined text-primary text-sm shrink-0" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">verified</span>
            )}
          </div>
          <p className="text-slate-500 text-[13px] truncate">
            @{user.username}
          </p>
          {user.bio && (
            <p className="text-slate-400 text-[12px] line-clamp-1 mt-0.5">
              {user.bio}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
