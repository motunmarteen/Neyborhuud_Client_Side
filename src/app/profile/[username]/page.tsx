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
import { useFollow, useFollowCounts, useMyMilestoneStatus, type MilestoneInfo } from '@/hooks/useFollow';
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
import { MiniMap } from '@/components/ui/InteractiveMap';
import { Post } from '@/types/api';
import { contentService } from '@/services/content.service';
import { chatService } from '@/services/chat.service';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTipUser } from '@/hooks/useGamification';
import { TipModal } from '@/components/gamification/TipModal';
import { useInView } from 'react-intersection-observer';
import MapPinAvatar from '@/components/ui/MapPinAvatar';
import apiClient from '@/lib/api-client';
import TopNav from '@/components/navigation/TopNav';
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
    } catch {
      toast.error('Could not upload image. Please try again.');
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

  const [showMoreMenu, setShowMoreMenu] = useState(false);
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
      <div className="relative flex h-screen w-full flex-col overflow-hidden neu-base">
        <div className="absolute inset-x-0 top-0 z-30 pointer-events-none"><div className="pointer-events-auto"><TopNav /></div></div>
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 overflow-y-auto">
        {/* Header Skeleton */}
        <div className="neu-base sticky top-0 z-10 shadow-[0_2px_8px_var(--neu-shadow-dark)]">
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
          <RightSidebar />
        </div>
        <BottomNav />
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden neu-base">
        <div className="absolute inset-x-0 top-0 z-30 pointer-events-none"><div className="pointer-events-auto"><TopNav /></div></div>
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-24 h-24 rounded-full neu-socket flex items-center justify-center mx-auto mb-6">
            <i className="bi bi-person-x text-5xl text-[var(--neu-text-muted)]" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-slate-900">
            User Not Found
          </h1>
          <p className="mb-6 max-w-md text-[var(--neu-text-muted)]">
            The user @{username} doesn't exist or their profile is unavailable.
          </p>
          <button
            onClick={() => router.back()}
            className="mod-chip rounded-2xl px-6 py-2.5 font-semibold text-primary transition-colors"
          >
            Go Back
          </button>
        </div>
          </div>
          <RightSidebar />
        </div>
        <BottomNav />
      </div>
    );
  }

  // Get display name
  const displayName =
    profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile.firstName || profile.username;

  const userInitial = displayName[0]?.toUpperCase() || 'U';

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
  const primaryStatCards = [
    { label: 'Linkers', value: followerCount.toLocaleString(), icon: 'group', tone: 'from-emerald-500/15 to-emerald-500/5 text-emerald-700' },
    { label: 'Linking', value: followingCount.toLocaleString(), icon: 'share', tone: 'from-sky-500/15 to-sky-500/5 text-sky-700' },
    { label: 'NeyburH Score', value: trustScore.toLocaleString(), icon: 'verified_user', tone: 'from-lime-500/15 to-lime-500/5 text-primary700' },
    { label: 'HuudCoins', value: Number(huudCoins).toLocaleString(), icon: 'stars', tone: 'from-amber-500/20 to-amber-500/5 text-amber-700' },
  ];
  const profileFacts = [
    { label: 'Location', value: locationLabel || 'Neyborhuud pending', icon: 'location_on' },
    { label: 'Joined', value: joinedLabel, icon: 'calendar_month' },
    { label: 'Identity', value: profile.identityVerified ? 'Verified' : 'Pending', icon: profile.identityVerified ? 'verified' : 'shield' },
    { label: 'Role', value: profile.role?.replace('_', ' ') || 'user', icon: 'badge' },
  ];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden neu-base">
      {/* Follower milestone celebration overlay — shown to follower who just followed, OR to profile owner detecting a new reward */}
      {(ownerMilestone ?? pendingMilestone) && (
        <FollowerMilestoneCelebration
          milestone={(ownerMilestone ?? pendingMilestone)!}
          onDismiss={ownerMilestone ? () => setOwnerMilestone(null) : clearMilestone}
        />
      )}
      {/* TopNav floats over the map cover */}
      <div className="absolute inset-x-0 top-0 z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <TopNav />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto">
      {/* Profile Content — map fills from the very top, TopNav overlays it */}
      <div className="w-full">

        <section className="relative min-h-[430px] overflow-hidden border-b border-emerald-950/10 bg-emerald-50">
          <div className="absolute inset-0 overflow-hidden">
            {profile.location?.latitude && profile.location?.longitude ? (
              <MiniMap
                center={{ lat: profile.location.latitude, lng: profile.location.longitude }}
                height="430px"
                className="w-full"
                draggable={isOwnProfile}
                markerInteractive={isOwnProfile}
                onLocationChange={handleMapLocationChange}
                dragHintLabel={isSavingDraggedLocation ? 'Saving location…' : 'Tap map to move pin · Tap pin to change photo'}
                customMarkerNode={
                  <MapPinAvatar
                    src={profile.profilePicture || profile.avatarUrl}
                    alt={displayName}
                    fallbackInitial={userInitial}
                    size="marker"
                    onClick={isOwnProfile ? (e) => { e.stopPropagation(); handleAvatarClick(); } : undefined}
                    className={isOwnProfile ? 'cursor-pointer' : ''}
                  />
                }
              />
            ) : (
              <div className="h-full bg-[radial-gradient(circle_at_top_left,rgba(0,111,53,0.22),transparent_34%),linear-gradient(135deg,rgba(240,253,244,1),rgba(219,234,254,1))]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-slate-950/70 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent pointer-events-none" />
          </div>

          <button
            onClick={() => router.back()}
            className="absolute top-16 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/85 text-emerald-700 shadow-lg backdrop-blur-md transition hover:bg-white"
            aria-label="Go back"
            type="button"
          >
            <i className="bi bi-arrow-left text-lg" />
          </button>

          {isOwnProfile && (
            <button
              onClick={handleSetLocation}
              disabled={isSettingLocation}
              className="absolute top-16 right-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-3.5 py-2 text-xs font-bold text-emerald-700 shadow-lg backdrop-blur-md transition hover:bg-white disabled:opacity-50"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">
                {isSettingLocation ? 'hourglass_top' : 'my_location'}
              </span>
              {isSettingLocation ? 'Updating...' : 'Set Location'}
            </button>
          )}

          <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 items-end gap-3 sm:gap-4">
                <div className="relative shrink-0">
              <MapPinAvatar
                src={profile.profilePicture || profile.avatarUrl}
                alt={displayName}
                fallbackInitial={userInitial}
                size="2xl"
                onClick={isOwnProfile ? handleAvatarClick : undefined}
                    className={isOwnProfile ? 'cursor-pointer drop-shadow-2xl' : 'drop-shadow-2xl'}
              />
                  {isOwnProfile && (
                    <button
                      onClick={handleAvatarClick}
                      className="absolute -right-1 bottom-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-lg"
                      type="button"
                      aria-label="Upload profile photo"
                    >
                      <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    </button>
                  )}
                </div>
                <div className="min-w-0 pb-2 text-white">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {profile.identityVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-[11px] font-bold text-emerald-100 ring-1 ring-emerald-200/30 backdrop-blur">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        Verified
                      </span>
                    )}
                    <span className="rounded-full bg-white/15 px-2 py-1 text-[11px] font-bold text-white/90 ring-1 ring-white/15 backdrop-blur">
                      Level {level}
                    </span>
                    {/* Trust tier badge */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-bold text-white/90 ring-1 ring-white/15 backdrop-blur">
                      {profileTrustTier.icon} {profileTrustTier.label}
                    </span>
                    {/* Vouch count chip — shown when there are vouches */}
                    {(vouchStatus?.vouchCount ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-[11px] font-bold text-amber-100 ring-1 ring-amber-200/30 backdrop-blur">
                        🤜 {vouchStatus!.vouchCount} {vouchStatus!.vouchCount === 1 ? 'vouch' : 'vouches'}
                      </span>
                    )}
                  </div>
                  <h1 className="truncate text-2xl font-black leading-tight sm:text-4xl">{displayName}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-white/80 sm:text-sm">
                    <span>@{profile.username}</span>
                    {locationLabel && (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {locationLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                {primaryStatCards.map((stat) => (
                  <div key={stat.label} className="min-w-[98px] rounded-2xl border border-white/15 bg-white/15 px-3 py-2 text-white shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/70">
                      <span className="material-symbols-outlined text-[14px]">{stat.icon}</span>
                      {stat.label}
                    </div>
                    <p className="mt-1 text-lg font-black leading-none tabular-nums">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
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

          {isUploadingAvatar && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 pointer-events-none">
              <div className="px-4 py-2 rounded-full bg-white/95 text-xs font-semibold text-charcoal shadow-lg flex items-center gap-2">
                <i className="bi bi-arrow-repeat animate-spin"></i>
                Uploading photo…
              </div>
            </div>
          )}
        </section>

        <section className="doodle-surface px-0 py-5">
          <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            {isOwnProfile ? (
              <>
                <Link
                  href="/settings"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  <i className="bi bi-pencil text-sm" />
                  Edit Profile
                </Link>
                <button
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Share Profile
                </button>
              </>
            ) : isLoadingStatus ? (
              <div className="inline-flex flex-1 animate-pulse items-center justify-center rounded-2xl bg-slate-100 px-4 py-3">
                <div className="h-4 w-24 rounded-full bg-slate-200" />
              </div>
            ) : isBlocked ? (
              <button
                onClick={() => toggleBlock()}
                disabled={isBlockPending}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-100 px-5 py-3 text-sm font-black text-red-600 transition hover:bg-red-200 disabled:opacity-50"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">block</span>
                {isBlockPending ? 'Unblocking...' : 'Blocked'}
              </button>
            ) : isBlockedByThem ? (
              <div className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-black text-[var(--neu-text-muted)]">
                <span className="material-symbols-outlined text-[16px]">block</span>
                Unavailable
              </div>
            ) : (
              <>
                <button
                  onClick={toggleFollow}
                  disabled={isFollowPending}
                  className={`group inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    isFollowing ? 'border border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-brand-red/10 hover:text-brand-red' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  type="button"
                >
                  {isFollowPending ? (
                    <>
                      <i className="bi bi-hourglass-split animate-spin text-sm" />
                      <span className="hidden group-hover:inline">{isFollowing ? 'Unlinking...' : 'Linking...'}</span>
                      <span className="group-hover:hidden">{isFollowing ? 'HuudLinked' : 'HuudLink'}</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden group-hover:inline">{isFollowing ? 'Unlink' : 'HuudLink'}</span>
                      <span className="group-hover:hidden">
                        {isFollowing ? 'HuudLinked' : 'HuudLink'}
                        {followsYou && !isFollowing && ' Back'}
                      </span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleStartChat}
                  disabled={startingChat}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                  type="button"
                >
                  {startingChat ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                  )}
                  {startingChat ? 'Opening...' : 'Message'}
                </button>
                {/* Tip neighbour with HuudCoins */}
                <button
                  onClick={() => setShowTipModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100"
                  type="button"
                  title="Send HuudCoins tip"
                >
                  🪙
                </button>
                {/* More Actions */}
                {!isBlockedByThem && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      type="button"
                      aria-label="More actions"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                    </button>
                    {showMoreMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                          <button
                            onClick={() => { toggleBlock(); setShowMoreMenu(false); }}
                            disabled={isBlockPending}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-brand-red/10 dark:hover:bg-brand-red/20 text-red-600 dark:text-brand-red transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">{isBlocked ? 'lock_open' : 'block'}</span>
                            {isBlocked ? 'Unblock NeyburH' : 'Block NeyburH'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Vouch Card ──────────────────────────────────────────── */}
          {!isOwnProfile && !isBlocked && !isBlockedByThem && currentUser && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-700">
                      Community Trust
                    </p>
                    {/* ── Proximity badge ── */}
                    {!vouchStatus?.hasVouched && (
                      vouchStatus?.locationRequired ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-[var(--neu-text-muted)]">
                          <span className="material-symbols-outlined text-[12px]">location_off</span>
                          Location needed
                        </span>
                      ) : vouchStatus?.withinRange === true ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 border border-green-300 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          <span className="material-symbols-outlined text-[12px]">my_location</span>
                          {vouchStatus.distanceMeters}m away ✓
                        </span>
                      ) : vouchStatus?.withinRange === false ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          <span className="material-symbols-outlined text-[12px]">location_off</span>
                          {vouchStatus.distanceMeters != null ? `${vouchStatus.distanceMeters}m away` : 'Too far'} — 500m limit
                        </span>
                      ) : null
                    )}
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">
                    {(vouchStatus?.vouchCount ?? 0) > 0
                      ? `${vouchStatus!.vouchCount} NeyburH${vouchStatus!.vouchCount === 1 ? '' : 's'} vouch for @${profile.username}`
                      : `@${profile.username} has no vouches yet`}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--neu-text-muted)]">
                    {vouchStatus?.hasVouched
                      ? 'You have vouched for this NeyburH. Their actions reflect on your trust.'
                      : vouchStatus?.canVouch === false
                      ? 'Reach Tree 🌳 tier to unlock vouching.'
                      : vouchStatus?.locationRequired
                      ? 'Both you and this NeyburH need location enabled to vouch.'
                      : vouchStatus?.withinRange === false
                      ? 'You must be within 500m to vouch — NeyborHuud is hyperlocal. Only vouch for neighbours you know in person.'
                      : 'Vouching puts your own NeyburH Score at stake.'}
                  </p>
                </div>
                <div className="shrink-0">
                  {vouchStatus?.hasVouched ? (
                    <button
                      onClick={() => revokeMutation.mutate()}
                      disabled={isVouchPending}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-100 px-3.5 py-2 text-sm font-black text-amber-700 transition hover:border-red-300 hover:bg-brand-red/10 hover:text-brand-red disabled:opacity-50"
                      type="button"
                      title="Revoke your vouch"
                    >
                      {isVouchPending ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <>🤜 Vouched</>
                      )}
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
                            description: 'Both you and this NeyburH need location enabled. Enable it in your profile settings.',
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
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-black text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        vouchStatus?.canVouch === false || vouchStatus?.locationRequired || vouchStatus?.withinRange === false
                          ? 'bg-brand-surface shadow-gray-400/25 cursor-pointer hover:bg-brand-surface'
                          : 'bg-primary shadow-amber-500/25 hover:bg-amber-600'
                      }`}
                      type="button"
                      title={
                        vouchStatus?.canVouch === false ? 'Reach Tree 🌳 tier to unlock vouching'
                        : vouchStatus?.locationRequired ? 'Location required'
                        : vouchStatus?.withinRange === false ? `Too far away (${vouchStatus.distanceMeters}m — limit is 500m)`
                        : 'Vouch for this NeyburH'
                      }
                    >
                      {isVouchPending ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : vouchStatus?.canVouch === false ? (
                        <><span className="material-symbols-outlined text-[15px]">lock</span> Vouch</>
                      ) : vouchStatus?.locationRequired ? (
                        <><span className="material-symbols-outlined text-[15px]">location_off</span> Vouch</>
                      ) : vouchStatus?.withinRange === false ? (
                        <><span className="material-symbols-outlined text-[15px]">location_off</span> Vouch</>
                      ) : (
                        <>🤜 Vouch</>
                      )}
                    </button>
                  )}
                </div>
              </div>
              {/* Trust tier progress bar */}
              {(vouchStatus?.vouchesNeeded ?? 0) > 0 && !vouchStatus?.hasVouched && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-600 mb-1">
                    <span>Progress to Tree 🌳 tier</span>
                    <span>{vouchStatus?.vouchCount ?? 0} / 3 vouches</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, ((vouchStatus?.vouchCount ?? 0) / 3) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <span className="material-symbols-outlined text-[20px]">person_pin_circle</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)]">About this NeyburH</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {profile.bio || `${displayName} is part of the ${locationLabel || 'NeyborHuud'} community.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {profileFacts.map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--neu-text-muted)]">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">{fact.icon}</span>
                    {fact.label}
                  </div>
                  <p className="mt-1 truncate text-sm font-bold capitalize text-slate-800">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {showHandleHistory ? (
              <div
                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left"
              >
                <h3 className="mb-2 text-[11px] font-black uppercase tracking-wider text-[var(--neu-text-muted)]">
                  Handle history
                </h3>
                {renameAudit.length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-700">
                    {renameAudit.map((row, idx) => (
                      <li key={`${row.previousUsername}-${row.newUsername}-${idx}`}>
                        <span className="font-mono text-primary">@{row.previousUsername}</span>
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
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {hist.usernameTimeline.map((row, idx) => (
                      <li key={`${row.username}-${idx}`}>
                        <span className="font-mono font-semibold">@{row.username}</span>
                        <span className="text-[10px] opacity-70 block">
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
          </div>
        </section>

        {/* ══════ Two-Column Layout ══════ */}
        <div className="doodle-surface-muted flex flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">

          <aside className="w-full flex-shrink-0 space-y-4 lg:w-80">
            <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-5 text-white">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/70">TrustOS</p>
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
                <p className="mt-5 text-5xl font-black leading-none tabular-nums">{trustScore}</p>
                <p className="mt-1 text-sm font-semibold text-white/75">NeyburH Score</p>
                <p className="mt-2 text-xs font-semibold text-white/80">
                  {profileTrustTier.icon} {profileTrustTier.label}
                  {nextTrustTier ? ` · ${Math.max(0, nextTrustTier.minScore - trustScore)} pts to ${nextTrustTier.label}` : ' · Top tier reached'}
                </p>
                {/* Marketplace badge */}
                {profilePrivileges.marketplaceBadge && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${profilePrivileges.marketplaceBadgeColor}`}>
                      {profileTrustTier.icon} {profilePrivileges.marketplaceBadge}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-[var(--neu-text-muted)]">
                  <span>Community trust</span>
                  <span>{scorePercent}%</span>
                </div>
                <progress
                  className="h-2 w-full overflow-hidden rounded-full accent-emerald-500"
                  value={scorePercent}
                  max={100}
                  aria-label="Community trust progress"
                />
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700/60">Level</p>
                    <p className="mt-1 text-xl font-black text-emerald-700">{level}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-700/60">Coins</p>
                    <p className="mt-1 text-xl font-black text-amber-700">{Number(huudCoins).toLocaleString()}</p>
                  </div>
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
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)]">Profile Snapshot</p>
              <div className="mt-4 space-y-3">
                {profileFacts.map((fact) => (
                  <div key={`side-${fact.label}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">{fact.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--neu-text-muted)]">{fact.label}</p>
                      <p className="truncate text-sm font-bold capitalize text-slate-800">{fact.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)]">Verification</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Location anchored', done: !!profile.location?.latitude },
                  { label: 'Identity confirmed', done: !!profile.identityVerified },
                  { label: 'Community ready', done: !!profile.assignedCommunityId || !!locationLabel },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-[var(--neu-text-muted)]'}`}>
                      <span className="material-symbols-outlined text-[17px]">{item.done ? 'check' : 'pending'}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)]">Badges</p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">Neyborhuud credibility</h2>
                </div>
                <Link
                  href={isOwnProfile ? "/gamification?tab=badges" : `/gamification`}
                  className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 hover:bg-emerald-100 transition-colors"
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
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
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
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)]">Jobs</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">Posted by {isOwnProfile ? "you" : profile.firstName ?? profile.username}</h2>
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
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)]">Events</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">Organised by {isOwnProfile ? "you" : profile.firstName ?? profile.username}</h2>
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
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)]">Services</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">{isOwnProfile ? "Your" : `${profile.firstName ?? profile.username}'s`} service offerings</h2>
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

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--neu-text-muted)]">Activity</p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">Recent neyborhuud posts</h2>
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
                className="rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
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
                    className="mt-6 inline-flex rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
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

      </div>

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
        <RightSidebar />
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
    </div>
  );
}
