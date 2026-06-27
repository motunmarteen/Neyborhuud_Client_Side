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
import TopNav from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/feed/BottomNav';
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

type ProfileTab = 'overview' | 'posts' | 'trust' | 'listings' | 'saved' | 'economy' | 'street_radar';

const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'posts', label: 'Posts' },
  { id: 'trust', label: 'Trust' },
  { id: 'listings', label: 'Listings' },
  { id: 'saved', label: 'Saved' },
  { id: 'economy', label: 'Economy' },
  { id: 'street_radar', label: 'Radar' },
];

const TAB_STYLES: Record<ProfileTab, { active: string; inactive: string; icon: string }> = {
  overview: {
    active: 'bg-blue-600 border-blue-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.25)]',
    inactive: 'bg-[#F0F5FF] border-blue-100/50 text-blue-600 hover:bg-blue-100/60',
    icon: 'dashboard',
  },
  posts: {
    active: 'bg-purple-600 border-purple-600 text-white shadow-[0_4px_16px_rgba(147,51,234,0.25)]',
    inactive: 'bg-[#FAF5FF] border-purple-100/50 text-purple-600 hover:bg-purple-100/60',
    icon: 'chat_bubble',
  },
  trust: {
    active: 'bg-emerald-600 border-emerald-600 text-white shadow-[0_4px_16px_rgba(5,150,105,0.25)]',
    inactive: 'bg-[#F0FDF4] border-emerald-100/50 text-emerald-600 hover:bg-emerald-100/60',
    icon: 'verified_user',
  },
  listings: {
    active: 'bg-orange-500 border-orange-500 text-white shadow-[0_4px_16px_rgba(249,115,22,0.25)]',
    inactive: 'bg-[#FFF7ED] border-orange-100/50 text-orange-600 hover:bg-orange-100/60',
    icon: 'storefront',
  },
  saved: {
    active: 'bg-rose-500 border-rose-500 text-white shadow-[0_4px_16px_rgba(244,63,94,0.25)]',
    inactive: 'bg-[#FFF1F2] border-rose-100/50 text-rose-500 hover:bg-rose-100/60',
    icon: 'bookmark',
  },
  economy: {
    active: 'bg-amber-500 border-amber-500 text-white shadow-[0_4px_16px_rgba(245,158,11,0.25)]',
    inactive: 'bg-[#FFFBEB] border-amber-100/50 text-amber-600 hover:bg-amber-100/60',
    icon: 'account_balance_wallet',
  },
  street_radar: {
    active: 'bg-teal-600 border-teal-600 text-white shadow-[0_4px_16px_rgba(13,148,136,0.25)]',
    inactive: 'bg-[#F0FDFA] border-teal-100/50 text-teal-600 hover:bg-teal-100/60',
    icon: 'radar',
  },
};

