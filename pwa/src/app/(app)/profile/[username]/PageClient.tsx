/**
 * Public User Profile Page
 * Route: /profile/:username
 * Shows user profile information including avatar, name, username, and bio
 */

'use client';

import { AvatarDuo } from '@/components/avatar/AvatarDuo';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { ProfileBrowseEyebrow, ProfileBrowseSectionTitle } from '@/components/profile/browse/ProfileBrowseSectionTitle';
import { ProfileRecognition } from '@/components/profile/ProfileRecognition';
import { ProfileSnapFriends } from '@/components/profile/snap/ProfileSnapFriends';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { AvatarAdjusterModal } from '@/components/profile/AvatarAdjusterModal';
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
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-handler';
import { fromKobo } from '@/lib/currency';
import { ErrorState } from '@/components/ui/ErrorState';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';

type ProfileTab = 'posts' | 'listings' | 'trust' | 'about';

const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'listings', label: 'Listings' },
  { id: 'trust', label: 'Trust' },
  { id: 'about', label: 'About' },
];


function parseProfileTab(value: string | null): ProfileTab {
  if (value === 'listings' || value === 'trust' || value === 'about') return value;
  return 'posts';
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
    refetch,
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

  const handleVouchClick = () => {
    if (vouchStatus?.hasVouched) {
      revokeMutation.mutate();
      return;
    }
    if (vouchStatus?.canVouch === false) {
      toast.error('You need Tree 🌳 tier (300+ NeyburH Score) to vouch for others', {
        description: 'Keep contributing, completing jobs, and getting verified to level up.',
      });
      return;
    }
    if (vouchStatus?.locationRequired) {
      toast.error('Verified address required to vouch', {
        description: 'Both you and this NeyborH need a verified home address. Verify yours in Settings → Location.',
      });
      return;
    }
    if (vouchStatus?.withinRange === false) {
      toast.error('You live too far apart — vouching requires homes within 500m', {
        description: 'NeyborHuud is hyperlocal. You can only vouch for genuine neighbours nearby.',
      });
      return;
    }
    vouchMutation.mutate();
  };

  const [startingChat, setStartingChat] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const tipUser = useTipUser();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const next = parseProfileTab(new URLSearchParams(window.location.search).get('tab'));
    setTab(next);
  }, [username]);

  const changeTab = (next: ProfileTab) => {
    setTab(next);
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (next === 'posts') params.delete('tab');
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
      <div className="flex h-[100dvh] w-full flex-col doodle-surface overflow-hidden">
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

  // Error state.
  // Only a real 404 means "no such user" — a 429/5xx/network drop must not be
  // reported as a missing account, or an outage looks like a deleted profile.
  if (error || !profile) {
    const err = error as
      | { status?: number; statusCode?: number; response?: { status?: number } }
      | null;
    const status = err?.response?.status ?? err?.status ?? err?.statusCode;
    const isMissing = !error || status === 404;
    const isRateLimited = status === 429;

    return (
      <div className="flex h-[100dvh] w-full flex-col doodle-surface overflow-hidden">
        <TopNav />
        <div className="app-chrome-below-topnav mx-auto w-full max-w-[600px] !bg-white flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar pb-24 !mt-0 !pt-0 flex items-center justify-center">
            <BrowseEmptyState
              icon={isMissing ? 'person_off' : 'cloud_off'}
              title={
                isMissing
                  ? 'User not found'
                  : isRateLimited
                    ? 'Too many requests'
                    : "Couldn't load this profile"
              }
              description={
                isMissing
                  ? `The user @${username} doesn't exist or their profile is unavailable.`
                  : isRateLimited
                    ? 'You have made a lot of requests in a short time. Wait a moment and try again.'
                    : 'Something went wrong reaching NeyborHuud. Check your connection and try again.'
              }
              className="!border-0 !shadow-none !bg-white"
              action={
                isMissing ? (
                  <Link
                    href="/explore"
                    className="inline-flex items-center justify-center rounded-full bg-primary text-white hover:bg-brand-green-dark px-6 py-2 text-xs font-bold shadow-sm transition"
                  >
                    Explore NeyborHuud
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="inline-flex items-center justify-center rounded-full bg-primary text-white hover:bg-brand-green-dark px-6 py-2 text-xs font-bold shadow-sm transition"
                  >
                    Try again
                  </button>
                )
              }
            />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Merge name fields — profile payload wins, then auth session/cache
  // Your own account fills gaps only on YOUR profile (it used to lend your last name to others).
  const selfSrc = isOwnProfile ? (currentUser as ProfileNameSource | null) : null;
  const cacheSrc = isOwnProfile ? (cachedProfileUser as ProfileNameSource | null) : null;
  const profileNameSource: ProfileNameSource = {
    ...cacheSrc,
    ...selfSrc,
    ...(profile as ProfileNameSource),
    username: profile?.username ?? selfSrc?.username ?? cacheSrc?.username ?? username,
    firstName: profile?.firstName ?? selfSrc?.firstName ?? cacheSrc?.firstName,
    lastName: profile?.lastName ?? selfSrc?.lastName ?? cacheSrc?.lastName,
    middleName: profile?.middleName ?? selfSrc?.middleName ?? cacheSrc?.middleName,
    name:
      (profile as ProfileNameSource)?.name ??
      selfSrc?.name ??
      cacheSrc?.name,
    fullName:
      (profile as ProfileNameSource)?.fullName ??
      selfSrc?.fullName ??
      cacheSrc?.fullName,
    full_name:
      (profile as ProfileNameSource)?.full_name ??
      selfSrc?.full_name ??
      cacheSrc?.full_name,
    displayName:
      (profile as ProfileNameSource)?.displayName ??
      selfSrc?.displayName ??
      cacheSrc?.displayName,
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

      <div className="flex h-[100dvh] w-full flex-col doodle-surface overflow-hidden">
        <TopNav />

        <div className="app-chrome-below-topnav mx-auto w-full max-w-[600px] flex flex-col flex-1 overflow-y-auto">
          <div className="flex-1 no-scrollbar pb-24 !mt-0 !pt-0">
            <div className="flex flex-col">
          {/* ── Header card (rebuilt 2026-11-26): who this is, their numbers, and the main buttons.
               No map of where they live (privacy). ── */}
          <section className="mx-3 mt-3 rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="grid h-[76px] w-[76px] place-items-center overflow-hidden rounded-full bg-green-soft ring-4 ring-white shadow-[0_2px_10px_rgba(29,36,51,0.12)]">
                  {profileAvatarSrc ? (
                    <Image src={profileAvatarSrc} alt="" width={76} height={76} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-heading text-3xl font-black text-brand-green-dark">{profileInitial}</span>
                  )}
                </div>
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    aria-label="Change photo"
                    className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-navy text-white ring-2 ring-white disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden>photo_camera</span>
                  </button>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="flex items-center gap-1 font-heading text-xl font-extrabold leading-tight text-navy">
                  <span className="truncate">{displayName}</span>
                  {profileCommunityVerified ? (
                    <span className="material-symbols-outlined shrink-0 text-[19px] text-brand-green-dark" style={{ fontVariationSettings: "'FILL' 1" }} aria-label="Verified neighbour">verified</span>
                  ) : null}
                </h1>
                <p className="truncate text-[13px] text-muted">@{profile.username}</p>
                <p className="mt-0.5 truncate text-[13px] text-muted">
                  {[locationLabel, `Joined ${joinedLabel}`].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>

            {(profile as { restricted?: boolean }).restricted ? null : profile.bio ? (
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-navy">{profile.bio}</p>
            ) : isOwnProfile ? (
              <Link href="/settings/profile" className="mt-3 inline-block text-[14px] font-bold text-brand-green-dark">
                + Add a line about you
              </Link>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {(profile.gamification as { standing?: { emoji?: string; name?: string } } | undefined)?.standing?.name ? (
                <Chip tone="green">
                  {(profile.gamification as { standing?: { emoji?: string } }).standing?.emoji}{' '}
                  {(profile.gamification as { standing?: { name?: string } }).standing?.name}
                </Chip>
              ) : null}
              {verificationProgress.tier !== 'none' ? <Chip tone="blue">{verificationTierMeta.emoji} {verificationTierMeta.label}</Chip> : null}
              {!isOwnProfile && isMutual ? <Chip>Friends</Chip> : !isOwnProfile && followsYou ? <Chip>Follows you</Chip> : null}
            </div>

            <dl className="mt-4 grid grid-cols-4 divide-x divide-line/70 rounded-2xl bg-background py-2.5 text-center">
              {[
                { label: 'Followers', value: followerCount, href: `/profile/${profile.username}/followers` },
                { label: 'Following', value: followingCount, href: `/profile/${profile.username}/following` },
                { label: 'Vouches', value: vouchMetrics?.received ?? vouchStatus?.vouchCount ?? 0, tab: 'trust' as ProfileTab },
                { label: 'Trust', value: trustScore, tab: 'trust' as ProfileTab },
              ].map((s) => {
                const inner = (
                  <>
                    <dd className="font-heading text-lg font-black tabular-nums text-navy">{Number(s.value).toLocaleString()}</dd>
                    <dt className="text-[12px] font-semibold text-muted">{s.label}</dt>
                  </>
                );
                return (
                  <div key={s.label} className="flex flex-col-reverse">
                    {'href' in s && s.href ? (
                      <Link href={s.href} prefetch={false} className="flex flex-col-reverse rounded-xl hover:bg-white/60">
                        {inner}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => changeTab(s.tab!)} className="flex flex-col-reverse rounded-xl hover:bg-white/60">
                        {inner}
                      </button>
                    )}
                  </div>
                );
              })}
            </dl>

            <div className="mt-4 flex gap-2">
              {isOwnProfile ? (
                <>
                  <Link href="/settings/profile" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-navy text-[15px] font-bold text-white">
                    Edit profile
                  </Link>
                  <button type="button" onClick={() => void handleShareProfile()} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-white text-[15px] font-bold text-navy ring-1 ring-inset ring-line hover:bg-[#F6F8FB]">
                    Share
                  </button>
                </>
              ) : isBlocked ? (
                <button type="button" onClick={() => toggleBlock()} disabled={isBlockPending} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-red-soft text-[15px] font-bold text-brand-red">
                  {isBlockPending ? 'Unblocking…' : 'Unblock'}
                </button>
              ) : isBlockedByThem ? (
                <p className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-background text-[14px] font-bold text-muted">You can't follow or message this person</p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={toggleFollow}
                    disabled={isFollowPending || isLoadingStatus || !currentUser}
                    className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full text-[15px] font-bold transition-colors disabled:opacity-60 ${
                      isFollowing ? 'bg-white text-navy ring-1 ring-inset ring-line' : 'bg-primary text-white hover:bg-brand-green-dark'
                    }`}
                  >
                    {isFollowing ? 'Following' : followsYou ? 'Follow back' : 'Follow'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleStartChat()}
                    disabled={startingChat || !currentUser}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-white text-[15px] font-bold text-navy ring-1 ring-inset ring-line hover:bg-[#F6F8FB] disabled:opacity-60"
                  >
                    {startingChat ? 'Opening…' : 'Message'}
                  </button>
                </>
              )}
              {!isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  aria-label="More: vouch, tip, share, block or report"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-navy ring-1 ring-inset ring-line hover:bg-[#F6F8FB]"
                >
                  <span className="material-symbols-outlined text-[22px]" aria-hidden>more_horiz</span>
                </button>
              ) : null}
            </div>
          </section>

          {isOwnProfile ? (
            <nav aria-label="Your things" className="no-scrollbar mx-3 mt-3 flex gap-2 overflow-x-auto">
              {[
                { href: '/huud-economy/wallet', label: `🪙 ${Number(huudCoins).toLocaleString()} HuudCredit` },
                { href: '/saved', label: '🔖 Saved' },
                { href: '/huud-economy/score', label: '🏅 Badges' },
                { href: '/profile/passport', label: '🪪 Passport' },
                { href: '/avatar', label: '🧍 3D avatar' },
              ].map((l) => (
                <Link key={l.href} href={l.href} prefetch={false} className="tap-target inline-flex h-9 shrink-0 items-center rounded-full bg-white px-3.5 text-[13px] font-bold text-navy ring-1 ring-inset ring-line hover:bg-[#F6F8FB]">
                  {l.label}
                </Link>
              ))}
            </nav>
          ) : null}

          {(profile as { restricted?: boolean }).restricted ? (
            <div className="mx-3 mt-3">
              <EmptyState icon="🔒" title="This profile is private" description="Only their name and photo show. Follow each other to see more if they share with friends." />
            </div>
          ) : (
          <>
          <div className="mx-3 mt-2">
            <BrowseTabStrip tabs={PROFILE_TABS} activeId={tab} onChange={(id) => changeTab(id as ProfileTab)} />
          </div>

          {tab === 'about' && (
            <div className="flex flex-col gap-3 px-3 py-3">
              <section className="rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
                <h2 className="font-heading text-base font-extrabold text-navy">About</h2>
                <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-navy">
                  {profile.bio || `${displayName} is part of the ${locationLabel || 'NeyborHuud'} community.`}
                </p>
                <dl className="mt-3 space-y-2">
                  {[
                    locationLabel ? { icon: 'location_on', label: 'Area', value: locationLabel } : null,
                    { icon: 'calendar_month', label: 'Joined', value: joinedLabel },
                    { icon: profileCommunityVerified ? 'verified' : 'shield', label: 'Verification', value: verificationProgress.tier === 'none' ? 'Not started' : `${verificationTierMeta.emoji} ${verificationTierMeta.label}` },
                  ].filter(Boolean).map((f) => (
                    <div key={f!.label} className="flex items-center gap-2 text-[14px]">
                      <span className="material-symbols-outlined text-[18px] text-brand-green-dark" aria-hidden>{f!.icon}</span>
                      <dt className="text-muted">{f!.label}</dt>
                      <dd className="font-bold text-navy">{f!.value}</dd>
                    </div>
                  ))}
                </dl>
                {showHandleHistory && hist.usernameTimeline && hist.usernameTimeline.length > 1 ? (
                  <p className="mt-3 text-[13px] text-muted">
                    Also known as {hist.usernameTimeline.filter((r) => r.username !== profile.username).map((r) => `@${r.username}`).join(', ')}
                  </p>
                ) : null}
              </section>

              {!isOwnProfile && shouldEnableFollow && !isBlocked && !isBlockedByThem && profile?.id && !isLoadingStatus ? (
                <AvatarDuo userId={String(profile.id)} name={displayName} isFollowing={!!isFollowing} followsYou={!!followsYou} />
              ) : null}

              {profile.id ? (
                <ProfileRecognition
                  userId={profile.id}
                  firstName={profile.firstName || profile.username}
                  isOwnProfile={isOwnProfile}
                  canAct={!!currentUser && !isBlocked && !isBlockedByThem}
                  avatarPortrait={(profile.gamification as { avatarPortrait?: string | null } | undefined)?.avatarPortrait ?? null}
                />
              ) : null}

              <ProfileSnapFriends username={profile.username} isOwnProfile={isOwnProfile} followers={followerPreview} followerCount={followerCount} />
            </div>
          )}


          {tab === 'trust' && (
            <div className="flex flex-col">
        {!isOwnProfile && !isBlocked && !isBlockedByThem && currentUser && (
          <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] mt-3 rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)] px-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <ProfileBrowseEyebrow>Community Trust</ProfileBrowseEyebrow>
                  {!vouchStatus?.hasVouched && (
                    vouchStatus?.locationRequired ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-bold text-gray-400">
                        <span className="material-symbols-outlined text-[11px]">location_off</span>
                        Verified address needed
                      </span>
                    ) : vouchStatus?.withinRange === true ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                        <span className="material-symbols-outlined text-[11px]">my_location</span>
                        {vouchStatus.distanceMeters != null ? `~${vouchStatus.distanceMeters}m away ✓` : 'Nearby ✓'}
                      </span>
                    ) : vouchStatus?.withinRange === false ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600">
                        <span className="material-symbols-outlined text-[11px]">location_off</span>
                        Too far — 500m limit
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
                        ? 'Both you and this NeyborH need a verified home address to vouch.'
                        : vouchStatus?.withinRange === false
                          ? 'Your homes must be within 500m to vouch — NeyborHuud is hyperlocal.'
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
                  className="h-1.5 w-full overflow-hidden rounded-full accent-[#0E8A3E] bg-gray-100"
                  value={Math.min(100, ((vouchStatus?.vouchCount ?? 0) / 3) * 100)}
                  max={100}
                  aria-label="Vouch progress to Tree tier"
                />
              </div>
            )}
          </div>
        )}


              {/* TrustOS Info */}
              <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] py-6 px-3">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <ProfileBrowseEyebrow>TrustOS</ProfileBrowseEyebrow>
                  <span className="material-symbols-outlined text-[20px] text-brand-green-dark">verified_user</span>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <p className="text-5xl font-black tracking-tight text-gray-900 leading-none tabular-nums">{trustScore}</p>
                  <div>
                    <p className="text-[13px] font-bold text-gray-400">NeyburH Score</p>
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
                    className="h-2 w-full overflow-hidden rounded-full accent-[#0E8A3E] bg-gray-100"
                    value={scorePercent}
                    max={100}
                    aria-label="Community trust progress"
                  />
                </div>

                {/* Voucher list */}
                {voucherList.length > 0 && (
                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <p className="text-[13px] font-bold text-gray-400 mb-3">
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
                            <Image src={v.voucherAvatar} alt="" width={16} height={16} className="h-4 w-4 rounded-full object-cover" />
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
                        <span className={`material-symbols-outlined text-[15px] ${p.unlocked ? 'text-brand-green-dark' : 'text-gray-300'}`}
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
                        <span className="material-symbols-outlined text-[18px] text-brand-green-dark">{fact.icon}</span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-gray-400">{fact.label}</p>
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
                        <span className="material-symbols-outlined text-[18px] text-brand-green-dark">
                          {axis.done ? 'check_circle' : 'pending'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-gray-400">
                            {axis.label}
                          </p>
                          <p className="text-sm font-extrabold text-gray-800 mt-0.5">
                            {axis.detail}
                          </p>
                        </div>
                        <span className="text-xs font-bold tabular-nums text-brand-green-dark">{axis.percent}%</span>
                      </div>
                    ))}
                  </div>
                  {verificationProgress.blockers.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-blue-100/50 bg-blue-50/30 px-4 py-3">
                      <p className="text-[13px] font-bold text-brand-green-dark">Next steps</p>
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
                        <span className="material-symbols-outlined text-[18px] text-brand-green-dark">{item.done ? 'check_circle' : 'pending'}</span>
                        <div>
                          <p className="text-[13px] font-bold text-gray-400">Status</p>
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
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-brand-green-dark shadow-sm">
                              <span className="material-symbols-outlined text-[21px]">{badge.icon ?? 'military_tech'}</span>
                            </div>
                            <div className="mt-3">
                              <p className="text-sm font-extrabold text-gray-800 leading-tight">{badge.name ?? badge.title ?? 'Badge'}</p>
                              <p className="mt-1 text-[13px] font-bold text-gray-400">{badge.tier ?? badge.category ?? 'Earned'}</p>
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
                                <p className="mt-1 text-[13px] font-bold text-gray-400">
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
                    <ProfileBrowseEyebrow>Your HuudCredit activity</ProfileBrowseEyebrow>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/huud-economy/score"
                      className="flex items-center gap-3.5 border border-gray-100 bg-gray-50/30 rounded-2xl p-4 no-underline transition-all hover:bg-gray-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-brand-green-dark">
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
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-brand-green-dark">
                        <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-gray-800">HuudCredit Wallet</p>
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
                      <Link href={userId ? `/jobs?employerId=${userId}` : '/jobs'} className="text-xs font-bold text-brand-green-dark no-underline hover:underline">See all</Link>
                    </div>
                    <div className="space-y-2.5">
                      {userJobs.map((job: any, i: number) => (
                        <Link
                          key={job.id ?? job._id ?? i}
                          href={`/jobs/${job.id ?? job._id}`}
                          className="flex items-start gap-3.5 border-b border-slate-100 py-3.5 no-underline transition-all hover:opacity-85"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-brand-green-dark">
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
                      <Link href={userId ? `/events?organizerId=${userId}` : '/events'} className="text-xs font-bold text-brand-green-dark no-underline hover:underline">See all</Link>
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
                      <Link href={userId ? `/services?providerId=${userId}` : '/services'} className="text-xs font-bold text-brand-green-dark no-underline hover:underline">See all</Link>
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
                              {service.pricing?.amount ? ` · ₦${fromKobo(Number(service.pricing.amount)).toLocaleString()}` : service.pricing?.type === 'custom' ? ' · Custom price' : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-brand-green-dark mt-1">
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
                      <Link href={userId ? `/marketplace?sellerId=${userId}` : '/marketplace'} className="text-xs font-bold text-brand-green-dark no-underline hover:underline">See all</Link>
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
                              {item.price != null ? ` · ₦${fromKobo(Number(item.price)).toLocaleString()}` : ''}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-bold capitalize text-brand-green-dark mt-1">
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
                  <ErrorState onRetry={() => window.location.reload()} homeHref={null} />
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

          </>
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

      <AppBottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title={displayName}>
        <div className="flex flex-col gap-1 pb-2">
          {[
            !isBlocked && !isBlockedByThem && currentUser
              ? { icon: 'handshake', label: vouchStatus?.hasVouched ? 'Remove your vouch' : 'Vouch for this neighbour', on: () => { setMoreOpen(false); handleVouchClick(); } }
              : null,
            currentUser && !isBlocked ? { icon: 'toll', label: 'Send a tip', on: () => { setMoreOpen(false); setShowTipModal(true); } } : null,
            { icon: 'share', label: 'Share profile', on: () => { setMoreOpen(false); void handleShareProfile(); } },
            currentUser && !isBlockedByThem ? { icon: 'block', label: isBlocked ? 'Unblock' : 'Block', danger: !isBlocked, on: () => { setMoreOpen(false); toggleBlock(); } } : null,
            currentUser ? { icon: 'flag', label: 'Report', danger: true, on: () => { setMoreOpen(false); setReportOpen(true); } } : null,
          ].filter(Boolean).map((a) => (
            <button
              key={a!.label}
              type="button"
              onClick={a!.on}
              disabled={a!.icon === 'handshake' && isVouchPending}
              className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 text-left text-[15px] font-bold hover:bg-background ${a!.danger ? 'text-brand-red' : 'text-navy'}`}
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden>{a!.icon}</span>
              {a!.label}
            </button>
          ))}
        </div>
      </AppBottomSheet>

      <AppBottomSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={`Report ${displayName}`}
        description="Our team checks every report. They won't know it was you."
        footer={
          <Button
            fullWidth
            variant="danger"
            disabled={!reportReason}
            loading={reporting}
            onClick={async () => {
              if (!userId) return;
              setReporting(true);
              try {
                await apiClient.post(`/social/users/${userId}/report`, { reason: reportReason });
                toast.success('Thanks. Our team will look at it.');
                setReportOpen(false);
                setReportReason('');
              } catch (err) {
                toast.error(getErrorMessage(err));
              } finally {
                setReporting(false);
              }
            }}
          >
            Send report
          </Button>
        }
      >
        <div className="flex flex-col gap-1 pb-2" role="radiogroup" aria-label="Reason">
          {[
            ['scam', 'Scam or fake deal'],
            ['harassment', 'Harassment or bullying'],
            ['threat', 'Threats or danger'],
            ['fake_account', 'Fake account or pretending to be someone'],
            ['other', 'Something else'],
          ].map(([value, label]) => (
            <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-3 text-[15px] font-semibold text-navy hover:bg-background">
              <input type="radio" name="report-reason" value={value} checked={reportReason === value} onChange={() => setReportReason(value)} className="h-5 w-5 accent-[#E5484D]" />
              {label}
            </label>
          ))}
        </div>
      </AppBottomSheet>

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
            try {
              await tipUser.mutateAsync({ recipientId: profile.id, amount });
            } catch (err) {
              // The server says why (gifting limits, level, same phone); the modal stays open.
              toast.error(getErrorMessage(err));
              throw err;
            }
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
