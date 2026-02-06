/**
 * Followers List Page
 * Route: /profile/:username/followers
 * Shows list of users who follow this profile
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import { useFollowers } from '@/hooks/useFollow';
import { UserListItem } from '@/components/profile/UserListItem';
import { useState } from 'react';

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch user profile by username to get user ID
  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: () => socialService.getUserByUsername(username),
    enabled: !!username,
  });

  const profile = profileData?.data;
  const userId = profile?.id;

  // Fetch followers list
  const {
    data: followersData,
    isLoading: isFollowersLoading,
    error: followersError,
  } = useFollowers(userId, page, limit);

  const followers = (followersData as any)?.data?.followers || [];
  const pagination = (followersData as any)?.data?.pagination;

  const isLoading = isProfileLoading || isFollowersLoading;
  const error = profileError || followersError;

  // Get display name
  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName || profile?.username || username;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4 px-4 h-14">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center justify-center transition-colors"
            aria-label="Go back"
            type="button"
          >
            <i className="bi bi-arrow-left text-xl" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-xl text-gray-900 dark:text-white truncate">
              {displayName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              @{username}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black sticky top-14 z-10">
        <div className="flex">
          <button
            className="flex-1 py-4 text-center font-semibold text-gray-900 dark:text-white border-b-4 border-neon-green"
            type="button"
          >
            Followers
          </button>
          <button
            onClick={() => router.push(`/profile/${username}/following`)}
            className="flex-1 py-4 text-center font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
            type="button"
          >
            Following
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="w-24 h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-exclamation-triangle text-3xl text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Failed to load followers
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              type="button"
            >
              Go Back
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && followers.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-people text-3xl text-gray-400 dark:text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No followers yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              When someone follows @{username}, they'll show up here.
            </p>
          </div>
        )}

        {/* Followers List */}
        {!isLoading && !error && followers.length > 0 && (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {followers.map((follower: any) => (
                <UserListItem key={follower._id} user={follower} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-6 px-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  type="button"
                >
                  <i className="bi bi-chevron-left" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  type="button"
                >
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            )}

            {/* Total Count */}
            {pagination && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 pb-6">
                {pagination.total.toLocaleString()} {pagination.total === 1 ? 'follower' : 'followers'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
