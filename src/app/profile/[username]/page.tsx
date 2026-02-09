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
      console.log('🆔 Profile _id:', (profile as unknown as Record<string, unknown>)._id);
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
      <div className="min-h-screen neu-base">
        {/* Header Skeleton */}
        <div className="neu-base sticky top-0 z-10" style={{ boxShadow: '0 2px 8px var(--neu-shadow-dark)' }}>
          <div className="flex items-center gap-8 px-4 h-14">
            <div className="w-8 h-8 rounded-full neu-socket animate-pulse" />
            <div className="w-32 h-6 neu-socket rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Profile Skeleton */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-32 h-32 rounded-full neu-socket animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-3 pt-4">
              <div className="w-48 h-8 neu-socket rounded-xl animate-pulse" />
              <div className="w-32 h-5 neu-socket rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-4 neu-socket rounded-xl animate-pulse" />
            <div className="w-3/4 h-4 neu-socket rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen neu-base flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-24 h-24 rounded-full neu-socket flex items-center justify-center mx-auto mb-6">
            <i className="bi bi-person-x text-5xl" style={{ color: 'var(--neu-text-muted)' }} />
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--neu-text)' }}>
            User Not Found
          </h1>
          <p className="mb-6 max-w-md" style={{ color: 'var(--neu-text-muted)' }}>
            The user @{username} doesn't exist or their profile is unavailable.
          </p>
          <button
            onClick={() => router.back()}
            className="neu-btn rounded-2xl px-6 py-2.5 font-semibold text-primary transition-colors"
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
    <div className="min-h-screen neu-base">
      {/* Header */}
      <div className="neu-base sticky top-0 z-10" style={{ boxShadow: '0 2px 8px var(--neu-shadow-dark)' }}>
        <div className="flex items-center gap-4 px-4 h-14">
          <button
            onClick={() => router.back()}
            className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            aria-label="Go back"
            type="button"
          >
            <i className="bi bi-arrow-left text-xl" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-xl truncate" style={{ color: 'var(--neu-text)' }}>
              {displayName}
            </h1>
            {profile.location?.lga && (
              <p className="text-xs truncate" style={{ color: 'var(--neu-text-muted)' }}>
                {profile.location.lga}, {profile.location.state}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-5xl mx-auto">
        {/* Cover Photo Area (placeholder for future) */}
        <div className="h-48 bg-gradient-to-br from-primary/20 to-brand-blue/20 dark:from-primary/10 dark:to-brand-blue/10" />

        {/* Profile Info Section */}
        <div className="px-4 -mt-16 pb-4">
          <div className="flex items-start justify-between mb-4">
            {/* Profile Picture */}
            <div className="w-32 h-32 rounded-full neu-avatar border-4 bg-gradient-to-br from-primary to-brand-blue flex items-center justify-center text-white font-bold text-4xl overflow-hidden" style={{ borderColor: 'var(--neu-bg)' }}>
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
                  className="neu-btn inline-flex items-center gap-2 px-5 py-2 rounded-2xl font-semibold text-sm transition-colors"
                >
                  <i className="bi bi-pencil text-sm" />
                  Edit Profile
                </Link>
              ) : isLoadingStatus ? (
                <div className="neu-btn px-5 py-2 rounded-2xl font-semibold text-sm inline-flex items-center gap-2 animate-pulse">
                  <div className="w-16 h-4 neu-socket rounded-xl" />
                </div>
              ) : (
                <button
                  onClick={toggleFollow}
                  disabled={isFollowPending}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-2xl font-semibold text-sm transition-all ${
                    isFollowing
                      ? 'neu-btn hover:text-red-500 group'
                      : 'neu-btn-active text-primary'
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
              <h2 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>
                {displayName}
              </h2>
              <p style={{ color: 'var(--neu-text-muted)' }}>
                @{profile.username}
              </p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="whitespace-pre-wrap" style={{ color: 'var(--neu-text)' }}>
                {profile.bio}
              </p>
            )}

            {/* Additional Info */}
            <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--neu-text-muted)' }}>
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
                <div className="flex items-center gap-1.5 text-primary">
                  <i className="bi bi-patch-check-fill" />
                  <span>Verified</span>
                </div>
              )}
            </div>

            {/* Follow Status Badges */}
            {!isOwnProfile && (followsYou || isMutual) && (
              <div className="flex flex-wrap gap-2">
                {isMutual ? (
                  <span className="neu-chip inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full" style={{ color: 'var(--neu-text-secondary)' }}>
                    <i className="bi bi-arrow-left-right" />
                    You follow each other
                  </span>
                ) : followsYou ? (
                  <span className="neu-chip inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full" style={{ color: 'var(--neu-text-secondary)' }}>
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
                <span className="font-bold" style={{ color: 'var(--neu-text)' }}>
                  {followingCount.toLocaleString()}
                </span>{' '}
                <span style={{ color: 'var(--neu-text-muted)' }}>Following</span>
              </button>
              <button
                className="hover:underline"
                onClick={() => router.push(`/profile/${username}/followers`)}
                type="button"
              >
                <span className="font-bold" style={{ color: 'var(--neu-text)' }}>
                  {followerCount.toLocaleString()}
                </span>{' '}
                <span style={{ color: 'var(--neu-text-muted)' }}>Followers</span>
              </button>
            </div>
          </div>
        </div>
        <div className="neu-divider" />

        {/* ══════ Two-Column Layout ══════ */}
        <div className="flex flex-col lg:flex-row gap-6 px-4 py-6">

          {/* ── Left Sidebar ── */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6">

            {/* Neybor Score */}
            <div className="neu-card-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--neu-text-muted)' }}>
                  Neybor Score
                </p>
                <i className="bi bi-info-circle text-primary text-sm" />
              </div>

              <div className="flex justify-center mb-4">
                <div className="score-ring" style={{ '--score-pct': 74 } as React.CSSProperties}>
                  <svg viewBox="0 0 140 140" width="160" height="160">
                    <circle className="ring-bg" cx="70" cy="70" r="65" />
                    <circle className="ring-fg" cx="70" cy="70" r="65" />
                  </svg>
                  <div className="ring-label">
                    <span className="text-4xl font-bold" style={{ color: 'var(--neu-text)' }}>742</span>
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary">Trusted</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="font-bold text-sm" style={{ color: 'var(--neu-text)' }}>Top 5% Neighbor</p>
                <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>Consistency Score: 98%</p>
              </div>
            </div>

            {/* Reputation Stats */}
            <div className="neu-card-sm rounded-2xl p-6">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--neu-text-muted)' }}>
                Reputation Stats
              </p>

              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Level 24</span>
                <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>14.2k XP</span>
              </div>

              <div className="xp-bar mb-6">
                <div className="xp-bar-fill" style={{ width: '68%' }} />
              </div>

              <div className="neu-socket rounded-2xl p-4 flex">
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--neu-text-muted)' }}>Total Points</p>
                  <p className="text-xl font-bold text-primary">84.9k</p>
                </div>
                <div className="w-px" style={{ background: 'var(--neu-shadow-dark)' }} />
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--neu-text-muted)' }}>Helpful Acts</p>
                  <p className="text-xl font-bold text-primary">142</p>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="neu-card-sm rounded-2xl p-6">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-5" style={{ color: 'var(--neu-text-muted)' }}>
                Verification Status
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Home Address', icon: 'bi-house-door' },
                  { label: 'Identity Document', icon: 'bi-person-badge' },
                  { label: 'Neighborhood Vouch', icon: 'bi-people' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                      <i className="bi bi-check-circle-fill text-primary text-sm" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Content Area ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Achievements */}
            <div className="neu-card-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--neu-text)' }}>
                  <span>🏆</span> Achievements
                </h3>
                <button className="text-xs font-bold text-primary uppercase tracking-wider" type="button">View All</button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: 'Good Samaritan', tier: 'Gold', icon: 'bi-heart-pulse-fill', color: '#22c55e' },
                  { name: 'Watch Leader', tier: 'Diamond', icon: 'bi-star-fill', color: '#f59e0b' },
                  { name: 'Top Seller', tier: 'Silver', icon: 'bi-shop', color: '#3b82f6' },
                  { name: 'First Responder', tier: 'Verified', icon: 'bi-asterisk', color: '#ec4899' },
                ].map((badge) => (
                  <div key={badge.name} className="text-center">
                    <div className="neu-socket w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-2">
                      <i className={`bi ${badge.icon} text-xl`} style={{ color: badge.color }} />
                    </div>
                    <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--neu-text)' }}>{badge.name}</p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>{badge.tier}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--neu-text)' }}>
                  <i className="bi bi-clock-history" /> Recent Activity
                </h3>
              </div>

              {/* Activity Tabs */}
              <div className="neu-socket rounded-2xl p-1 flex mb-6">
                <button className="neu-card-sm flex-1 py-2 rounded-xl text-sm font-semibold text-primary" type="button">All</button>
                <button className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ color: 'var(--neu-text-muted)' }} type="button">Alerts</button>
                <button className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ color: 'var(--neu-text-muted)' }} type="button">Market</button>
              </div>

              {/* Activity Feed (Posts) */}
              <div className="space-y-4">
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
              <div className="w-16 h-16 rounded-full neu-socket flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-exclamation-triangle text-3xl text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--neu-text)' }}>
                Failed to load posts
              </h2>
              <p className="mb-4" style={{ color: 'var(--neu-text-muted)' }}>
                {postsError?.message || 'Something went wrong. Please try again.'}
              </p>
              <details className="text-left max-w-md mx-auto mb-4">
                <summary className="text-sm cursor-pointer" style={{ color: 'var(--neu-text-muted)' }}>
                  Debug Info
                </summary>
                <pre className="text-xs mt-2 p-2 neu-socket rounded-xl overflow-auto">
                  {JSON.stringify({ userId, isErrorPosts, error: postsError }, null, 2)}
                </pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="neu-btn rounded-2xl px-6 py-2.5 font-semibold text-primary transition-colors"
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingPosts && !isErrorPosts && posts.length === 0 && (
            <div className="p-8 text-center py-16" style={{ color: 'var(--neu-text-muted)' }}>
              <div className="max-w-md mx-auto">
                <i className="bi bi-inbox text-6xl mb-4 block opacity-50" />
                <p className="text-xl font-semibold mb-2" style={{ color: 'var(--neu-text-secondary)' }}>
                  No posts yet
                </p>
                <p className="text-base">
                  When {isOwnProfile ? 'you post' : `@${profile.username} posts`}, they'll show up here.
                </p>
                {isOwnProfile && (
                  <Link
                    href="/feed"
                    className="neu-btn-active inline-block mt-6 px-6 py-2.5 text-primary font-semibold rounded-2xl transition-colors"
                  >
                    Create Your First Post
                  </Link>
                )}
                {/* Backend notification */}
                {typeof window !== 'undefined' && (
                  <details className="mt-6 text-left">
                    <summary className="text-sm cursor-pointer" style={{ color: 'var(--neu-text-muted)' }}>
                      Developer Info
                    </summary>
                    <div className="mt-2 p-3 neu-socket rounded-xl text-xs text-left">
                      <p className="font-semibold text-yellow-600 mb-1">
                        ⚠️ Backend Endpoint Missing
                      </p>
                      <p className="text-yellow-600 mb-2">
                        The backend endpoint for user posts is not implemented yet.
                      </p>
                      <code className="block neu-card-sm p-2 rounded-xl" style={{ color: 'var(--neu-text-secondary)' }}>
                        GET /api/v1/content/users/:userId/posts
                      </code>
                      <p className="mt-2 text-yellow-600">
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
                    <div className="flex items-center gap-2" style={{ color: 'var(--neu-text-muted)' }}>
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
        {/* end space-y-4 activity feed */}

            </div>
            {/* end Recent Activity */}

          </div>
          {/* end Right Content Area */}

        </div>
        {/* end Two-Column Layout */}

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
