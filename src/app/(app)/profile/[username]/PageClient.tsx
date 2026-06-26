/**
 * Public User Profile Page
 * Route: /profile/:username
 * Shows user profile information including avatar, name, username, and bio
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { resolveDynamicParam } from '@/lib/staticExportParams';
import {
  extractVerificationIdentityInput,
  getVerificationProgress,
  getVerificationTierMeta,
} from '@/lib/verificationIdentity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import { gamificationService } from '@/services/gamification.service';
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
import { ProfileBrowseHero } from '@/components/profile/browse/ProfileBrowseHero';
import { ProfileBrowseEyebrow, ProfileBrowseSectionTitle } from '@/components/profile/browse/ProfileBrowseSectionTitle';
import { ProfileSnapStatsRow } from '@/components/profile/snap/ProfileSnapStatsRow';
import { ProfileSnapPlusCard } from '@/components/profile/snap/ProfileSnapPlusCard';
import { ProfileSnapHub } from '@/components/profile/snap/ProfileSnapHub';
import { ProfileSnapFriends } from '@/components/profile/snap/ProfileSnapFriends';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { AvatarAdjusterModal } from '@/components/profile/AvatarAdjusterModal';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { useMyBadges, useMyGamificationStats } from '@/hooks/useGamification';
import { useUserJobs } from '@/hooks/useJobs';
import { useUserEvents } from '@/hooks/useEvents';
import { useUserServices } from '@/hooks/useServices';
import { useUserMarketplace } from '@/hooks/useMarketplace';
import { useVouchStatus, useVouchUser, useRevokeVouch, getTrustTier, useVouches, useUserTrustProfile, useVouchMetrics, TRUST_EVENT_META } from '@/hooks/useTrust';
import { getNextTrustTier, normalizeTrustScore } from '@/lib/trust-economy';
import { getPrivilegesForTier } from '@/lib/trust-privileges';
import { formatTimeAgo } from '@/utils/timeAgo';
import { toast } from 'sonner';
import { getGeolocation } from '@/lib/nativeGeolocation';

type ProfileTab = 'overview' | 'posts' | 'trust' | 'listings';

const PROFILE_TABS: { id: ProfileTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'posts', label: 'Posts', icon: 'dynamic_feed' },
  { id: 'trust', label: 'Trust', icon: 'verified_user' },
  { id: 'listings', label: 'Listings', icon: 'storefront' },
];

function parseProfileTab(value: string | null): ProfileTab {
  if (value === 'posts' || value === 'trust' || value === 'listings') return value;
  return 'overview';
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  // In the Capacitor static export the generated shell's useParams() returns the
  // "__id" placeholder, so resolve the real username from the URL when native.
  const username = resolveDynamicParam(params.username as string, 0);
  const { user: currentUser, uploadProfilePicture } = useAuth();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isPostDetailsOpen, setIsPostDetailsOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [adjustingFile, setAdjustingFile] = useState<File | null>(null);
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

    setAdjustingFile(file);
  };

  const handleSaveAdjustedAvatar = async (croppedFile: File) => {
    setAdjustingFile(null);
    try {
      setIsUploadingAvatar(true);
      await uploadProfilePicture({ file: croppedFile });
      queryClient.invalidateQueries({ queryKey: ['userProfile', username] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Profile photo updated');
    } catch {
      // useAuth mutation onError already surfaces API errors via handleApiError
    } finally {
      setIsUploadingAvatar(false);
    }
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
  const profileUserId = (profile as { id?: string } | undefined)?.id;

  const { data: verificationApiData } = useQuery({
    queryKey: ['userVerification', profileUserId],
    queryFn: () => gamificationService.getUserVerification(profileUserId!),
    enabled: !!profileUserId && apiClient.isAuthenticated(),
    staleTime: 60_000,
  });

  const verificationMetrics = verificationApiData?.data?.metrics;
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
  const { data: vouchMetrics } = useVouchMetrics(profileId, { enabled: !!profileId });
  const vouchMutation = useVouchUser(profileId);
  const revokeMutation = useRevokeVouch(profileId);
  const isVouchPending = vouchMutation.isPending || revokeMutation.isPending;

  // Who has vouched for this user — shown in the TrustOS sidebar card
  const { data: voucherList = [] } = useVouches(profileId, { enabled: !!profileId });

  // Trust activity log for this user's profile (public view)
  const { data: trustProfileData } = useUserTrustProfile(profileId, { enabled: !!profileId });


  const [startingChat, setStartingChat] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('overview');
  const tipUser = useTipUser();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const next = parseProfileTab(new URLSearchParams(window.location.search).get('tab'));
    setTab(next);
  }, [username]);

  const changeTab = (next: ProfileTab) => {
    setTab(next);
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (next === 'overview') params.delete('tab');
    else params.set('tab', next);
    const qs = params.toString();
    router.replace(`/profile/${username}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  const handleStartChat = async () => {
    if (!userId) return;
    setStartingChat(true);
    try {
      const res = await chatService.getOrCreateDirectConversation(userId);
      // Backend wraps in { conversation: { _id, ... } }
      const conv = (res.data as any)?.conversation ?? (res.data as any);
      const convId = conv?._id ?? conv?.conversationId ?? conv?.id;
      if (convId) router.push(`/chat/${convId}`);
      else toast.error('Could not open conversation');
    } catch {
      toast.error('Could not start chat. Please try again.');
    } finally {
      setStartingChat(false);
    }
  };

  // Get the correct user ID - backend might use _id or id
  const userId = profile?.id || (profile as any)?._id || null;

  // ── Phase 1–3 profile data ────────────────────────────────────────────────
  // Badges: only fetch for own profile (useMyBadges returns current user's badges)
  const { data: myBadgesRaw } = useMyBadges();
  const myGamificationStats = useMyGamificationStats();
  const myBadges: any[] = (() => {
    const b = (myBadgesRaw as any)?.data ?? myBadgesRaw ?? [];
    return Array.isArray(b) ? b : [];
  })();

  // Jobs / Events / Services posted by this profile's user
  const { data: userJobsRaw, isLoading: jobsLoading } = useUserJobs(userId, 3);
  const userJobs: any[] = Array.isArray(userJobsRaw) ? userJobsRaw : [];

  const { data: userEventsRaw, isLoading: eventsLoading } = useUserEvents(userId, 3);
  const userEvents: any[] = Array.isArray(userEventsRaw) ? userEventsRaw : [];

  const { data: userServicesRaw, isLoading: servicesLoading } = useUserServices(userId, 3);
  const userServices: any[] = Array.isArray(userServicesRaw) ? userServicesRaw : [];

  const { data: userMarketplaceRaw, isLoading: marketplaceLoading } = useUserMarketplace(userId, 3);
  const userMarketplace: any[] = Array.isArray(userMarketplaceRaw) ? userMarketplaceRaw : [];

  const listingsLoading = !!userId && (jobsLoading || eventsLoading || servicesLoading || marketplaceLoading);

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
      <AppBrowseLayout maxWidth="680">
        <div className="space-y-4">
          <div className="animate-pulse mod-card h-52 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse mod-card h-20 rounded-xl" />
            ))}
          </div>
          <div className="animate-pulse mod-card h-32 rounded-2xl" />
        </div>
      </AppBrowseLayout>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <AppBrowseLayout maxWidth="680">
        <BrowseEmptyState
          icon="person_off"
          title="User not found"
          description={`The user @${username} doesn't exist or their profile is unavailable.`}
          action={
            <Link
              href="/explore"
              className="mod-chip mod-chip-active inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-primary no-underline"
            >
              Explore NeyborHuud
            </Link>
          }
        />
      </AppBrowseLayout>
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
  const huudCoinsFromProfile =
    (profile as any).totalHuudCoins ??
    (profile as any).huudCoins ??
    profile.gamification?.points ??
    0;
  const huudCoins =
    isOwnProfile
      ? ((myGamificationStats.data as any)?.huudCoins ??
        (myGamificationStats.data as any)?.totalHuudCoins ??
        huudCoinsFromProfile)
      : huudCoinsFromProfile;
  const level = profile.gamification?.level ?? 1;
  const profilePoints = profile.gamification?.points ?? huudCoins;
  const scorePercent = normalizedTrust.percent;
  const joinedLabel = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently';
  const profileVerificationInput = extractVerificationIdentityInput({
    ...(profile as unknown as Record<string, unknown>),
    trustScore: profile.trustScore ?? profile.gamification?.trustScore,
    huudCoins,
    streakDays:
      verificationMetrics?.streakDays ??
      (profile as { streakDays?: number }).streakDays ??
      profile.gamification?.streak,
    vouchCount:
      verificationMetrics?.vouchCount ??
      vouchMetrics?.received ??
      vouchStatus?.vouchCount ??
      (profile as { vouchCount?: number }).vouchCount,
    walletSpendCount:
      verificationMetrics?.walletSpendCount ??
      (profile as { walletSpendCount?: number }).walletSpendCount,
    earnedHuudCoins90d:
      verificationMetrics?.earnedHuudCoins90d ??
      (profile as { earnedHuudCoins90d?: number }).earnedHuudCoins90d,
    leaderboardPercentile:
      verificationMetrics?.leaderboardPercentile ??
      (profile as { leaderboardPercentile?: number }).leaderboardPercentile,
  });
  const verificationProgress =
    verificationApiData?.data?.progress ??
    (profile as { verificationProgress?: ReturnType<typeof getVerificationProgress> })
      .verificationProgress ??
    getVerificationProgress(profileVerificationInput);
  const verificationTierMeta = getVerificationTierMeta(verificationProgress.tier);
  const profileCommunityVerified = ['gold', 'diamond', 'platinum'].includes(
    verificationProgress.tier,
  );
  const profileFacts = [
    { label: 'Joined', value: joinedLabel, icon: 'calendar_month' },
    {
      label: 'Verification',
      value:
        verificationProgress.tier === 'none'
          ? 'Not started'
          : `${verificationTierMeta.emoji} ${verificationTierMeta.label}`,
      icon: profileCommunityVerified ? 'verified' : 'shield',
    },
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

  const handleSetLocation = () => {
    router.push('/settings/location');
  };

  return (
    <>
      {(ownerMilestone ?? pendingMilestone) && (
        <FollowerMilestoneCelebration
          milestone={(ownerMilestone ?? pendingMilestone)!}
          onDismiss={ownerMilestone ? () => setOwnerMilestone(null) : clearMilestone}
        />
      )}

      <AppBrowseLayout
        maxWidth="680"
        header={
          <BrowseTabStrip
            tabs={PROFILE_TABS}
            activeId={tab}
            onChange={(id) => changeTab(id as ProfileTab)}
            trailing={
              isOwnProfile ? (
                <Link
                  href="/settings"
                  className="mod-chip inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold"
                  aria-label="Account settings"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTipModal(true)}
                  className="mod-chip mod-chip-active inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-primary"
                >
                  <span aria-hidden>🪙</span>
                  Tip
                </button>
              )
            }
          />
        }
      >
        <div className="space-y-4">
          <ProfileBrowseHero
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
            identityVerified={profileCommunityVerified}
            verificationInProgress={['bronze', 'silver'].includes(verificationProgress.tier)}
            verificationTierLabel={
              verificationProgress.tier !== 'none'
                ? `${verificationTierMeta.emoji} ${verificationTierMeta.label}`
                : undefined
            }
            vouchReceived={vouchMetrics?.received ?? vouchStatus?.vouchCount ?? 0}
            vouchGiven={isOwnProfile ? (vouchMetrics?.given ?? 0) : 0}
          />

          {!isOwnProfile && (
            <div className="mod-card flex flex-wrap gap-2 rounded-2xl p-3">
              {isLoadingStatus ? (
                <div className="mod-chip animate-pulse px-4 py-2 opacity-60">Loading…</div>
              ) : isBlocked ? (
                <button
                  onClick={() => toggleBlock()}
                  disabled={isBlockPending}
                  className="mod-chip inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-brand-red"
                  type="button"
                >
                  {isBlockPending ? 'Unblocking…' : 'Blocked'}
                </button>
              ) : isBlockedByThem ? (
                <div className="mod-chip cursor-not-allowed px-4 py-2 opacity-60">Unavailable</div>
              ) : (
                <>
                  <button
                    onClick={toggleFollow}
                    disabled={isFollowPending}
                    className={`mod-chip inline-flex items-center rounded-full px-4 py-2 text-sm font-bold ${
                      isFollowing ? '' : 'mod-chip-active text-primary'
                    }`}
                    type="button"
                  >
                    {isFollowPending
                      ? isFollowing
                        ? 'Unfollowing…'
                        : 'Following…'
                      : isFollowing
                        ? 'Following'
                        : `Follow${followsYou && !isFollowing ? ' back' : ''}`}
                  </button>
                </>
              )}
            </div>
          )}

          {tab === 'overview' && (
            <>
        <ProfileSnapStatsRow
          username={profile.username}
          isOwnProfile={isOwnProfile}
          dateOfBirth={profile.dateOfBirth}
          huudCoins={huudCoins}
          followerCount={followerCount}
          followingCount={followingCount}
          vouchReceived={vouchMetrics?.received ?? vouchStatus?.vouchCount ?? 0}
          vouchGiven={isOwnProfile ? (vouchMetrics?.given ?? 0) : 0}
        />

        <ProfileSnapPlusCard
          username={profile.username}
          isOwnProfile={isOwnProfile}
          trustScore={trustScore}
          trustLabel={profileTrustTier.label}
          level={level}
        />

        <ProfileSnapHub
          isOwnProfile={isOwnProfile}
          onCreatePost={handleCreatePost}
          showPinPrompt={!hasMapLocation}
        />

        {!isOwnProfile && !isBlocked && !isBlockedByThem && currentUser && (
          <div className="mod-card flex flex-col gap-3 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <ProfileBrowseEyebrow>Community Trust</ProfileBrowseEyebrow>
                  {!vouchStatus?.hasVouched && (
                    vouchStatus?.locationRequired ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-[var(--surface-muted,#f4f4f5)] px-2 py-0.5 text-[10px] font-bold text-[var(--neu-text-muted)]">
                        <span className="material-symbols-outlined text-[12px]">location_off</span>
                        Location needed
                      </span>
                    ) : vouchStatus?.withinRange === true ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-status-success/30 bg-status-success/10 px-2 py-0.5 text-[10px] font-bold text-status-success">
                        <span className="material-symbols-outlined text-[12px]">my_location</span>
                        {vouchStatus.distanceMeters}m away ✓
                      </span>
                    ) : vouchStatus?.withinRange === false ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-status-danger/30 bg-status-danger/8 px-2 py-0.5 text-[10px] font-bold text-status-danger">
                        <span className="material-symbols-outlined text-[12px]">location_off</span>
                        {vouchStatus.distanceMeters != null ? `${vouchStatus.distanceMeters}m away` : 'Too far'} — 500m limit
                      </span>
                    ) : null
                  )}
                </div>
                <p className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>
                  {(vouchStatus?.vouchCount ?? 0) > 0
                    ? `${vouchStatus!.vouchCount} NeyborH${vouchStatus!.vouchCount === 1 ? '' : 's'} vouch for @${profile.username}`
                    : `@${profile.username} has no vouches yet`}
                </p>
                <p className="text-sm text-[var(--neu-text-muted)]">
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
                    className="mod-chip inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold"
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
                    className="mod-chip mod-chip-active inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-primary"
                    type="button"
                  >
                    {isVouchPending ? '…' : '🤜 Vouch'}
                  </button>
                )}
                {!isBlockedByThem && (
                  <button
                    onClick={() => toggleBlock()}
                    disabled={isBlockPending}
                    className="mod-chip inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
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

        <div className="mod-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <ProfileBrowseEyebrow>About this NeyburH</ProfileBrowseEyebrow>
            {isOwnProfile ? (
              <Link href="/settings" className="text-xs font-bold text-primary no-underline">
                Edit bio
              </Link>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--neu-text-muted)]">
            {profile.bio || `${displayName} is part of the ${locationLabel || 'NeyborHuud'} community.`}
          </p>
        </div>

        {(showHandleHistory || (!isOwnProfile && (followsYou || isMutual))) && (
          <div className="flex flex-col gap-2">
            {showHandleHistory ? (
              <div className="mod-card rounded-2xl p-4">
                <ProfileBrowseEyebrow>Handle history</ProfileBrowseEyebrow>
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
                          {new Date(row.effectiveFrom).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {row.effectiveTo
                            ? ` – ${new Date(row.effectiveTo).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`
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
                  <span className="mod-chip mod-chip-active inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-primary">
                    <span className="material-symbols-outlined text-[14px]">link</span>
                    Mutual follow
                  </span>
                ) : followsYou ? (
                  <span className="mod-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]">person_check</span>
                    Follows you
                  </span>
                ) : null}
              </div>
            )}
          </div>
        )}
            </>
          )}

          {tab === 'trust' && (
            <div className="space-y-4">
            <div className="mod-card flex flex-col gap-4 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <ProfileBrowseEyebrow>TrustOS</ProfileBrowseEyebrow>
                <span className="material-symbols-outlined text-[1.25rem] text-primary">verified_user</span>
              </div>
              <div>
                <p className="text-4xl font-black leading-none tabular-nums" style={{ color: 'var(--neu-text)' }}>{trustScore}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--neu-text-muted)]">NeyburH Score</p>
                <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--neu-text)' }}>
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
                          className="flex items-center gap-1.5 rounded-full border border-status-success/20 bg-status-success/10 px-2 py-1 text-xs font-semibold text-status-success transition hover:bg-status-success/15"
                          type="button"
                          title={`View @${v.voucherUsername}`}
                        >
                          {v.voucherAvatar ? (
                            <img src={v.voucherAvatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-status-success/25 text-[10px] font-black text-status-success">
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
                <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
                  <ProfileBrowseEyebrow>Tier Abilities</ProfileBrowseEyebrow>
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
                  <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
                    <ProfileBrowseEyebrow>Recent Trust Events</ProfileBrowseEyebrow>
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
                            <span className={`shrink-0 text-[11px] font-black tabular-nums ${isPos ? 'text-status-success' : 'text-brand-red500'}`}>
                              {isPos ? '+' : ''}{event.pointsChange}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            <div className="mod-card rounded-2xl p-4">
              <ProfileBrowseEyebrow>Profile Snapshot</ProfileBrowseEyebrow>
              <div className="mt-3 space-y-2">
                {profileFacts.map((fact) => (
                  <div key={`side-${fact.label}`} className="mod-inset flex items-center gap-3 rounded-xl px-3 py-2">
                    <span className="material-symbols-outlined text-[1rem] text-primary">{fact.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--neu-text-muted)]">{fact.label}</p>
                      <p className="text-sm font-semibold capitalize" style={{ color: 'var(--neu-text)' }}>{fact.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mod-card rounded-2xl p-4">
              <ProfileBrowseEyebrow>Verification Journey</ProfileBrowseEyebrow>
              <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
                {verificationProgress.tier === 'none'
                  ? 'Start earning your neighbour verification tiers'
                  : `${verificationTierMeta.emoji} ${verificationTierMeta.label} · ${verificationTierMeta.description}`}
              </p>
              {verificationProgress.nextTier ? (
                <p className="mt-1 text-xs text-[var(--neu-text-muted)]">
                  Next: {getVerificationTierMeta(verificationProgress.nextTier).label} ·{' '}
                  {verificationProgress.percentToNext}% overall progress
                </p>
              ) : null}
              <div className="mt-3 space-y-2">
                {verificationProgress.axes.map((axis) => (
                  <div key={axis.id} className="mod-inset flex items-center gap-3 rounded-xl px-3 py-2">
                    <span className="material-symbols-outlined text-[1rem] text-primary">
                      {axis.done ? 'check_circle' : 'pending'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--neu-text-muted)]">
                        {axis.label}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
                        {axis.detail}
                      </p>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-primary">{axis.percent}%</span>
                  </div>
                ))}
              </div>
              {verificationProgress.blockers.length > 0 ? (
                <div className="mt-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Next steps</p>
                  <ul className="mt-1 space-y-1 text-xs text-[var(--neu-text-muted)]">
                    {verificationProgress.blockers.slice(0, 4).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="mod-card rounded-2xl p-4">
              <ProfileBrowseEyebrow>Verification checklist</ProfileBrowseEyebrow>
              <div className="mt-3 space-y-2">
                {[
                  { label: 'Email verified', done: Boolean((profile as { emailVerified?: boolean }).emailVerified || profile.verificationStatus === 'verified') },
                  { label: 'Profile ready (photo + bio)', done: Boolean(profile.firstName && profile.lastName && (profile.avatarUrl || profile.profilePicture) && (profile.bio?.trim().length ?? 0) >= 10) },
                  { label: 'Community joined', done: !!profile.assignedCommunityId },
                  { label: 'Location pinned', done: !!profile.location?.latitude },
                  { label: 'Gold trust earned', done: profileCommunityVerified },
                ].map((item) => (
                  <div key={item.label} className="mod-inset flex items-center gap-3 rounded-xl px-3 py-2">
                    <span className="material-symbols-outlined text-[1rem] text-primary">{item.done ? 'check_circle' : 'pending'}</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--neu-text-muted)]">Status</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <section className="mod-card rounded-2xl p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <ProfileBrowseEyebrow>Badges</ProfileBrowseEyebrow>
                  <ProfileBrowseSectionTitle>NeyborHuud credibility</ProfileBrowseSectionTitle>
                </div>
                <Link
                  href={isOwnProfile ? '/huud-economy/score?tab=badges' : '/huud-economy/score'}
                  className="mod-chip inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold no-underline"
                >
                  View all
                </Link>
              </div>

              {isOwnProfile ? (
                myBadges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {myBadges.slice(0, 4).map((badge: any, i: number) => (
                      <div key={badge.id ?? badge._id ?? i} className="mod-inset rounded-xl p-3">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                          <span className="material-symbols-outlined text-[22px]">{badge.icon ?? 'military_tech'}</span>
                        </div>
                        <p className="text-sm font-bold leading-tight" style={{ color: 'var(--neu-text)' }}>{badge.name ?? badge.title ?? 'Badge'}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--neu-text-muted)]">{badge.tier ?? badge.category ?? 'Earned'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <BrowseEmptyState
                    icon="military_tech"
                    title="No badges earned yet"
                    action={
                      <Link href="/huud-economy" className="mod-chip mod-chip-active rounded-full px-3 py-1.5 text-xs font-bold text-primary no-underline">
                        Earn your first badge
                      </Link>
                    }
                  />
                )
              ) : (() => {
                // Use real badges from profile.gamification.badges (sent by backend in public profile response)
                const publicBadges: any[] = (() => {
                  const b = profile.gamification?.badges;
                  return Array.isArray(b) ? b : [];
                })();
                const rarityTone: Record<string, string> = {
                  common:    'bg-slate-50    text-slate-600  ring-slate-100',
                  uncommon:  'bg-status-success/10  text-status-success ring-status-success/20',
                  rare:      'bg-sky-50      text-sky-700    ring-sky-100',
                  epic:      'bg-brand-blue50   text-brand-blue700 ring-violet-100',
                  legendary: 'bg-amber-50    text-amber-700  ring-amber-100',
                };
                if (publicBadges.length === 0) {
                  return (
                    <BrowseEmptyState
                      icon="military_tech"
                      title="No badges yet"
                      description={`@${profile.username} hasn't earned any badges yet.`}
                    />
                  );
                }
                return (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {publicBadges.slice(0, 4).map((badge: any, i: number) => {
                      const tone = rarityTone[badge.rarity ?? badge.tier ?? 'common'] ?? rarityTone.common;
                      return (
                        <div key={badge.id ?? badge._id ?? i} className="mod-inset rounded-xl p-3">
                          <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${tone}`}>
                            <span className="material-symbols-outlined text-[22px]">{badge.icon ?? 'military_tech'}</span>
                          </div>
                          <p className="text-sm font-bold leading-tight" style={{ color: 'var(--neu-text)' }}>{badge.name ?? badge.title ?? 'Badge'}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--neu-text-muted)]">
                            {badge.rarity ?? badge.tier ?? badge.category ?? 'Earned'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>
            </div>
          )}

          {tab === 'listings' && (
            <div className="space-y-4">
            {listingsLoading ? (
              <div className="mod-card flex flex-col gap-2 rounded-2xl p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mod-inset h-20 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : null}

            {!listingsLoading && isOwnProfile && (
              <section className="mod-card rounded-2xl p-4">
                <ProfileBrowseEyebrow>Your HuudCoins activity</ProfileBrowseEyebrow>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Link
                    href="/huud-economy/score"
                    className="mod-inset flex items-center gap-3 rounded-xl p-3 no-underline transition-opacity hover:opacity-90"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <span className="material-symbols-outlined text-[22px]">emoji_events</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Gamification Hub</p>
                      <p className="text-[11px] text-[var(--neu-text-muted)]">Badges · Leaderboard</p>
                    </div>
                  </Link>
                  <Link
                    href="/huud-economy/wallet"
                    className="mod-inset flex items-center gap-3 rounded-xl p-3 no-underline transition-opacity hover:opacity-90"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>HuudCoins Wallet</p>
                      <p className="text-[11px] text-[var(--neu-text-muted)]">Balance · Transactions</p>
                    </div>
                  </Link>
                </div>
              </section>
            )}

            {!listingsLoading && userJobs.length === 0 && userEvents.length === 0 && userServices.length === 0 && userMarketplace.length === 0 && !isOwnProfile && (
              <BrowseEmptyState
                icon="storefront"
                title="No listings yet"
                description={`@${profile.username} hasn't posted jobs, events, services, or marketplace items yet.`}
              />
            )}

            {!listingsLoading && userJobs.length === 0 && userEvents.length === 0 && userServices.length === 0 && userMarketplace.length === 0 && isOwnProfile && (
              <BrowseEmptyState
                icon="storefront"
                title="Your listings"
                description="Jobs, events, services, and marketplace items you post will show up here."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link href="/jobs" className="mod-chip mod-chip-active rounded-full px-3 py-1.5 text-xs font-bold text-primary no-underline">Post a job</Link>
                    <Link href="/events" className="mod-chip rounded-full px-3 py-1.5 text-xs font-semibold no-underline">Create event</Link>
                    <Link href="/marketplace/sell" className="mod-chip rounded-full px-3 py-1.5 text-xs font-semibold no-underline">Sell item</Link>
                  </div>
                }
              />
            )}

            {userJobs.length > 0 && (
              <section className="mod-card rounded-2xl p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <ProfileBrowseEyebrow>Jobs</ProfileBrowseEyebrow>
                    <ProfileBrowseSectionTitle>Posted by {isOwnProfile ? 'you' : displayName}</ProfileBrowseSectionTitle>
                  </div>
                  <Link href={userId ? `/jobs?employerId=${userId}` : '/jobs'} className="text-xs font-bold text-primary no-underline">See all</Link>
                </div>
                <div className="space-y-2">
                  {userJobs.map((job: any, i: number) => (
                    <Link
                      key={job.id ?? job._id ?? i}
                      href={`/jobs/${job.id ?? job._id}`}
                      className="mod-inset flex items-start gap-3 rounded-xl p-3 no-underline transition-opacity hover:opacity-90"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <span className="material-symbols-outlined text-[18px]">work</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{job.title ?? 'Job listing'}</p>
                        <p className="text-[11px] text-[var(--neu-text-muted)]">
                          {job.type?.replace('-', ' ')} · {job.workMode ?? '—'} · {job.location?.lga ?? job.location?.state ?? ''}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${job.status === 'open' ? 'bg-primary/15 text-primary' : 'text-[var(--neu-text-muted)]'}`}>
                        {job.status ?? 'open'}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {userEvents.length > 0 && (
              <section className="mod-card rounded-2xl p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <ProfileBrowseEyebrow>Events</ProfileBrowseEyebrow>
                    <ProfileBrowseSectionTitle>Organised by {isOwnProfile ? 'you' : displayName}</ProfileBrowseSectionTitle>
                  </div>
                  <Link href={userId ? `/events?organizerId=${userId}` : '/events'} className="text-xs font-bold text-primary no-underline">See all</Link>
                </div>
                <div className="space-y-2">
                  {userEvents.map((event: any, i: number) => (
                    <Link
                      key={event.id ?? event._id ?? i}
                      href={`/events/${event.id ?? event._id}`}
                      className="mod-inset flex items-start gap-3 rounded-xl p-3 no-underline transition-opacity hover:opacity-90"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <span className="material-symbols-outlined text-[18px]">event</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{event.title ?? 'Event'}</p>
                        <p className="text-[11px] text-[var(--neu-text-muted)]">
                          {event.date ? new Date(event.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBC'}
                          {event.location?.lga ? ` · ${event.location.lga}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold text-[var(--neu-text-muted)]">{event.attendees ?? 0} going</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {userServices.length > 0 && (
              <section className="mod-card rounded-2xl p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <ProfileBrowseEyebrow>Services</ProfileBrowseEyebrow>
                    <ProfileBrowseSectionTitle>{isOwnProfile ? 'Your' : `${displayName}'s`} service offerings</ProfileBrowseSectionTitle>
                  </div>
                  <Link href={userId ? `/services?providerId=${userId}` : '/services'} className="text-xs font-bold text-primary no-underline">See all</Link>
                </div>
                <div className="space-y-2">
                  {userServices.map((service: any, i: number) => (
                    <Link
                      key={service.id ?? service._id ?? i}
                      href={`/services/${service.id ?? service._id}`}
                      className="mod-inset flex items-start gap-3 rounded-xl p-3 no-underline transition-opacity hover:opacity-90"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <span className="material-symbols-outlined text-[18px]">home_repair_service</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{service.title ?? 'Service'}</p>
                        <p className="text-[11px] capitalize text-[var(--neu-text-muted)]">
                          {service.category ?? '—'}
                          {service.pricing?.amount ? ` · ₦${Number(service.pricing.amount).toLocaleString()}` : service.pricing?.type === 'custom' ? ' · Custom price' : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-primary">
                        <span className="material-symbols-outlined text-[13px]">star</span>
                        {service.rating ? service.rating.toFixed(1) : 'New'}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {userMarketplace.length > 0 && (
              <section className="mod-card rounded-2xl p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <ProfileBrowseEyebrow>Marketplace</ProfileBrowseEyebrow>
                    <ProfileBrowseSectionTitle>{isOwnProfile ? 'Your' : `${displayName}'s`} listings</ProfileBrowseSectionTitle>
                  </div>
                  <Link href={userId ? `/marketplace?sellerId=${userId}` : '/marketplace'} className="text-xs font-bold text-primary no-underline">See all</Link>
                </div>
                <div className="space-y-2">
                  {userMarketplace.map((item: any, i: number) => (
                    <Link
                      key={item.id ?? item._id ?? i}
                      href={`/marketplace/${item.id ?? item._id}`}
                      className="mod-inset flex items-start gap-3 rounded-xl p-3 no-underline transition-opacity hover:opacity-90"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <span className="material-symbols-outlined text-[18px]">storefront</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{item.title ?? 'Listing'}</p>
                        <p className="text-[11px] text-[var(--neu-text-muted)]">
                          {item.category ?? 'Item'}
                          {item.price != null ? ` · ₦${Number(item.price).toLocaleString()}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold capitalize text-primary">
                        {item.condition ?? 'listed'}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            </div>
          )}

          {tab === 'posts' && (
            <section className="mod-card rounded-2xl p-4">
              <div className="mb-4">
                <ProfileBrowseEyebrow>Activity</ProfileBrowseEyebrow>
                <ProfileBrowseSectionTitle>Recent Huud posts</ProfileBrowseSectionTitle>
              </div>

              <div className="space-y-4">
          {isLoadingPosts && (
            <div>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          )}

          {isErrorPosts && !isLoadingPosts && (
            <BrowseEmptyState
              icon="error"
              title="Failed to load posts"
              description={postsError?.message || 'Something went wrong. Please try again.'}
              action={
                <button
                  onClick={() => window.location.reload()}
                  className="mod-chip mod-chip-active rounded-full px-4 py-2 text-sm font-bold text-primary"
                  type="button"
                >
                  Retry
                </button>
              }
            />
          )}

          {!isLoadingPosts && !isErrorPosts && posts.length === 0 && (
            <BrowseEmptyState
              icon="dynamic_feed"
              title="No posts yet"
              description={`When ${isOwnProfile ? 'you post' : `@${profile.username} posts`}, they'll show up here.`}
              action={
                isOwnProfile ? (
                  <button
                    type="button"
                    onClick={handleCreatePost}
                    className="mod-chip mod-chip-active rounded-full px-4 py-2 text-sm font-bold text-primary"
                  >
                    Create your first post
                  </button>
                ) : undefined
              }
            />
          )}

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

              {hasNextPage && (
                <div ref={loadMoreRef} className="flex items-center justify-center py-8">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--neu-text-muted)]">
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      <span>Loading more posts…</span>
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
          )}
        </div>

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
      </AppBrowseLayout>

      {reportingPostId && (
        <ReportModal
          postId={reportingPostId}
          onClose={() => setReportingPostId(null)}
          onSubmit={async (postId, reason, description) => {
            await contentService.reportPost(postId, reason, description);
          }}
        />
      )}

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

      {showTipModal && profile?.id && (
        <TipModal
          recipient={{
            id: profile.id,
            displayName:
              profile.firstName && profile.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : profile.firstName ?? profile.username ?? 'Neighbour',
            username: profile.username,
            avatarUrl: profile.profilePicture || profile.avatarUrl || undefined,
            trustScore: trustScore,
            tier: profileTrustTier?.tier ?? 'bronze',
          }}
          isPending={tipUser.isPending}
          onConfirm={async (amount) => {
            await tipUser.mutateAsync({ recipientId: profile.id, amount });
            toast.success('Tip sent!');
            setShowTipModal(false);
          }}
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

      {adjustingFile && (
        <AvatarAdjusterModal
          file={adjustingFile}
          onSave={handleSaveAdjustedAvatar}
          onCancel={() => setAdjustingFile(null)}
        />
      )}
    </>
  );
}
