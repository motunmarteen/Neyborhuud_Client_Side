/**
 * Public User Profile Page
 * Route: /profile/:username
 * Shows user profile information including avatar, name, username, and bio
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import { useAuth } from '@/hooks/useAuth';
import { useFollow, useFollowers, useFollowing } from '@/hooks/useFollow';
import { useUserPosts, usePostMutations } from '@/hooks/usePosts';
import { XPostCard } from '@/components/feed/XPostCard';
import { PostSkeleton } from '@/components/feed/PostSkeleton';
import { PostDetailsModal } from '@/components/feed/PostDetailsModal';
import { Post } from '@/types/api';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isPostDetailsOpen, setIsPostDetailsOpen] = useState(false);

  // Fetch user profile by username
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: () => socialService.getUserByUsername(username),
    enabled: !!username,
  });

  const profile = profileData?.data;
  const isOwnProfile = currentUser?.username === username;

  // Follow functionality - only enable if not own profile and user is authenticated
  const shouldEnableFollow = !isOwnProfile && !!currentUser && !!profile?.id;
  const {
    isFollowing,
    followsYou,
    isMutual,
    toggleFollow,
    isPending: isFollowPending,
    isLoadingStatus,
    statusError,
    _rawData,
  } = useFollow(profile?.id, { enabled: shouldEnableFollow });

  // Get follower/following counts
  const { data: followersData } = useFollowers(profile?.id, 1, 1);
  const { data: followingData } = useFollowing(profile?.id, 1, 1);

  const followerCount = (followersData as any)?.data?.pagination?.total ?? 0;
  const followingCount = (followingData as any)?.data?.pagination?.total ?? 0;

  // Debug profile data
  useEffect(() => {
    if (profile) {
      console.log('👤 Profile Data:', profile);
      console.log('🆔 Profile ID:', profile.id);
      console.log('👤 Username:', profile.username);
    }
  }, [profile]);

  // Get the correct user ID - backend might use _id or id
  const userId = profile?.id || (profile as any)?._id || null;

  // Fetch user posts
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    isError: isErrorPosts,
    error: postsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserPosts(userId);

  // Debug posts data
  useEffect(() => {
    console.log('📝 Posts Query State:', {
      userId: userId,
      isLoading: isLoadingPosts,
      isError: isErrorPosts,
      error: postsError,
      postsData,
      hasData: !!postsData,
      pageCount: postsData?.pages?.length,
    });
    
    if (postsError) {
      console.error('❌ Posts Error Details:', postsError);
    }
  }, [postsData, isLoadingPosts, isErrorPosts, postsError, userId]);

  // Post mutations
  const { likePost, unlikePost, savePost, unsavePost } = usePostMutations();

  // Flatten posts from all pages
  const posts: Post[] =
    postsData?.pages.flatMap((page: any) => page.content ?? []) ?? [];

  // Infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '400px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle like/unlike
  const handleLike = async (post: Post) => {
    try {
      if (post.isLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  // Handle save/unsave
  const handleSave = async (post: Post) => {
    try {
      if (post.isSaved) {
        await unsavePost(post.id);
      } else {
        await savePost(post.id);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const openPostDetails = (postId: string) => {
    setSelectedPostId(postId);
    setIsPostDetailsOpen(true);
  };

  // Helper to format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  // Debug: Log follow status when it changes
  if (typeof window !== 'undefined' && profile?.id) {
    console.group('📊 Follow Status Debug');
    console.log('User ID:', profile.id);
    console.log('Username:', profile.username);
    console.log('Should Enable Follow:', shouldEnableFollow);
    console.log('Is Loading:', isLoadingStatus);
    console.log('Status Error:', statusError);
    console.log('Is Following:', isFollowing);
    console.log('Follows You:', followsYou);
    console.log('Is Mutual:', isMutual);
    console.log('Follower Count:', followerCount);
    console.log('Following Count:', followingCount);
    console.log('Raw Data:', _rawData);
    console.groupEnd();
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        {/* Header Skeleton */}
        <div className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-8 px-4 h-14">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="w-32 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>

        {/* Profile Skeleton */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-3 pt-4">
              <div className="w-48 h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="w-32 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-6">
            <i className="bi bi-person-x text-5xl text-gray-400 dark:text-gray-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            User Not Found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            The user @{username} doesn't exist or their profile is unavailable.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-neon-green hover:bg-neon-green/90 text-white font-semibold rounded-full transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Get display name
  const displayName =
    profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile.firstName || profile.username;

  const userInitial = displayName[0]?.toUpperCase() || 'U';

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
            {profile.location?.lga && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {profile.location.lga}, {profile.location.state}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto">
        {/* Cover Photo Area (placeholder for future) */}
        <div className="h-48 bg-gradient-to-br from-neon-green/20 to-brand-blue/20 dark:from-neon-green/10 dark:to-brand-blue/10" />

        {/* Profile Info Section */}
        <div className="px-4 -mt-16 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between mb-4">
            {/* Profile Picture */}
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-black bg-gradient-to-br from-neon-green to-brand-blue flex items-center justify-center text-white font-bold text-4xl overflow-hidden">
              {profile.profilePicture || profile.avatarUrl ? (
                <img
                  src={profile.profilePicture || profile.avatarUrl || ''}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitial
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3">
              {isOwnProfile ? (
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 px-5 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-full font-semibold text-sm transition-colors"
                >
                  <i className="bi bi-pencil text-sm" />
                  Edit Profile
                </Link>
              ) : isLoadingStatus ? (
                <div className="px-5 py-2 rounded-full border border-gray-300 dark:border-gray-700 font-semibold text-sm inline-flex items-center gap-2 animate-pulse">
                  <div className="w-16 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
                </div>
              ) : (
                <button
                  onClick={toggleFollow}
                  disabled={isFollowPending}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                    isFollowing
                      ? 'border border-gray-300 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-500 group'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  type="button"
                >
                  {isFollowPending ? (
                    <>
                      <i className="bi bi-hourglass-split animate-spin text-sm" />
                      <span className="hidden group-hover:inline">
                        {isFollowing ? 'Unfollowing...' : 'Following...'}
                      </span>
                      <span className="group-hover:hidden">
                        {isFollowing ? 'Following' : 'Follow'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="hidden group-hover:inline">
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </span>
                      <span className="group-hover:hidden">
                        {isFollowing ? 'Following' : 'Follow'}
                        {followsYou && !isFollowing && ' Back'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {displayName}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                @{profile.username}
              </p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}

            {/* Additional Info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              {/* Location */}
              {profile.location?.lga && (
                <div className="flex items-center gap-1.5">
                  <i className="bi bi-geo-alt" />
                  <span>{profile.location.lga}</span>
                  {profile.location.state && <span>, {profile.location.state}</span>}
                </div>
              )}

              {/* Joined Date */}
              {profile.createdAt && (
                <div className="flex items-center gap-1.5">
                  <i className="bi bi-calendar" />
                  <span>
                    Joined {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {/* Verification Badge */}
              {profile.identityVerified && (
                <div className="flex items-center gap-1.5 text-blue-500">
                  <i className="bi bi-patch-check-fill" />
                  <span>Verified</span>
                </div>
              )}
            </div>

            {/* Follow Status Badges */}
            {!isOwnProfile && (followsYou || isMutual) && (
              <div className="flex flex-wrap gap-2">
                {isMutual ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                    <i className="bi bi-arrow-left-right" />
                    You follow each other
                  </span>
                ) : followsYou ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                    <i className="bi bi-person-check" />
                    Follows you
                  </span>
                ) : null}
              </div>
            )}

            {/* Stats - Real follower/following counts */}
            <div className="flex gap-6 text-sm pt-2">
              <button
                className="hover:underline"
                onClick={() => router.push(`/profile/${username}/following`)}
                type="button"
              >
                <span className="font-bold text-gray-900 dark:text-white">
                  {followingCount.toLocaleString()}
                </span>{' '}
                <span className="text-gray-500 dark:text-gray-400">Following</span>
              </button>
              <button
                className="hover:underline"
                onClick={() => router.push(`/profile/${username}/followers`)}
                type="button"
              >
                <span className="font-bold text-gray-900 dark:text-white">
                  {followerCount.toLocaleString()}
                </span>{' '}
                <span className="text-gray-500 dark:text-gray-400">Followers</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section (placeholder for future: Posts, Replies, Media, Likes) */}
        <div className="border-b border-gray-200 dark:border-gray-800 sticky top-14 bg-white dark:bg-black z-10">
          <div className="flex">
            <button 
              className="flex-1 py-4 text-center font-semibold text-gray-900 dark:text-white border-b-4 border-neon-green hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors relative"
              aria-label="View posts"
              type="button"
            >
              Posts
            </button>
          </div>
        </div>

        {/* Posts Section */}
        <div>
          {/* Loading State */}
          {isLoadingPosts && (
            <div>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          )}

          {/* Error State */}
          {isErrorPosts && !isLoadingPosts && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-exclamation-triangle text-3xl text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Failed to load posts
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {postsError?.message || 'Something went wrong. Please try again.'}
              </p>
              <details className="text-left max-w-md mx-auto mb-4">
                <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  Debug Info
                </summary>
                <pre className="text-xs mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
                  {JSON.stringify({ userId, isErrorPosts, error: postsError }, null, 2)}
                </pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingPosts && !isErrorPosts && posts.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 py-16">
              <div className="max-w-md mx-auto">
                <i className="bi bi-inbox text-6xl mb-4 block opacity-50" />
                <p className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  No posts yet
                </p>
                <p className="text-base">
                  When {isOwnProfile ? 'you post' : `@${profile.username} posts`}, they'll show up here.
                </p>
                {isOwnProfile && (
                  <Link
                    href="/feed"
                    className="inline-block mt-6 px-6 py-2.5 bg-neon-green hover:bg-neon-green/90 text-white font-semibold rounded-full transition-colors"
                  >
                    Create Your First Post
                  </Link>
                )}
                {/* Backend notification */}
                {typeof window !== 'undefined' && (
                  <details className="mt-6 text-left">
                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                      Developer Info
                    </summary>
                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-left">
                      <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                        ⚠️ Backend Endpoint Missing
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300 mb-2">
                        The backend endpoint for user posts is not implemented yet.
                      </p>
                      <code className="block bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded text-yellow-900 dark:text-yellow-100">
                        GET /api/v1/content/users/:userId/posts
                      </code>
                      <p className="mt-2 text-yellow-700 dark:text-yellow-300">
                        Once this endpoint is implemented, user posts will appear here.
                      </p>
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Posts List */}
          {!isLoadingPosts && !isErrorPosts && posts.length > 0 && (
            <div>
              {posts.map((post) => (
                <XPostCard
                  key={post.id}
                  post={post}
                  onLike={() => handleLike(post)}
                  onComment={() => openPostDetails(post.id)}
                  onShare={() => {}}
                  onSave={() => handleSave(post)}
                  formatTimeAgo={formatTimeAgo}
                  onCardClick={() => openPostDetails(post.id)}
                />
              ))}

              {/* Load More Trigger */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="py-8 flex items-center justify-center">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <i className="bi bi-hourglass-split animate-spin" />
                      <span>Loading more posts...</span>
                    </div>
                  ) : (
                    <div className="h-8" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Details Modal */}
      {selectedPostId && (
        <PostDetailsModal
          postId={selectedPostId}
          isOpen={isPostDetailsOpen}
          onClose={() => {
            setIsPostDetailsOpen(false);
            setSelectedPostId(null);
          }}
        />
      )}
    </div>
  );
}
