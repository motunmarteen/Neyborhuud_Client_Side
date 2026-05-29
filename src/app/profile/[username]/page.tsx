/**
 * Public User Profile Page
 * Route: /profile/:username
 * Shows user profile information including avatar, name, username, and bio
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import { useAuth } from '@/hooks/useAuth';
import { useFollow, useFollowCounts, useFollowers, useMyMilestoneStatus, type MilestoneInfo } from '@/hooks/useFollow';
import type { MilestonePayload } from '@/hooks/useFollow';
import dynamic from 'next/dynamic';

const FollowerMilestoneCelebration = dynamic(
  () => import('@/components/follow/FollowerMilestoneCelebration'),
  { ssr: false },
);
import { useBlock } from '@/hooks/useBlock';
import { useUserPosts, usePostMutations } from '@/hooks/usePosts';
import { XPostCard } from '@/components/feed/XPostCard';
import { ReportModal } from '@/components/feed/ReportModal';
import { PostSkeleton } from '@/components/feed/PostSkeleton';
import { PostDetailsModal } from '@/components/feed/PostDetailsModal';
import { Post } from '@/types/api';
import { contentService } from '@/services/content.service';
import { chatService } from '@/services/chat.service';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTipUser } from '@/hooks/useGamification';
import { TipModal } from '@/components/gamification/TipModal';
import { useInView } from 'react-intersection-observer';
import apiClient from '@/lib/api-client';
import { normalizeAuthUser, resolveUserAvatarUrl } from '@/lib/userAvatar';
import { shareProfileUrl, resolveProfileDisplayName, resolveProfilePersonalName, resolveProfileMapCenter, PROFILE_MAP_DEFAULT, type ProfileNameSource } from '@/lib/profileSnapHelpers';
import { authService } from '@/services/auth.service';
import { ProfileSnapHero } from '@/components/profile/snap/ProfileSnapHero';
import { ProfileSnapStatsRow } from '@/components/profile/snap/ProfileSnapStatsRow';
import { ProfileSnapPlusCard } from '@/components/profile/snap/ProfileSnapPlusCard';
import { ProfileSnapHub } from '@/components/profile/snap/ProfileSnapHub';
import { ProfileSnapFriends } from '@/components/profile/snap/ProfileSnapFriends';
import { ProfileAuthShell, ProfileAuthSheet } from '@/components/profile/ProfileAuthShell';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { useMyBadges } from '@/hooks/useGamification';
import { useUserJobs } from '@/hooks/useJobs';
import { useUserEvents } from '@/hooks/useEvents';
import { useUserServices } from '@/hooks/useServices';
import { useVouchStatus, useVouchUser, useRevokeVouch, getTrustTier, useVouches, useUserTrustProfile, TRUST_EVENT_META } from '@/hooks/useTrust';
import { getNextTrustTier, normalizeTrustScore } from '@/lib/trust-economy';
import { getPrivilegesForTier } from '@/lib/trust-privileges';
import { formatTimeAgo } from '@/utils/timeAgo';
import { toast } from 'sonner';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user: currentUser, uploadProfilePicture } = useAuth();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isPostDetailsOpen, setIsPostDetailsOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isSavingDraggedLocation, setIsSavingDraggedLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleAvatarClick = () => {
    // Only allow upload on own profile
    if (currentUser?.username === username) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so selecting the same file again still triggers onChange
    e.target.value = '';

    // Basic client-side validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      await uploadProfilePicture({ file });
      queryClient.invalidateQueries({ queryKey: ['userProfile', username] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Profile photo updated');
    } catch {
      // useAuth mutation onError already surfaces API errors via handleApiError
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleMapLocationChange = async (loc: { lat: number; lng: number }) => {
    if (currentUser?.username !== username) return;
    try {
      setIsSavingDraggedLocation(true);
      await apiClient.put('/auth/location/update', {
        type: 'current',
        location: { latitude: loc.lat, longitude: loc.lng },
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile', username] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } catch (err) {
      console.error('Failed to update location:', err);
    } finally {
      setIsSavingDraggedLocation(false);
    }
  };

  const handleSetLocation = async () => {
    if (!navigator.geolocation) return;
    setIsSettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await apiClient.put('/auth/location/update', {
            type: 'current',
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
          queryClient.invalidateQueries({ queryKey: ['userProfile', username] });
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          toast.success('Location updated');
        } catch (err) {
          console.error('Failed to update location:', err);
        } finally {
          setIsSettingLocation(false);
        }
      },
      (err) => {
        console.error('GPS error:', err.message);
        setIsSettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Fetch user profile — own profile uses /profile/me so first/last name are included
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (apiClient.isAuthenticated()) {
        try {
          const res = await apiClient.get<{ user: import('@/types/api').User }>('/profile/me');
          if (
            res.success &&
            res.data?.user &&
            res.data.user.username?.toLowerCase() === username.toLowerCase()
          ) {
            return { ...res, data: normalizeAuthUser(res.data.user) };
          }
        } catch {
          /* fall through to public profile lookup */
        }
      }

      return socialService.getUserByUsername(username);
    },
    enabled: !!username,
  });

  const profile = profileData?.data;
  const cachedProfileUser = authService.getCachedUser();
  const isOwnProfile =
    currentUser?.username?.toLowerCase() === username.toLowerCase() ||
    cachedProfileUser?.username?.toLowerCase() === username.toLowerCase();

  // Follow functionality - only enable if not own profile and user is authenticated
  const shouldEnableFollow = !isOwnProfile && !!currentUser && !!profile?.id;
  const {
    isFollowing,
    followsYou,
    isMutual,
    toggleFollow,
    isPending: isFollowPending,
    isLoadingStatus,
    pendingMilestone,
    clearMilestone,
  } = useFollow(profile?.id, { enabled: shouldEnableFollow });

  // Profile owner: detect newly-rewarded milestones and trigger confetti
  const ownerMilestoneStatus = useMyMilestoneStatus(); // always called (hooks must not be conditional)
  const [ownerMilestone, setOwnerMilestone] = useState<MilestonePayload | null>(null);

  useEffect(() => {
    if (!isOwnProfile || !ownerMilestoneStatus.data?.milestones) return;
    const rewardedCounts: number[] = ownerMilestoneStatus.data.milestones
      .filter((m: MilestoneInfo) => m.rewarded)
      .map((m: MilestoneInfo) => m.count);
    if (rewardedCounts.length === 0) return;

    const storageKey = `nh_seen_milestones_${username}`;
    let stored: number[] = [];
    try { stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]'); } catch { /* ignore */ }

    const newOnes = rewardedCounts.filter((c) => !stored.includes(c));
    if (newOnes.length > 0) {
      const highest = newOnes.sort((a, b) => b - a)[0];
      const mInfo = ownerMilestoneStatus.data.milestones.find((m: MilestoneInfo) => m.count === highest);
      if (mInfo) {
        setOwnerMilestone({
          count: mInfo.count,
          label: mInfo.label,
          emoji: mInfo.emoji,
          hcAwarded: mInfo.hcReward,
          celebrationTier: mInfo.celebrationTier,
        });
      }
      localStorage.setItem(storageKey, JSON.stringify(rewardedCounts));
    }
  }, [isOwnProfile, ownerMilestoneStatus.data, username]);

  // Get follower/following counts (lightweight)
  const { data: countsData } = useFollowCounts(profile?.id);
  const followerCount = countsData?.data?.followerCount ?? 0;
  const followingCount = countsData?.data?.followingCount ?? 0;

  const { data: followersData } = useFollowers(profile?.id, 1, 12);
  const followerPreview =
    ((followersData as { data?: { followers?: Array<{
      _id: string;
      username: string;
      avatarUrl?: string;
      profilePicture?: string;
      firstName?: string;
      lastName?: string;
    }> } })?.data?.followers ?? []).map((user) => ({
      id: user._id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      profilePicture: user.profilePicture,
      firstName: user.firstName,
      lastName: user.lastName,
    })) ?? [];

  // Block functionality
  const {
    isBlocked,
    isBlockedByThem,
    toggleBlock,
    isPending: isBlockPending,
  } = useBlock(profile?.id, { enabled: shouldEnableFollow });

  // Vouching — use profile?.id directly (userId is declared later but same value)
  const profileId = (profile as any)?.id || (profile as any)?._id || null;
  const shouldEnableVouch = !isOwnProfile && !!currentUser && !!profileId && !isBlocked && !isBlockedByThem;
  const { data: vouchStatus } = useVouchStatus(profileId, { enabled: shouldEnableVouch });
  const vouchMutation = useVouchUser(profileId);
  const revokeMutation = useRevokeVouch(profileId);
  const isVouchPending = vouchMutation.isPending || revokeMutation.isPending;

  // Who has vouched for this user — shown in the TrustOS sidebar card
  const { data: voucherList = [] } = useVouches(profileId, { enabled: !!profileId });

  // Trust activity log for this user's profile (public view)
  const { data: trustProfileData } = useUserTrustProfile(profileId, { enabled: !!profileId });


  const [startingChat, setStartingChat] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const tipUser = useTipUser();

  const handleStartChat = async () => {
    if (!userId) return;
    setStartingChat(true);
    try {
      const res = await chatService.getOrCreateDirectConversation(userId);
      // Backend wraps in { conversation: { _id, ... } }
      const conv = (res.data as any)?.conversation ?? (res.data as any);
      const convId = conv?._id ?? conv?.conversationId ?? conv?.id;
      if (convId) router.push(`/messages/${convId}`);
    } catch {
      // fallback
    } finally {
      setStartingChat(false);
    }
  };

  // Get the correct user ID - backend might use _id or id
  const userId = profile?.id || (profile as any)?._id || null;

  // ── Phase 1–3 profile data ────────────────────────────────────────────────
  // Badges: only fetch for own profile (useMyBadges returns current user's badges)
  const { data: myBadgesRaw } = useMyBadges();
  const myBadges: any[] = (() => {
    const b = (myBadgesRaw as any)?.data ?? myBadgesRaw ?? [];
    return Array.isArray(b) ? b : [];
  })();

  // Jobs / Events / Services posted by this profile's user
  const { data: userJobsRaw } = useUserJobs(userId, 3);
  const userJobs: any[] = Array.isArray(userJobsRaw) ? userJobsRaw : [];

  const { data: userEventsRaw } = useUserEvents(userId, 3);
  const userEvents: any[] = Array.isArray(userEventsRaw) ? userEventsRaw : [];

  const { data: userServicesRaw } = useUserServices(userId, 3);
  const userServices: any[] = Array.isArray(userServicesRaw) ? userServicesRaw : [];

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

  // Loading state
  if (isLoading) {
    return (
      <div className="profile-auth-page-root relative flex h-screen w-full flex-col overflow-hidden neu-base">
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden lg:block">
            <LeftSidebar />
          </div>
          <div className="profile-auth-scroll flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-lg space-y-4 pt-8">
              <div className="h-48 animate-pulse rounded-2xl bg-[#E9F6E6]" />
              <div className="h-32 animate-pulse rounded-2xl bg-white" />
              <div className="h-24 animate-pulse rounded-2xl bg-white" />
            </div>
          </div>
          <div className="hidden lg:block">
            <RightSidebar />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="profile-auth-page-root relative flex h-screen w-full flex-col overflow-hidden neu-base">
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden lg:block">
            <LeftSidebar />
          </div>
          <div className="profile-auth-scroll flex flex-1 items-center justify-center overflow-y-auto px-4">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#E9F6E6]">
                <i className="bi bi-person-x text-5xl text-[var(--neu-text-muted)]" />
              </div>
              <h1 className="mb-3 text-3xl font-bold text-slate-900">User Not Found</h1>
              <p className="mx-auto mb-6 max-w-md text-[var(--neu-text-muted)]">
                The user @{username} doesn&apos;t exist or their profile is unavailable.
              </p>
            </div>
          </div>
          <div className="hidden lg:block">
            <RightSidebar />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Merge name fields — profile payload wins, then auth session/cache
  const profileNameSource: ProfileNameSource = {
    ...(cachedProfileUser as ProfileNameSource | null),
    ...(currentUser as ProfileNameSource | null),
    ...(profile as ProfileNameSource),
    username: profile?.username ?? currentUser?.username ?? cachedProfileUser?.username ?? username,
    firstName: profile?.firstName ?? currentUser?.firstName ?? cachedProfileUser?.firstName,
    lastName: profile?.lastName ?? currentUser?.lastName ?? cachedProfileUser?.lastName,
    middleName: profile?.middleName ?? currentUser?.middleName ?? cachedProfileUser?.middleName,
    name:
      (profile as ProfileNameSource)?.name ??
      (currentUser as ProfileNameSource | undefined)?.name ??
      (cachedProfileUser as ProfileNameSource | undefined)?.name,
    fullName:
      (profile as ProfileNameSource)?.fullName ??
      (currentUser as ProfileNameSource | undefined)?.fullName ??
      (cachedProfileUser as ProfileNameSource | undefined)?.fullName,
    full_name:
      (profile as ProfileNameSource)?.full_name ??
      (currentUser as ProfileNameSource | undefined)?.full_name ??
      (cachedProfileUser as ProfileNameSource | undefined)?.full_name,
    displayName:
      (profile as ProfileNameSource)?.displayName ??
      (currentUser as ProfileNameSource | undefined)?.displayName ??
      (cachedProfileUser as ProfileNameSource | undefined)?.displayName,
  };

  const personalName = resolveProfilePersonalName(profileNameSource, username);
  const displayName = resolveProfileDisplayName(profileNameSource, username);

  const profileAvatarSrc = resolveUserAvatarUrl({
    profilePicture: profile.profilePicture,
    avatarUrl: profile.avatarUrl,
  });
  const profileInitial = displayName[0]?.toUpperCase() || 'U';
  const anchoredMapCenter = resolveProfileMapCenter(profile);
  const hasMapLocation = anchoredMapCenter != null;
  const mapCenter = anchoredMapCenter ?? PROFILE_MAP_DEFAULT;

  const hist = profile as {
    usernameHistory?: Array<{
      previousUsername: string | null;
      newUsername?: string;
      changedAt: string | null;
    }>;
    usernameTimeline?: Array<{
      username: string;
      effectiveFrom: string;
      effectiveTo: string | null;
    }>;
  };
  const renameAudit = (hist.usernameHistory || []).filter((h) => h.previousUsername);
  const showHandleHistory =
    renameAudit.length > 0 ||
    (Array.isArray(hist.usernameTimeline) && hist.usernameTimeline.length > 1);

  const locationLabel = [profile.location?.lga, profile.location?.state].filter(Boolean).join(', ');
  const trustScoreRaw = profile.trustScore ?? profile.gamification?.trustScore ?? 0;
  const normalizedTrust = normalizeTrustScore(Number(trustScoreRaw));
  const trustScore = normalizedTrust.score1000;
  const profileTrustTier = getTrustTier(trustScore);
  const nextTrustTier = getNextTrustTier(trustScore);
  const profilePrivileges = getPrivilegesForTier(profileTrustTier.tier);
  const trustRecentEvents = trustProfileData?.recentEvents ?? [];
  const huudCoins =
    (profile as any).totalHuudCoins ??
    (profile as any).huudCoins ??
    profile.gamification?.points ??
    0;
  const level = profile.gamification?.level ?? 1;
  const profilePoints = profile.gamification?.points ?? huudCoins;
  const scorePercent = normalizedTrust.percent;
  const joinedLabel = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently';
  const profileFacts = [
    { label: 'Joined', value: joinedLabel, icon: 'calendar_month' },
    { label: 'Identity', value: profile.identityVerified ? 'Verified' : 'Pending', icon: profile.identityVerified ? 'verified' : 'shield' },
    { label: 'Role', value: profile.role?.replace('_', ' ') || 'user', icon: 'badge' },
  ];

  const handleShareProfile = async () => {
    const shared = await shareProfileUrl(profile.username, displayName);
    if (shared) {
      toast.success(
        typeof navigator !== 'undefined' && 'share' in navigator
          ? 'Profile shared'
          : 'Profile link copied',
      );
    }
  };

  const handleCreatePost = () => {
    if (isOwnProfile) {
      setIsCreatePostOpen(true);
      return;
    }
    router.push('/feed');
  };

  return (
    <div className="profile-auth-page-root relative flex h-screen w-full flex-col overflow-hidden neu-base">
      {(ownerMilestone ?? pendingMilestone) && (
        <FollowerMilestoneCelebration
          milestone={(ownerMilestone ?? pendingMilestone)!}
          onDismiss={ownerMilestone ? () => setOwnerMilestone(null) : clearMilestone}
        />
      )}
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>
        <div className="profile-auth-scroll flex-1 overflow-y-auto">
      <ProfileAuthShell>
        <ProfileSnapHero
          displayName={displayName}
          personalName={personalName}
          username={profile.username}
          profilePicture={profile.profilePicture}
          avatarUrl={profile.avatarUrl}
          isOwnProfile={isOwnProfile}
          uploading={isUploadingAvatar}
          hasMapLocation={hasMapLocation}
          mapCenter={mapCenter}
          locationLabel={locationLabel}
          onShare={handleShareProfile}
          onMessage={!isOwnProfile ? handleStartChat : undefined}
          messaging={startingChat}
          onChangePhoto={isOwnProfile ? handleAvatarClick : undefined}
          onSetLocation={isOwnProfile ? handleSetLocation : undefined}
          onMapLocationChange={isOwnProfile ? handleMapLocationChange : undefined}
          settingLocation={isSettingLocation}
          savingMapLocation={isSavingDraggedLocation}
          identityVerified={profile.identityVerified}
          vouchCount={vouchStatus?.vouchCount}
        />

        <ProfileAuthSheet>
        {!isOwnProfile && (
          <div className="auth-signup-actions auth-signup-actions--row">
            {isLoadingStatus ? (
              <div className="auth-btn auth-btn-secondary animate-pulse opacity-60">Loading…</div>
            ) : isBlocked ? (
              <button
                onClick={() => toggleBlock()}
                disabled={isBlockPending}
                className="auth-btn auth-btn-secondary !border-red-200 !text-red-600"
                type="button"
              >
                {isBlockPending ? 'Unblocking…' : 'Blocked'}
              </button>
            ) : isBlockedByThem ? (
              <div className="auth-btn auth-btn-secondary cursor-not-allowed opacity-60">Unavailable</div>
            ) : (
              <>
                <button
                  onClick={toggleFollow}
                  disabled={isFollowPending}
                  className={`auth-btn ${isFollowing ? 'auth-btn-secondary' : 'auth-btn-primary'} !min-h-[44px]`}
                  type="button"
                >
                  {isFollowPending
                    ? isFollowing
                      ? 'Unlinking…'
                      : 'Linking…'
                    : isFollowing
                      ? 'HuudLinked'
                      : `HuudLink${followsYou && !isFollowing ? ' Back' : ''}`}
                </button>
                <button
                  onClick={() => setShowTipModal(true)}
                  className="auth-btn auth-btn-secondary !min-h-[44px]"
                  type="button"
                >
                  🪙 Tip
                </button>
              </>
            )}
          </div>
        )}

        <ProfileSnapStatsRow
          username={profile.username}
          dateOfBirth={profile.dateOfBirth}
          huudCoins={huudCoins}
          followerCount={followerCount}
          followingCount={followingCount}
        />

        <ProfileSnapPlusCard
          isOwnProfile={isOwnProfile}
          trustScore={trustScore}
          trustLabel={profileTrustTier.label}
          level={level}
        />

        <ProfileSnapHub
          isOwnProfile={isOwnProfile}
          onCreatePost={handleCreatePost}
          onSetLocation={isOwnProfile ? handleSetLocation : undefined}
          showPinPrompt={!hasMapLocation}
        />

        {!isOwnProfile && !isBlocked && !isBlockedByThem && currentUser && (
          <div className="auth-flow-hero-card flex-col !items-stretch gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="auth-flow-hero-card__eyebrow mb-0">Community Trust</p>
                  {!vouchStatus?.hasVouched && (
                    vouchStatus?.locationRequired ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-[var(--surface-muted,#f4f4f5)] px-2 py-0.5 text-[10px] font-bold text-[var(--neu-text-muted)]">
                        <span className="material-symbols-outlined text-[12px]">location_off</span>
                        Location needed
                      </span>
                    ) : vouchStatus?.withinRange === true ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <span className="material-symbols-outlined text-[12px]">my_location</span>
                        {vouchStatus.distanceMeters}m away ✓
                      </span>
                    ) : vouchStatus?.withinRange === false ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        <span className="material-symbols-outlined text-[12px]">location_off</span>
                        {vouchStatus.distanceMeters != null ? `${vouchStatus.distanceMeters}m away` : 'Too far'} — 500m limit
                      </span>
                    ) : null
                  )}
                </div>
                <p className="auth-flow-hero-card__title !text-base">
                  {(vouchStatus?.vouchCount ?? 0) > 0
                    ? `${vouchStatus!.vouchCount} NeyborH${vouchStatus!.vouchCount === 1 ? '' : 's'} vouch for @${profile.username}`
                    : `@${profile.username} has no vouches yet`}
                </p>
                <p className="auth-flow-hero-card__meta">
                  {vouchStatus?.hasVouched
                    ? 'You have vouched for this NeyborH. Their actions reflect on your trust.'
                    : vouchStatus?.canVouch === false
                      ? 'Reach Tree 🌳 tier to unlock vouching.'
                      : vouchStatus?.locationRequired
                        ? 'Both you and this NeyborH need location enabled to vouch.'
                        : vouchStatus?.withinRange === false
                          ? 'You must be within 500m to vouch — NeyborHuud is hyperlocal.'
                          : 'Vouching puts your own NeyburH Score at stake.'}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                {vouchStatus?.hasVouched ? (
                  <button
                    onClick={() => revokeMutation.mutate()}
                    disabled={isVouchPending}
                    className="auth-btn auth-btn-secondary !min-h-[40px] !w-auto px-4"
                    type="button"
                  >
                    {isVouchPending ? '…' : '🤜 Vouched'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (vouchStatus?.canVouch === false) {
                        toast.error('You need Tree 🌳 tier (300+ NeyburH Score) to vouch for others', {
                          description: 'Keep contributing, completing jobs, and getting verified to level up.',
                        });
                        return;
                      }
                      if (vouchStatus?.locationRequired) {
                        toast.error('Location required to vouch', {
                          description: 'Both you and this NeyborH need location enabled. Enable it in your profile settings.',
                        });
                        return;
                      }
                      if (vouchStatus?.withinRange === false) {
                        toast.error(`You are ${vouchStatus.distanceMeters}m away — vouching requires you to be within 500m`, {
                          description: 'NeyborHuud is hyperlocal. You can only vouch for genuine neighbours nearby.',
                        });
                        return;
                      }
                      vouchMutation.mutate();
                    }}
                    disabled={isVouchPending}
                    className="auth-btn auth-btn-primary !min-h-[40px] !w-auto px-4"
                    type="button"
                  >
                    {isVouchPending ? '…' : '🤜 Vouch'}
                  </button>
                )}
                {!isBlockedByThem && (
                  <button
                    onClick={() => toggleBlock()}
                    disabled={isBlockPending}
                    className="auth-btn auth-btn-secondary !min-h-[36px] !w-auto px-3 text-xs"
                    type="button"
                  >
                    {isBlocked ? 'Unblock' : 'Block'}
                  </button>
                )}
              </div>
            </div>
            {(vouchStatus?.vouchesNeeded ?? 0) > 0 && !vouchStatus?.hasVouched && (
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-[var(--neu-text-muted)]">
                  <span>Progress to Tree 🌳 tier</span>
                  <span>{vouchStatus?.vouchCount ?? 0} / 3 vouches</span>
                </div>
                <progress
                  className="h-1.5 w-full overflow-hidden rounded-full accent-[var(--landing-green-deep,#006f35)]"
                  value={Math.min(100, ((vouchStatus?.vouchCount ?? 0) / 3) * 100)}
                  max={100}
                  aria-label="Vouch progress to Tree tier"
                />
              </div>
            )}
          </div>
        )}

        <ProfileSnapFriends
          username={profile.username}
          isOwnProfile={isOwnProfile}
          followers={followerPreview}
          followerCount={followerCount}
        />

        <div className="auth-flow-hero-card flex-col !items-stretch gap-3">
          <p className="auth-flow-hero-card__eyebrow mb-0">About this NeyburH</p>
          <p className="auth-flow-hero-card__meta m-0 leading-6">
            {profile.bio || `${displayName} is part of the ${locationLabel || 'NeyborHuud'} community.`}
          </p>
        </div>

        {(showHandleHistory || (!isOwnProfile && (followsYou || isMutual))) && (
          <div className="flex flex-col gap-2">
            {showHandleHistory ? (
              <div className="auth-flow-hero-card flex-col !items-stretch gap-2">
                <p className="auth-flow-hero-card__eyebrow mb-0">Handle history</p>
                {renameAudit.length > 0 ? (
                  <ul className="space-y-2 text-xs text-[var(--brand-black,#1a1a1a)]">
                    {renameAudit.map((row, idx) => (
                      <li key={`${row.previousUsername}-${row.newUsername}-${idx}`}>
                        <span className="font-mono text-[var(--landing-green-deep,#006f35)]">@{row.previousUsername}</span>
                        {' → '}
                        <span className="font-mono">@{row.newUsername}</span>
                        {row.changedAt ? (
                          <span className="block text-[10px] opacity-70">
                            {new Date(row.changedAt).toLocaleString()}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : hist.usernameTimeline && hist.usernameTimeline.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-[var(--brand-black,#1a1a1a)]">
                    {hist.usernameTimeline.map((row, idx) => (
                      <li key={`${row.username}-${idx}`}>
                        <span className="font-mono font-semibold">@{row.username}</span>
                        <span className="block text-[10px] opacity-70">
                          {new Date(row.effectiveFrom).toLocaleDateString()}
                          {row.effectiveTo
                            ? ` – ${new Date(row.effectiveTo).toLocaleDateString()}`
                            : ' – current'}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
            {!isOwnProfile && (followsYou || isMutual) && (
              <div className="flex flex-wrap gap-2">
                {isMutual ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                    <span className="material-symbols-outlined text-[14px]">link</span>
                    Mutual HuudLink
                  </span>
                ) : followsYou ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                    <span className="material-symbols-outlined text-[14px]">person_check</span>
                    HuudLinks you
                  </span>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* ══════ Two-Column Layout ══════ */}
        <div className="profile-auth-content flex flex-col gap-4 lg:flex-row lg:gap-6">

        {/* TrustOS detail — desktop sidebar; Huud+ card above covers the mobile summary */}
          <aside className="hidden w-full flex-shrink-0 space-y-4 lg:block lg:w-80">
            <div className="auth-flow-hero-card flex-col !items-stretch gap-4">
              <div className="flex items-center justify-between gap-3">
                <p className="auth-flow-hero-card__eyebrow mb-0">TrustOS</p>
                <span className="material-symbols-outlined text-[1.25rem] text-[var(--landing-green-deep,#006f35)]">verified_user</span>
              </div>
              <div>
                <p className="text-4xl font-black leading-none tabular-nums text-[var(--brand-black,#1a1a1a)]">{trustScore}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--neu-text-muted)]">NeyburH Score</p>
                <p className="mt-1 text-xs font-semibold text-[var(--brand-black,#1a1a1a)]">
                  {profileTrustTier.icon} {profileTrustTier.label}
                  {nextTrustTier ? ` · ${Math.max(0, nextTrustTier.minScore - trustScore)} pts to ${nextTrustTier.label}` : ' · Top tier reached'}
                </p>
                {profilePrivileges.marketplaceBadge && (
                  <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${profilePrivileges.marketplaceBadgeColor}`}>
                    {profileTrustTier.icon} {profilePrivileges.marketplaceBadge}
                  </span>
                )}
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-[var(--neu-text-muted)]">
                  <span>Community trust</span>
                  <span>{scorePercent}%</span>
                </div>
                <progress
                  className="h-2 w-full overflow-hidden rounded-full accent-[var(--landing-green-deep,#006f35)]"
                  value={scorePercent}
                  max={100}
                  aria-label="Community trust progress"
                />
              </div>

                {/* Voucher list */}
                {voucherList.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--neu-text-muted)] mb-2">
                      Vouched by
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {voucherList.slice(0, 5).map((v) => (
                        <button
                          key={v.id}
                          onClick={() => router.push(`/profile/${v.voucherUsername}`)}
                          className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          type="button"
                          title={`View @${v.voucherUsername}`}
                        >
                          {v.voucherAvatar ? (
                            <img src={v.voucherAvatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-200 text-[9px] font-black text-emerald-700">
                              {v.voucherUsername[0]?.toUpperCase()}
                            </span>
                          )}
                          @{v.voucherUsername}
                        </button>
                      ))}
                      {voucherList.length > 5 && (
                        <span className="flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-[var(--neu-text-muted)]">
                          +{voucherList.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tier Privileges mini-list */}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--neu-text-muted)] mb-2">Tier Abilities</p>
                  <div className="space-y-1.5">
                    {profilePrivileges.privilegeList.slice(0, 4).map((p) => (
                      <div key={p.label} className={`flex items-center gap-2 text-xs ${p.unlocked ? 'text-slate-700' : 'text-[var(--neu-text-muted)]'}`}>
                        <span className={`material-symbols-outlined text-[14px] ${p.unlocked ? 'text-primary' : 'text-slate-300'}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          {p.unlocked ? 'check_circle' : 'cancel'}
                        </span>
                        {p.label}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-[var(--neu-text-muted)]">{profilePrivileges.summary}</p>
                </div>

                {/* Trust Activity preview (latest 3) */}
                {trustRecentEvents.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--neu-text-muted)] mb-2">Recent Trust Events</p>
                    <div className="space-y-1.5">
                      {trustRecentEvents.slice(0, 3).map((event) => {
                        const meta = TRUST_EVENT_META[event.eventType as keyof typeof TRUST_EVENT_META] ?? {
                          label: event.eventType,
                          icon: 'info',
                          positive: event.pointsChange >= 0,
                        };
                        const isPos = meta.positive && event.pointsChange >= 0;
                        return (
                          <div key={event.id} className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-[13px] ${isPos ? 'text-primary' : 'text-brand-red500'}`}
                              style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                            <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{meta.label}</span>
                            <span className={`shrink-0 text-[11px] font-black tabular-nums ${isPos ? 'text-emerald-600' : 'text-brand-red500'}`}>
                              {isPos ? '+' : ''}{event.pointsChange}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            <div className="auth-flow-hero-card flex-col !items-stretch gap-3">
              <p className="auth-flow-hero-card__eyebrow mb-0">Profile Snapshot</p>
              <div className="space-y-2">
                {profileFacts.map((fact) => (
                  <div key={`side-${fact.label}`} className="auth-signup-location-peek">
                    <span className="auth-signup-location-peek__icon" aria-hidden>
                      <span className="material-symbols-outlined text-[1rem]">{fact.icon}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="auth-signup-location-peek__label">{fact.label}</p>
                      <p className="auth-signup-location-peek__name capitalize">{fact.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="auth-flow-hero-card flex-col !items-stretch gap-3">
              <p className="auth-flow-hero-card__eyebrow mb-0">Verification</p>
              <div className="space-y-2">
                {[
                  { label: 'Location anchored', done: !!profile.location?.latitude },
                  { label: 'Identity confirmed', done: !!profile.identityVerified },
                  { label: 'Community ready', done: !!profile.assignedCommunityId || !!locationLabel },
                ].map((item) => (
                  <div key={item.label} className="auth-signup-location-peek">
                    <span className="auth-signup-location-peek__icon" aria-hidden>
                      <span className="material-symbols-outlined text-[1rem]">{item.done ? 'check' : 'pending'}</span>
                    </span>
                    <div>
                      <p className="auth-signup-location-peek__label">Status</p>
                      <p className="auth-signup-location-peek__name">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 space-y-4">
            <section className="auth-flow-hero-card flex-col !items-stretch gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="auth-flow-hero-card__eyebrow mb-0">Badges</p>
                  <h2 className="auth-flow-hero-card__title !text-lg">NeyborHuud credibility</h2>
                </div>
                <Link
                  href={isOwnProfile ? "/gamification?tab=badges" : `/gamification`}
                  className="auth-btn auth-btn-secondary !min-h-[36px] !w-auto px-3 text-xs"
                >
                  View All
                </Link>
              </div>

              {isOwnProfile ? (
                myBadges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {myBadges.slice(0, 4).map((badge: any, i: number) => (
                      <div key={badge.id ?? badge._id ?? i} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100 text-amber-700">
                          <span className="material-symbols-outlined text-[22px]">{badge.icon ?? "military_tech"}</span>
                        </div>
                        <p className="text-sm font-black leading-tight text-slate-800">{badge.name ?? badge.title ?? "Badge"}</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--neu-text-muted)]">{badge.tier ?? badge.category ?? "Earned"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 px-4 py-8 text-center">
                    <span className="material-symbols-outlined text-[36px] text-slate-300">military_tech</span>
                    <p className="mt-2 text-sm font-bold text-[var(--neu-text-muted)]">No badges earned yet</p>
                    <Link href="/gamification" className="mt-3 inline-block text-xs font-black text-emerald-600 hover:underline">
                      Go earn your first badge →
                    </Link>
                  </div>
                )
              ) : (() => {
                // Use real badges from profile.gamification.badges (sent by backend in public profile response)
                const publicBadges: any[] = (() => {
                  const b = profile.gamification?.badges;
                  return Array.isArray(b) ? b : [];
                })();
                const rarityTone: Record<string, string> = {
                  common:    'bg-slate-50    text-slate-600  ring-slate-100',
                  uncommon:  'bg-emerald-50  text-emerald-700 ring-emerald-100',
                  rare:      'bg-sky-50      text-sky-700    ring-sky-100',
                  epic:      'bg-brand-blue50   text-brand-blue700 ring-violet-100',
                  legendary: 'bg-amber-50    text-amber-700  ring-amber-100',
                };
                if (publicBadges.length === 0) {
                  return (
                    <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 px-4 py-8 text-center">
                      <span className="material-symbols-outlined text-[36px] text-slate-300">military_tech</span>
                      <p className="mt-2 text-sm font-bold text-[var(--neu-text-muted)]">
                        @{profile.username} hasn&apos;t earned any badges yet
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {publicBadges.slice(0, 4).map((badge: any, i: number) => {
                      const tone = rarityTone[badge.rarity ?? badge.tier ?? 'common'] ?? rarityTone.common;
                      return (
                        <div key={badge.id ?? badge._id ?? i} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                          <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${tone}`}>
                            <span className="material-symbols-outlined text-[22px]">{badge.icon ?? 'military_tech'}</span>
                          </div>
                          <p className="text-sm font-black leading-tight text-slate-800">{badge.name ?? badge.title ?? 'Badge'}</p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--neu-text-muted)]">
                            {badge.rarity ?? badge.tier ?? badge.category ?? 'Earned'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>

            {/* ── Gamification Quick Links (own profile only) ── */}
            {isOwnProfile && (
              <section className="auth-flow-hero-card flex-col !items-stretch gap-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)] mb-4">Your HuudCoins Activity</p>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/gamification"
                    className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 p-4 hover:from-amber-100 hover:to-yellow-100 transition-colors group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 group-hover:bg-amber-200 transition-colors">
                      <span className="material-symbols-outlined text-[22px]">emoji_events</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">Gamification Hub</p>
                      <p className="text-[11px] text-[var(--neu-text-muted)]">Badges · Leaderboard</p>
                    </div>
                  </Link>
                  <Link
                    href="/gamification/wallet"
                    className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-4 hover:from-emerald-100 hover:to-teal-100 transition-colors group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                      <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">HuudCoins Wallet</p>
                      <p className="text-[11px] text-[var(--neu-text-muted)]">Balance · Transactions</p>
                    </div>
                  </Link>
                </div>
              </section>
            )}

            {/* ── Jobs posted by this user ── */}
            {userJobs.length > 0 && (
              <section className="auth-flow-hero-card flex-col !items-stretch gap-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)]">Jobs</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">Posted by {isOwnProfile ? "you" : displayName}</h2>
                  </div>
                  <Link href="/jobs" className="text-xs font-black text-emerald-600 hover:underline">See all →</Link>
                </div>
                <div className="space-y-2">
                  {userJobs.map((job: any, i: number) => (
                    <Link
                      key={job.id ?? job._id ?? i}
                      href={`/jobs/${job.id ?? job._id}`}
                      className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-3 hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                        <span className="material-symbols-outlined text-[18px]">work</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{job.title ?? "Job listing"}</p>
                        <p className="text-[11px] text-[var(--neu-text-muted)]">
                          {job.type?.replace("-", " ")} · {job.workMode ?? "—"} · {job.location?.lga ?? job.location?.state ?? ""}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${job.status === "open" ? "bg-green-100 text-green-700" : "bg-brand-surface text-[var(--neu-text-muted)]"}`}>
                        {job.status ?? "open"}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Events organised by this user ── */}
            {userEvents.length > 0 && (
              <section className="auth-flow-hero-card flex-col !items-stretch gap-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)]">Events</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">Organised by {isOwnProfile ? "you" : displayName}</h2>
                  </div>
                  <Link href="/events" className="text-xs font-black text-emerald-600 hover:underline">See all →</Link>
                </div>
                <div className="space-y-2">
                  {userEvents.map((event: any, i: number) => (
                    <Link
                      key={event.id ?? event._id ?? i}
                      href={`/events/${event.id ?? event._id}`}
                      className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-3 hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                        <span className="material-symbols-outlined text-[18px]">event</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-800 truncate">{event.title ?? "Event"}</p>
                        <p className="text-[11px] text-[var(--neu-text-muted)]">
                          {event.date ? new Date(event.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "Date TBC"}
                          {event.location?.lga ? ` · ${event.location.lga}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold text-[var(--neu-text-muted)]">{event.attendees ?? 0} going</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Services offered by this user ── */}
            {userServices.length > 0 && (
              <section className="auth-flow-hero-card flex-col !items-stretch gap-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)]">Services</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">{isOwnProfile ? "Your" : `${displayName}'s`} service offerings</h2>
                  </div>
                  <Link href="/services" className="text-xs font-black text-emerald-600 hover:underline">See all →</Link>
                </div>
                <div className="space-y-2">
                  {userServices.map((service: any, i: number) => (
                    <Link
                      key={service.id ?? service._id ?? i}
                      href={`/services/${service.id ?? service._id}`}
                      className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-3 hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                        <span className="material-symbols-outlined text-[18px]">home_repair_service</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-800 truncate">{service.title ?? "Service"}</p>
                        <p className="text-[11px] text-[var(--neu-text-muted)] capitalize">
                          {service.category ?? "—"}
                          {service.pricing?.amount ? ` · ₦${Number(service.pricing.amount).toLocaleString()}` : service.pricing?.type === "custom" ? " · Custom price" : ""}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-0.5 text-[11px] font-bold text-amber-600">
                        <span className="material-symbols-outlined text-[13px]">star</span>
                        {service.rating ? service.rating.toFixed(1) : "New"}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="auth-flow-hero-card flex-col !items-stretch gap-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)]">Activity</p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">Recent Huud posts</h2>
                </div>
                <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1 text-sm font-black text-[var(--neu-text-muted)]">
                  <button className="rounded-xl bg-white px-4 py-2 text-emerald-700 shadow-sm" type="button">All</button>
                  <button className="rounded-xl px-4 py-2 transition hover:text-emerald-700" type="button">Alerts</button>
                  <button className="rounded-xl px-4 py-2 transition hover:text-emerald-700" type="button">Market</button>
                </div>
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
            <div className="rounded-3xl border border-red-100 bg-red-50/60 px-4 py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-red shadow-sm">
                <span className="material-symbols-outlined text-[34px]">error</span>
              </div>
              <h2 className="mb-2 text-xl font-black text-slate-900">
                Failed to load posts
              </h2>
              <p className="mx-auto mb-4 max-w-md text-sm text-[var(--neu-text-muted)]">
                {postsError?.message || 'Something went wrong. Please try again.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="auth-btn auth-btn-primary !w-auto px-6"
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingPosts && !isErrorPosts && posts.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-8 py-16 text-center">
              <div className="mx-auto max-w-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                  <span className="material-symbols-outlined text-[34px]">dynamic_feed</span>
                </div>
                <p className="mb-2 text-xl font-black text-slate-900">
                  No posts yet
                </p>
                <p className="text-sm leading-6 text-[var(--neu-text-muted)]">
                  When {isOwnProfile ? 'you post' : `@${profile.username} posts`}, they'll show up here.
                </p>
                {isOwnProfile && (
                  <Link
                    href="/feed"
                    className="auth-btn auth-btn-primary !w-auto px-6 mt-6 inline-flex"
                  >
                    Create Your First Post
                  </Link>
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
                  currentUserId={currentUser?.id}
                  onLike={() => handleLike(post)}
                  onComment={() => openPostDetails(post.id)}
                  onShare={() => {}}
                  onSave={() => handleSave(post)}
                  onReport={(id) => setReportingPostId(id)}

                  onCardClick={() => openPostDetails(post.id)}
                />
              ))}

              {/* Load More Trigger */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="py-8 flex items-center justify-center">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--neu-text-muted)]">
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
            </section>
          </main>
        </div>
        </ProfileAuthSheet>

        {isOwnProfile && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploadingAvatar}
            aria-label="Upload profile photo"
          />
        )}
      </ProfileAuthShell>

      {/* Report Modal */}
      {reportingPostId && (
        <ReportModal
          postId={reportingPostId}
          onClose={() => setReportingPostId(null)}
          onSubmit={async (postId, reason, description) => {
            await contentService.reportPost(postId, reason, description);
          }}
        />
      )}

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
        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </div>
      <BottomNav />

      {/* Tip user modal */}
      {showTipModal && profile?.id && (
        <TipModal
          recipient={{
            id: profile.id,
            displayName:
              profile.firstName && profile.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : profile.firstName ?? profile.username ?? "Neighbour",
            username: profile.username,
            avatarUrl: profile.profilePicture || profile.avatarUrl || undefined,
            trustScore: trustScore,
            tier: profileTrustTier?.tier ?? "bronze",
          }}
          isPending={tipUser.isPending}
          onConfirm={(amount) =>
            tipUser.mutate({ recipientId: profile.id, amount })
          }
          onClose={() => setShowTipModal(false)}
        />
      )}

      {isOwnProfile && (
        <CreatePostModal
          isOpen={isCreatePostOpen}
          onClose={() => setIsCreatePostOpen(false)}
          onSuccess={() => {
            setIsCreatePostOpen(false);
            queryClient.invalidateQueries({ queryKey: ['userPosts', userId] });
          }}
        />
      )}
    </div>
  );
}