function parseProfileTab(value: string | null): ProfileTab {
  if (value === 'posts' || value === 'trust' || value === 'listings' || value === 'saved' || value === 'economy' || value === 'street_radar') return value;
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

  // Flatten and deduplicate posts from all pages
  const posts: Post[] = (() => {
    const raw = postsData?.pages.flatMap((page: any) => page.content ?? []) ?? [];
    const seen = new Set<string>();
    return raw.filter((post) => {
      if (!post?.id) return false;
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  })();

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
      <div className="flex h-[100dvh] w-full flex-col bg-white overflow-hidden">
        <TopNav />
        <div className="app-chrome-below-topnav mx-auto w-full max-w-[600px] !bg-white flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar pb-24 !mt-0 !pt-0 px-6 py-4 space-y-6">
            <div className="animate-pulse bg-slate-100 h-32 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-slate-50 h-16 rounded-xl" />
              ))}
            </div>
            <div className="animate-pulse bg-slate-100 h-28 rounded-2xl" />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="flex h-[100dvh] w-full flex-col bg-white overflow-hidden">
        <TopNav />
        <div className="app-chrome-below-topnav mx-auto w-full max-w-[600px] !bg-white flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar pb-24 !mt-0 !pt-0 flex items-center justify-center">
            <BrowseEmptyState
              icon="person_off"
              title="User not found"
              description={`The user @${username} doesn't exist or their profile is unavailable.`}
              className="!border-0 !shadow-none !bg-white"
              action={
                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 px-6 py-2 text-xs font-bold shadow-sm transition"
                >
                  Explore NeyborHuud
                </Link>
              }
            />
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

      <div className="flex h-[100dvh] w-full flex-col bg-white overflow-hidden">
        <TopNav />

        <div className="app-chrome-below-topnav mx-auto w-full max-w-[600px] !bg-white flex flex-col flex-1 overflow-y-auto">
          <div className="flex-1 no-scrollbar pb-24 !mt-0 !pt-0">
            <div className="flex flex-col">
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
            <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3 py-1 flex flex-wrap gap-2">
              {isLoadingStatus ? (
                <div className="px-4 py-2 text-xs font-bold text-gray-400 animate-pulse bg-gray-50 rounded-full">Loading…</div>
              ) : isBlocked ? (
                <button
                  onClick={() => toggleBlock()}
                  disabled={isBlockPending}
                  className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 px-5 py-2 text-xs font-bold shadow-sm"
                  type="button"
                >
                  {isBlockPending ? 'Unblocking…' : 'Blocked'}
                </button>
              ) : isBlockedByThem ? (
                <div className="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50 rounded-full opacity-60">Unavailable</div>
              ) : (
                <>
                  <button
                    onClick={toggleFollow}
                    disabled={isFollowPending}
                    className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-bold transition-all shadow-sm ${
                      isFollowing
                        ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
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

          <div className="relative bg-white border-b border-gray-100/80">
            <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] pt-4 pb-5 flex items-center justify-around gap-2 overflow-x-auto no-scrollbar">
              {PROFILE_TABS.map((t) => {
                const isActive = tab === t.id;
                const style = TAB_STYLES[t.id];
                const circleClass = `w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-200 ${
                  isActive ? style.active : style.inactive
                }`;
                return (
                  <button
                    key={t.id}
                    onClick={() => changeTab(t.id)}
                    className="flex flex-col items-center gap-1.5 focus:outline-none touch-manipulation group flex-shrink-0"
                  >
                    <div className={circleClass}>
                      <span className="material-symbols-outlined text-[23px] select-none" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                        {style.icon}
                      </span>
                    </div>
                    <span className={`text-[11px] font-bold transition-colors uppercase tracking-wider ${
                      isActive ? 'text-gray-900 font-extrabold' : 'text-gray-400 group-hover:text-gray-600'
                    }`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}

              {!isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setShowTipModal(true)}
                  className="flex flex-col items-center gap-1.5 focus:outline-none touch-manipulation group flex-shrink-0"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-100 hover:text-amber-700 shadow-sm transition-all duration-200">
                    <span className="text-xl select-none">🪙</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-500 group-hover:text-amber-600 transition-colors uppercase tracking-wider">
                    Tip
                  </span>
                </button>
              )}
            </div>
            {/* Dynamic Accent Line */}
            <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] transition-all duration-300 ${
              tab === 'overview' ? 'bg-blue-600 shadow-[0_1px_8px_rgba(37,99,235,0.4)]' :
              tab === 'posts' ? 'bg-purple-600 shadow-[0_1px_8px_rgba(147,51,234,0.4)]' :
              tab === 'trust' ? 'bg-emerald-600 shadow-[0_1px_8px_rgba(5,150,105,0.4)]' :
              tab === 'saved' ? 'bg-rose-500 shadow-[0_1px_8px_rgba(244,63,94,0.4)]' :
              tab === 'economy' ? 'bg-amber-500 shadow-[0_1px_8px_rgba(245,158,11,0.4)]' :
              tab === 'street_radar' ? 'bg-teal-600 shadow-[0_1px_8px_rgba(13,148,136,0.4)]' :
              'bg-orange-500 shadow-[0_1px_8px_rgba(249,115,22,0.4)]'
            }`} />
          </div>

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
          <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] border-t border-gray-100 mt-4 pt-4 px-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <ProfileBrowseEyebrow>Community Trust</ProfileBrowseEyebrow>
                  {!vouchStatus?.hasVouched && (
                    vouchStatus?.locationRequired ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-bold text-gray-400">
                        <span className="material-symbols-outlined text-[11px]">location_off</span>
                        Location needed
                      </span>
                    ) : vouchStatus?.withinRange === true ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                        <span className="material-symbols-outlined text-[11px]">my_location</span>
                        {vouchStatus.distanceMeters}m away ✓
                      </span>
                    ) : vouchStatus?.withinRange === false ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600">
                        <span className="material-symbols-outlined text-[11px]">location_off</span>
                        {vouchStatus.distanceMeters != null ? `${vouchStatus.distanceMeters}m away` : 'Too far'} — 500m limit
                      </span>
                    ) : null
                  )}
                </div>
                <p className="text-base font-extrabold text-gray-800 leading-tight">
                  {(vouchStatus?.vouchCount ?? 0) > 0
                    ? `${vouchStatus!.vouchCount} NeyborH${vouchStatus!.vouchCount === 1 ? '' : 's'} vouch for @${profile.username}`
                    : `@${profile.username} has no vouches yet`}
                </p>
                <p className="text-[13px] font-medium text-gray-500 mt-1 leading-relaxed">
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
              <div className="flex shrink-0 flex-col gap-2 mt-1">
                {vouchStatus?.hasVouched ? (
                  <button
                    onClick={() => revokeMutation.mutate()}
                    disabled={isVouchPending}
                    className="inline-flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition shadow-sm"
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
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-bold hover:bg-slate-800 transition shadow-sm"
                    type="button"
                  >
                    {isVouchPending ? '…' : '🤜 Vouch'}
                  </button>
                )}
                {!isBlockedByThem && (
                  <button
                    onClick={() => toggleBlock()}
                    disabled={isBlockPending}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-500 shadow-sm"
                    type="button"
                  >
                    {isBlocked ? 'Unblock' : 'Block'}
                  </button>
                )}
              </div>
            </div>
            {(vouchStatus?.vouchesNeeded ?? 0) > 0 && !vouchStatus?.hasVouched && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-gray-400">
                  <span>Progress to Tree 🌳 tier</span>
                  <span>{vouchStatus?.vouchCount ?? 0} / 3 vouches</span>
                </div>
                <progress
                  className="h-1.5 w-full overflow-hidden rounded-full accent-blue-600 bg-gray-100"
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

        <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] border-t border-slate-100 mt-4 pt-4">
          <div className="px-3">
            <div className="flex items-start justify-between gap-3">
              <ProfileBrowseEyebrow>About this NeyburH</ProfileBrowseEyebrow>
              {isOwnProfile ? (
                <Link href="/settings" className="text-xs font-bold text-blue-600 no-underline hover:underline">
                  Edit bio
                </Link>
              ) : null}
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-gray-600 font-medium">
              {profile.bio || `${displayName} is part of the ${locationLabel || 'NeyborHuud'} community.`}
            </p>
          </div>
        </div>

        {(showHandleHistory || (!isOwnProfile && (followsYou || isMutual))) && (
          <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] border-t border-slate-100 mt-4 pt-4">
            <div className="px-3 flex flex-col gap-4">
              {showHandleHistory ? (
                <div>
                  <div className="pb-2">
                    <ProfileBrowseEyebrow>Handle history</ProfileBrowseEyebrow>
                  </div>
                  {renameAudit.length > 0 ? (
                    <ul className="space-y-2 text-xs text-gray-700">
                      {renameAudit.map((row, idx) => (
                        <li key={`${row.previousUsername}-${row.newUsername}-${idx}`} className="font-semibold">
                          <span className="font-mono text-emerald-600">@{row.previousUsername}</span>
                          {' → '}
                          <span className="font-mono text-slate-800">@{row.newUsername}</span>
                          {row.changedAt ? (
                            <span className="block text-[10px] text-gray-400 font-normal mt-0.5">
                              {new Date(row.changedAt).toLocaleString()}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : hist.usernameTimeline && hist.usernameTimeline.length > 0 ? (
                    <ul className="space-y-2 text-xs text-gray-700">
                      {hist.usernameTimeline.map((row, idx) => (
                        <li key={`${row.username}-${idx}`} className="font-semibold">
                          <span className="font-mono text-slate-800">@{row.username}</span>
                          <span className="block text-[10px] text-gray-400 font-normal mt-0.5">
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
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1.5 text-xs font-bold text-blue-600">
                      <span className="material-symbols-outlined text-[14px]">link</span>
                      Mutual follow
                    </span>
                  ) : followsYou ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600">
                      <span className="material-symbols-outlined text-[14px]">person_check</span>
                      Follows you
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
            </>
          )}


          {tab === 'trust' && (
            <div className="flex flex-col">
              {/* TrustOS Info */}
              <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] py-6 px-3">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <ProfileBrowseEyebrow>TrustOS</ProfileBrowseEyebrow>
                  <span className="material-symbols-outlined text-[20px] text-blue-600">verified_user</span>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <p className="text-5xl font-black tracking-tight text-gray-900 leading-none tabular-nums">{trustScore}</p>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">NeyburH Score</p>
                    <p className="text-[13px] font-semibold text-gray-600 mt-0.5">
                      {profileTrustTier.icon} {profileTrustTier.label}
                      {nextTrustTier ? ` · ${Math.max(0, nextTrustTier.minScore - trustScore)} pts to ${nextTrustTier.label}` : ' · Top tier reached'}
                    </p>
                  </div>
                </div>
                {profilePrivileges.marketplaceBadge && (
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${profilePrivileges.marketplaceBadgeColor}`}>
                      {profileTrustTier.icon} {profilePrivileges.marketplaceBadge}
                    </span>
                  </div>
                )}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-gray-400">
                    <span>Community trust</span>
                    <span>{scorePercent}%</span>
                  </div>
                  <progress
                    className="h-2 w-full overflow-hidden rounded-full accent-blue-600 bg-gray-100"
                    value={scorePercent}
                    max={100}
                    aria-label="Community trust progress"
                  />
                </div>

                {/* Voucher list */}
                {voucherList.length > 0 && (
                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-3">
                      Vouched by
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {voucherList.slice(0, 5).map((v) => (
                        <button
                          key={v.id}
                          onClick={() => router.push(`/profile/${v.voucherUsername}`)}
                          className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/50 px-3 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 hover:shadow-sm"
                          type="button"
                          title={`View @${v.voucherUsername}`}
                        >
                          {v.voucherAvatar ? (
                            <img src={v.voucherAvatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-200/50 text-[10px] font-bold text-emerald-700">
                              {v.voucherUsername[0]?.toUpperCase()}
                            </span>
                          )}
                          @{v.voucherUsername}
                        </button>
                      ))}
                      {voucherList.length > 5 && (
                        <span className="flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-500">
                          +{voucherList.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tier Privileges mini-list */}
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <ProfileBrowseEyebrow>Tier Abilities</ProfileBrowseEyebrow>
                  <div className="space-y-2 mt-3">
                    {profilePrivileges.privilegeList.slice(0, 4).map((p) => (
                      <div key={p.label} className={`flex items-center gap-2 text-xs font-semibold ${p.unlocked ? 'text-gray-700' : 'text-gray-400'}`}>
                        <span className={`material-symbols-outlined text-[15px] ${p.unlocked ? 'text-blue-500' : 'text-gray-300'}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          {p.unlocked ? 'check_circle' : 'cancel'}
                        </span>
                        {p.label}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] font-medium text-gray-400 leading-normal">{profilePrivileges.summary}</p>
                </div>

                {/* Trust Activity preview (latest 3) */}
                {trustRecentEvents.length > 0 && (
                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <ProfileBrowseEyebrow>Recent Trust Events</ProfileBrowseEyebrow>
                    <div className="space-y-2.5 mt-3">
                      {trustRecentEvents.slice(0, 3).map((event) => {
                        const meta = TRUST_EVENT_META[event.eventType as keyof typeof TRUST_EVENT_META] ?? {
                          label: event.eventType,
                          icon: 'info',
                          positive: event.pointsChange >= 0,
                        };
                        const isPos = meta.positive && event.pointsChange >= 0;
                        return (
                          <div key={event.id} className="flex items-center gap-2 text-xs font-semibold">
                            <span className={`material-symbols-outlined text-[15px] ${isPos ? 'text-emerald-500' : 'text-red-500'}`}
                              style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                            <span className="min-w-0 flex-1 truncate text-gray-700">{meta.label}</span>
                            <span className={`shrink-0 font-extrabold tabular-nums ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
                              {isPos ? '+' : ''}{event.pointsChange}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Snapshot */}
              <div className="border-t border-slate-100 mt-4 pt-4">
                <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3">
                  <div className="pb-3">
                    <ProfileBrowseEyebrow>Profile Snapshot</ProfileBrowseEyebrow>
                  </div>
                  <div className="space-y-2.5">
                    {profileFacts.map((fact) => (
                      <div key={`side-${fact.label}`} className="flex items-center gap-3 bg-gray-50/60 border border-gray-100/50 rounded-2xl px-4 py-3 hover:bg-gray-50 transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-blue-500">{fact.icon}</span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{fact.label}</p>
                          <p className="text-sm font-extrabold text-gray-800 capitalize mt-0.5">{fact.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verification Journey */}
              <div className="border-t border-slate-100 mt-4 pt-4">
                <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3">
                  <div className="pb-2">
                    <ProfileBrowseEyebrow>Verification Journey</ProfileBrowseEyebrow>
                  </div>
                  <p className="text-[14px] font-extrabold text-gray-800 leading-tight">
                    {verificationProgress.tier === 'none'
                      ? 'Start earning your neighbour verification tiers'
                      : `${verificationTierMeta.emoji} ${verificationTierMeta.label} · ${verificationTierMeta.description}`}
                  </p>
                  {verificationProgress.nextTier ? (
                    <p className="text-xs font-semibold text-gray-400 mt-1">
                      Next: {getVerificationTierMeta(verificationProgress.nextTier).label} ·{' '}
                      {verificationProgress.percentToNext}% overall progress
                    </p>
                  ) : null}
                  <div className="mt-4 space-y-2.5">
                    {verificationProgress.axes.map((axis) => (
                      <div key={axis.id} className="flex items-center gap-3 bg-gray-50/60 border border-gray-100/50 rounded-2xl px-4 py-3 hover:bg-gray-50 transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-blue-500">
                          {axis.done ? 'check_circle' : 'pending'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {axis.label}
                          </p>
                          <p className="text-sm font-extrabold text-gray-800 mt-0.5">
                            {axis.detail}
                          </p>
                        </div>
                        <span className="text-xs font-bold tabular-nums text-blue-600">{axis.percent}%</span>
                      </div>
                    ))}
                  </div>
                  {verificationProgress.blockers.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-blue-100/50 bg-blue-50/30 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Next steps</p>
                      <ul className="mt-1.5 space-y-1.5 text-xs font-semibold text-gray-500">
                        {verificationProgress.blockers.slice(0, 4).map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="border-t border-slate-100 mt-4 pt-4">
                <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3">
                  <div className="pb-3">
                    <ProfileBrowseEyebrow>Verification checklist</ProfileBrowseEyebrow>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Email verified', done: Boolean((profile as { emailVerified?: boolean }).emailVerified || profile.verificationStatus === 'verified') },
                      { label: 'Profile ready (photo + bio)', done: Boolean(profile.firstName && profile.lastName && (profile.avatarUrl || profile.profilePicture) && (profile.bio?.trim().length ?? 0) >= 10) },
                      { label: 'Community joined', done: !!profile.assignedCommunityId },
                      { label: 'Location pinned', done: !!profile.location?.latitude },
                      { label: 'Gold trust earned', done: profileCommunityVerified },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 bg-gray-50/60 border border-gray-100/50 rounded-2xl px-4 py-3 hover:bg-gray-50 transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-blue-500">{item.done ? 'check_circle' : 'pending'}</span>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Status</p>
                          <p className="text-sm font-extrabold text-gray-800 mt-0.5">{item.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Badges Credibility */}
              <div className="border-t border-slate-100 mt-4 pt-4">
                <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <ProfileBrowseEyebrow>Badges</ProfileBrowseEyebrow>
                      <ProfileBrowseSectionTitle>NeyborHuud credibility</ProfileBrowseSectionTitle>
                    </div>
                    <Link
                      href={isOwnProfile ? '/huud-economy/score?tab=badges' : '/huud-economy/score'}
                      className="inline-flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200/50 px-4 py-2 text-xs font-bold text-gray-700 transition"
                    >
                      View all
                    </Link>
                  </div>

                  {isOwnProfile ? (
                    myBadges.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {myBadges.slice(0, 4).map((badge: any, i: number) => (
                          <div key={badge.id ?? badge._id ?? i} className="flex flex-col justify-between bg-gray-50/50 hover:bg-gray-50/80 border border-gray-100/50 rounded-2xl p-4 transition-all duration-200 min-h-[120px]">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-blue-600 shadow-sm">
                              <span className="material-symbols-outlined text-[21px]">{badge.icon ?? 'military_tech'}</span>
                            </div>
                            <div className="mt-3">
                              <p className="text-sm font-extrabold text-gray-800 leading-tight">{badge.name ?? badge.title ?? 'Badge'}</p>
                              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">{badge.tier ?? badge.category ?? 'Earned'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <BrowseEmptyState
                        icon="military_tech"
                        title="No badges earned yet"
                        action={
                          <Link href="/huud-economy" className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-5 py-2 text-xs font-bold hover:bg-slate-800 transition no-underline">
                            Earn your first badge
                          </Link>
                        }
                      />
                    )
                  ) : (() => {
                    const publicBadges: any[] = (() => {
                      const b = profile.gamification?.badges;
                      return Array.isArray(b) ? b : [];
                    })();
                    const rarityTone: Record<string, string> = {
                      common:    'bg-slate-50    text-slate-600  ring-slate-100',
                      uncommon:  'bg-emerald-50  text-emerald-700 ring-emerald-100',
                      rare:      'bg-sky-50      text-sky-700    ring-sky-100',
                      epic:      'bg-indigo-50   text-indigo-700 ring-indigo-100',
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
                            <div key={badge.id ?? badge._id ?? i} className="flex flex-col justify-between bg-gray-50/50 hover:bg-gray-50/80 border border-gray-100/50 rounded-2xl p-4 transition-all duration-200 min-h-[120px]">
                              <div className={`flex h-11 w-11 items-center justify-center rounded-full ring-1 ${tone}`}>
                                <span className="material-symbols-outlined text-[21px]">{badge.icon ?? 'military_tech'}</span>
                              </div>
                              <div className="mt-3">
                                <p className="text-sm font-extrabold text-gray-800 leading-tight">{badge.name ?? badge.title ?? 'Badge'}</p>
                                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                  {badge.rarity ?? badge.tier ?? badge.category ?? 'Earned'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {tab === 'listings' && (
            <div className="flex flex-col">
              {listingsLoading ? (
                <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3 py-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 animate-pulse bg-gray-50 border border-gray-100/80 rounded-2xl" />
                  ))}
                </div>
              ) : null}

              {!listingsLoading && isOwnProfile && (
                <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3 py-5">
                  <div className="pb-3">
                    <ProfileBrowseEyebrow>Your HuudCoins activity</ProfileBrowseEyebrow>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/huud-economy/score"
                      className="flex items-center gap-3.5 border border-gray-100 bg-gray-50/30 rounded-2xl p-4 no-underline transition-all hover:bg-gray-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-blue-600">
                        <span className="material-symbols-outlined text-[20px]">emoji_events</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-gray-800">Gamification Hub</p>
                        <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Badges · Leaderboard</p>
                      </div>
                    </Link>
                    <Link
                      href="/huud-economy/wallet"
                      className="flex items-center gap-3.5 border border-gray-100 bg-gray-50/30 rounded-2xl p-4 no-underline transition-all hover:bg-gray-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-blue-600">
                        <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-gray-800">HuudCoins Wallet</p>
                        <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Balance · History</p>
                      </div>
                    </Link>
                  </div>
                </div>
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
                      <Link href="/jobs" className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-4.5 py-2 text-xs font-bold hover:bg-slate-800 transition no-underline">Post a job</Link>
                      <Link href="/events" className="inline-flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 px-4.5 py-2 text-xs font-bold transition no-underline">Create event</Link>
                      <Link href="/marketplace/sell" className="inline-flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 px-4.5 py-2 text-xs font-bold transition no-underline">Sell item</Link>
                    </div>
                  }
                />
              )}

              {userJobs.length > 0 && (
                <div className="border-t border-slate-100 mt-4 pt-4">
                  <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <ProfileBrowseEyebrow>Jobs</ProfileBrowseEyebrow>
                        <ProfileBrowseSectionTitle>Posted by {isOwnProfile ? 'you' : displayName}</ProfileBrowseSectionTitle>
                      </div>
                      <Link href={userId ? `/jobs?employerId=${userId}` : '/jobs'} className="text-xs font-bold text-blue-600 no-underline hover:underline">See all</Link>
                    </div>
                    <div className="space-y-2.5">
                      {userJobs.map((job: any, i: number) => (
                        <Link
                          key={job.id ?? job._id ?? i}
                          href={`/jobs/${job.id ?? job._id}`}
                          className="flex items-start gap-3.5 border-b border-slate-100 py-3.5 no-underline transition-all hover:opacity-85"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-blue-600">
                            <span className="material-symbols-outlined text-[19px]">work</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold text-gray-800">{job.title ?? 'Job listing'}</p>
                            <p className="text-xs font-semibold text-gray-400 mt-1">
                              {job.type?.replace('-', ' ')} · {job.workMode ?? '—'} · {job.location?.lga ?? job.location?.state ?? ''}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${job.status === 'open' ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-gray-50 border border-gray-100 text-gray-400'}`}>
                            {job.status ?? 'open'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {userEvents.length > 0 && (
                <div className="border-t border-slate-100 mt-4 pt-4">
                  <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <ProfileBrowseEyebrow>Events</ProfileBrowseEyebrow>
                        <ProfileBrowseSectionTitle>Organised by {isOwnProfile ? 'you' : displayName}</ProfileBrowseSectionTitle>
                      </div>
                      <Link href={userId ? `/events?organizerId=${userId}` : '/events'} className="text-xs font-bold text-blue-600 no-underline hover:underline">See all</Link>
                    </div>
                    <div className="space-y-2.5">
                      {userEvents.map((event: any, i: number) => (
                        <Link
                          key={event.id ?? event._id ?? i}
                          href={`/events/${event.id ?? event._id}`}
                          className="flex items-start gap-3.5 border-b border-slate-100 py-3.5 no-underline transition-all hover:opacity-85"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-purple-600">
                            <span className="material-symbols-outlined text-[19px]">event</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold text-gray-800">{event.title ?? 'Event'}</p>
                            <p className="text-xs font-semibold text-gray-400 mt-1">
                              {event.date ? new Date(event.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBC'}
                              {event.location?.lga ? ` · ${event.location.lga}` : ''}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-bold text-gray-400 mt-1">{event.attendees ?? 0} going</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {userServices.length > 0 && (
                <div className="border-t border-slate-100 mt-4 pt-4">
                  <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <ProfileBrowseEyebrow>Services</ProfileBrowseEyebrow>
                        <ProfileBrowseSectionTitle>{isOwnProfile ? 'Your' : `${displayName}'s`} service offerings</ProfileBrowseSectionTitle>
                      </div>
                      <Link href={userId ? `/services?providerId=${userId}` : '/services'} className="text-xs font-bold text-blue-600 no-underline hover:underline">See all</Link>
                    </div>
                    <div className="space-y-2.5">
                      {userServices.map((service: any, i: number) => (
                        <Link
                          key={service.id ?? service._id ?? i}
                          href={`/services/${service.id ?? service._id}`}
                          className="flex items-start gap-3.5 border-b border-slate-100 py-3.5 no-underline transition-all hover:opacity-85"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-teal-600">
                            <span className="material-symbols-outlined text-[19px]">home_repair_service</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold text-gray-800">{service.title ?? 'Service'}</p>
                            <p className="text-xs font-semibold text-gray-400 mt-1 capitalize">
                              {service.category ?? '—'}
                              {service.pricing?.amount ? ` · ₦${Number(service.pricing.amount).toLocaleString()}` : service.pricing?.type === 'custom' ? ' · Custom price' : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-blue-600 mt-1">
                            <span className="material-symbols-outlined text-[14px]">star</span>
                            {service.rating ? service.rating.toFixed(1) : 'New'}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {userMarketplace.length > 0 && (
                <div className="border-t border-slate-100 mt-4 pt-4">
                  <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <ProfileBrowseEyebrow>Marketplace</ProfileBrowseEyebrow>
                        <ProfileBrowseSectionTitle>{isOwnProfile ? 'Your' : `${displayName}'s`} listings</ProfileBrowseSectionTitle>
                      </div>
                      <Link href={userId ? `/marketplace?sellerId=${userId}` : '/marketplace'} className="text-xs font-bold text-blue-600 no-underline hover:underline">See all</Link>
                    </div>
                    <div className="space-y-2.5">
                      {userMarketplace.map((item: any, i: number) => (
                        <Link
                          key={item.id ?? item._id ?? i}
                          href={`/marketplace/${item.id ?? item._id}`}
                          className="flex items-start gap-3.5 border-b border-slate-100 py-3.5 no-underline transition-all hover:opacity-85"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-emerald-600">
                            <span className="material-symbols-outlined text-[19px]">storefront</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold text-gray-800">{item.title ?? 'Listing'}</p>
                            <p className="text-xs font-semibold text-gray-400 mt-1">
                              {item.category ?? 'Item'}
                              {item.price != null ? ` · ₦${Number(item.price).toLocaleString()}` : ''}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-bold capitalize text-blue-600 mt-1">
                            {item.condition ?? 'listed'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {tab === 'posts' && (
            <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3 py-5">
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
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-5 py-2 text-xs font-bold hover:bg-slate-800 transition"
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
                          className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-5 py-2 text-xs font-bold hover:bg-slate-800 transition"
                        >
                          Create your first post
                        </button>
                      ) : undefined
                    }
                  />
                )}

                {!isLoadingPosts && !isErrorPosts && posts.length > 0 && (
                  <div className="space-y-4">
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
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                            <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
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
            </div>
          )}

          {tab === 'saved' && (
            <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3 py-5 flex flex-col items-center justify-center gap-4 min-h-[200px]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 border border-rose-100 text-rose-500">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-extrabold text-slate-800">Your Saved Posts</p>
                <p className="text-[13px] font-medium text-slate-400 mt-1">Posts and content you have bookmarked</p>
              </div>
              <Link
                href="/saved"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 px-6 py-2.5 text-sm font-bold transition no-underline"
              >
                <span className="material-symbols-outlined text-[16px]">bookmark</span>
                Open Saved
              </Link>
            </div>
          )}

          {tab === 'economy' && (
            <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3 py-5 flex flex-col items-center justify-center gap-4 min-h-[200px]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-100 text-amber-500">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-extrabold text-slate-800">Huud Economy</p>
                <p className="text-[13px] font-medium text-slate-400 mt-1">Your HuudCoins, wallet, badges and gamification stats</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/huud-economy/wallet"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 text-white hover:bg-amber-600 px-5 py-2.5 text-sm font-bold transition no-underline"
                >
                  <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                  Wallet
                </Link>
                <Link
                  href="/huud-economy/score"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 px-5 py-2.5 text-sm font-bold transition no-underline"
                >
                  <span className="material-symbols-outlined text-[16px]">military_tech</span>
                  Badges
                </Link>
              </div>
            </div>
          )}

          {tab === 'street_radar' && (
            <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] px-3 py-5 flex flex-col items-center justify-center gap-4 min-h-[200px]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 border border-teal-100 text-teal-600">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-extrabold text-slate-800">Street Radar</p>
                <p className="text-[13px] font-medium text-slate-400 mt-1">Trending posts and local news in your Huud</p>
              </div>
              <Link
                href="/neighborhood?tab=street-radar"
                className="inline-flex items-center gap-2 rounded-full bg-teal-600 text-white hover:bg-teal-700 px-6 py-2.5 text-sm font-bold transition no-underline"
              >
                <span className="material-symbols-outlined text-[16px]">radar</span>
                Open Street Radar
              </Link>
            </div>
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
          </div>
        </div>
        <BottomNav />
      </div>

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
