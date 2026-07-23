'use client';

import React, { Suspense, useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import TopNav from '@/components/navigation/TopNav';
import { useAuth } from '@/hooks/useAuth';
import { followService } from '@/services/follow.service';
import { geoService } from '@/services/geo.service';
import { chatService } from '@/services/chat.service';
import { ChatsStream } from '@/components/friendship/ChatsStream';
import { ConnectMap } from '@/components/friendship/ConnectMap';
import { useScrollHideBottomNav } from '@/hooks/useScrollHideBottomNav';
import { BottomNav } from '@/components/feed/BottomNav';
import { useCall } from '@/components/calls/CallProvider';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FollowUser {
  _id?: string;
  id?: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  profilePicture?: string;
  bio?: string;
  lga?: string;
  state?: string;
  isVerified?: boolean;
  followedAt?: string;
  distanceMetres?: number;
  isFollowing?: boolean;
  isMutual?: boolean;
  /** Registered home location (JSON string or object) — used for the Connect map. */
  primaryLocation?: string | { lat?: number; lng?: number; latitude?: number; longitude?: number };
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

const Avatar = ({ user, size = 48 }: { user: FollowUser; size?: number }) => {
  const src = user.avatarUrl || user.profilePicture;
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || '?';
  const initials = displayName[0]?.toUpperCase() ?? '?';

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-white/60 bg-slate-100 shadow-sm"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={user.username} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span className="font-bold text-slate-400" style={{ fontSize: size * 0.35 }}>{initials}</span>
      )}
    </div>
  );
};

const VerifiedBadge = () => (
  <span className="material-symbols-outlined text-[14px] text-[#00D431] fill-1 ml-0.5 flex-shrink-0">verified</span>
);

const fmtDist = (m: number) =>
  m < 1000 ? `${Math.round(m)}m away` : `${(m / 1000).toFixed(1)}km away`;

// ─── User Card ─────────────────────────────────────────────────────────────────

interface UserCardProps {
  user: FollowUser;
  currentUserId?: string;
  onFollowToggle: (userId: string, isFollowing: boolean) => void;
  onMessage: (userId: string) => void;
  pendingIds: Set<string>;
  messagingIds: Set<string>;
  isFollowing: boolean;
}

function UserCard({ user, currentUserId, onFollowToggle, onMessage, pendingIds, messagingIds, isFollowing }: UserCardProps) {
  const userId = user._id || user.id;
  const isMe = !!userId && userId === currentUserId;
  const { startCall } = useCall();
  const router = useRouter();

  const handleAudioCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    startCall({
      peerId: userId,
      peerName: `${user.firstName} ${user.lastName}`,
      peerAvatar: user.avatarUrl || user.profilePicture || undefined,
      type: 'audio',
      conversationId: null,
    });
  };

  const handleVideoCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    startCall({
      peerId: userId,
      peerName: `${user.firstName} ${user.lastName}`,
      peerAvatar: user.avatarUrl || user.profilePicture || undefined,
      type: 'video',
      conversationId: null,
    });
  };

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || `@${user.username}`;

  return (
    <div
      onClick={() => router.push(`/profile/${user.username}`)}
      className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50 active:bg-slate-100 border-b border-gray-100"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar user={user} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 min-w-0">
            <p className="truncate text-[15px] font-semibold text-slate-800">
              {displayName}
            </p>
            {user.isVerified && <VerifiedBadge />}
          </div>
          
          <div className="flex items-center gap-1.5 truncate text-[13px] text-slate-500 mt-0.5">
            {user.firstName || user.lastName ? <span className="text-slate-400 font-medium">@{user.username}</span> : null}
            {(user.firstName || user.lastName) && (user.lga || user.state) && <span className="text-slate-300">·</span>}
            {user.lga || user.state ? (
              <span className="truncate">{[user.lga, user.state].filter(Boolean).join(', ')}</span>
            ) : null}
            {user.distanceMetres != null && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-[#00A555] font-bold shrink-0">{fmtDist(user.distanceMetres)}</span>
              </>
            )}
          </div>
          {user.bio && <p className="text-slate-400 text-xs truncate mt-1 italic">"{user.bio}"</p>}
        </div>
      </div>

      {!isMe && user.isMutual && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleAudioCall}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#00A555] transition-colors hover:bg-[#00D431]/10 active:scale-90"
            aria-label="Audio call"
          >
            <span className="material-symbols-outlined text-[20px]">call</span>
          </button>
          <button
            type="button"
            onClick={handleVideoCall}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#00A555] transition-colors hover:bg-[#00D431]/10 active:scale-90"
            aria-label="Video call"
          >
            <span className="material-symbols-outlined text-[20px]">videocam</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab pills ─────────────────────────────────────────────────────────────────

const CONNECT_CATEGORIES = [
  { id: 'chats', label: 'Chats', icon: 'chat', color: 'bg-blue-600', text: 'text-blue-600', bgSoft: 'bg-blue-600/10' },
  { id: 'near_me', label: 'Near me', icon: 'location_on', color: 'bg-green-600', text: 'text-green-600', bgSoft: 'bg-green-600/10' },
  { id: 'following', label: 'Following', icon: 'person_add', color: 'bg-purple-600', text: 'text-purple-600', bgSoft: 'bg-purple-600/10' },
  { id: 'followers', label: 'Followers', icon: 'groups', color: 'bg-orange-600', text: 'text-orange-600', bgSoft: 'bg-orange-600/10' },
] as const;

const TabCircle = ({
  active,
  onClick,
  label,
  icon,
  count,
  color,
  text,
  bgSoft,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
  count?: number;
  color: string;
  text: string;
  bgSoft: string;
}) => (
  <button
    type="button"
    role="tab"
    onClick={onClick}
    aria-selected={active ? 'true' : 'false'}
    className="flex flex-col items-center justify-start gap-2 bg-transparent transition-transform active:opacity-60 w-[26vw] max-w-[96px] shrink-0"
  >
    <div className="relative">
      <div className={`w-[64px] h-[64px] rounded-full flex items-center justify-center shrink-0 transition-colors ${active ? `${color} text-white shadow-md` : `${bgSoft} ${text}`}`}>
        <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'wght' 300" }}>{icon}</span>
      </div>
      {count != null && count > 0 && (
        <div className="absolute top-0 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
          <span className="text-[9px] font-bold text-white">{count > 99 ? '99+' : count}</span>
        </div>
      )}
    </div>
    <span className={`text-[12px] text-center leading-tight tracking-tight break-words px-1 ${active ? 'font-bold text-gray-900' : 'font-medium text-gray-500'}`}>{label}</span>
  </button>
);

// ─── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = ({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) => (
  <div className="bg-white py-8 border-y border-gray-100">
    <BrowseEmptyState
      className="flex flex-col items-center gap-3 bg-white px-6 py-6 text-center rounded-none shadow-none border-0"
      icon={icon}
      title={title}
      description={subtitle}
    />
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

type MainTab = 'chats' | 'near_me' | 'following' | 'followers';

/** Tabs that show the registered-home map header. */
const MAP_TABS: MainTab[] = ['near_me', 'following', 'followers'];


const CONNECT_TAB_ACCENTS: Record<MainTab, string> = {
  chats: 'bg-blue-600 shadow-[0_1px_6px_rgba(37,99,235,0.25)]',
  near_me: 'bg-green-600 shadow-[0_1px_6px_rgba(22,163,74,0.25)]',
  following: 'bg-purple-600 shadow-[0_1px_6px_rgba(147,51,234,0.25)]',
  followers: 'bg-orange-600 shadow-[0_1px_6px_rgba(249,115,22,0.25)]',
};

function FriendshipPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const initialTab = ((): MainTab => {
    const t = searchParams.get('tab');
    // Legacy comms tabs (calls/dms/communities) now fold into one "Chats" stream.
    if (t === 'calls' || t === 'dms' || t === 'direct' || t === 'communities' || t === 'groups' || t === 'chats') return 'chats';
    if (t === 'map') return 'near_me'; // legacy Map tab → Near me (map now a header)
    if (t === 'following' || t === 'followers' || t === 'near_me') return t as MainTab;
    return 'chats'; // Chats is the default landing tab
  })();
  const [mainTab, setMainTab] = useState<MainTab>(initialTab);
  const [search, setSearch] = useState('');
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});
  const [pendingUsers, setPendingUsers] = useState<Set<string>>(new Set());
  const [messagingUsers, setMessagingUsers] = useState<Set<string>>(new Set());

  // ── Data queries ────────────────────────────────────────────────────────────

  const { data: followersData, isLoading: loadingFollowers } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: () => user ? followService.getFollowers(user.id, 1, 100) : null,
    enabled: !!user && (mainTab === 'followers' || mainTab === 'near_me' || mainTab === 'following'),
    staleTime: 60_000,
  });

  const { data: followingData, isLoading: loadingFollowing } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: () => user ? followService.getFollowing(user.id, 1, 100) : null,
    enabled: !!user && (mainTab === 'following' || mainTab === 'near_me' || mainTab === 'followers'),
    staleTime: 60_000,
  });

  // "Near me" = neighbours by REGISTERED HOME (same lga/state), excluding
  // people we already follow. Not live GPS — see Phase 2.5 location principle.
  const { data: neighborsData, isLoading: loadingNearby } = useQuery({
    queryKey: ['connect-neighbors'],
    queryFn: () => geoService.getNeighbors(50),
    enabled: !!user && mainTab === 'near_me',
    staleTime: 120_000,
  });

  // ── Follow mutations ────────────────────────────────────────────────────────

  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    setPendingUsers(p => new Set([...p, userId]));
    try {
      if (isFollowing) {
        await followService.unfollowUser(userId);
      } else {
        await followService.followUser(userId);
      }
      setFollowingState(prev => ({ ...prev, [userId]: !isFollowing }));
      queryClient.invalidateQueries({ queryKey: ['followers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['nearby-users'] });
    } catch (err) {
      // revert on error — no-op
    } finally {
      setPendingUsers(p => { const s = new Set(p); s.delete(userId); return s; });
    }
  };

  const handleMessage = async (userId: string) => {
    if (messagingUsers.has(userId)) return;
    setMessagingUsers(p => new Set([...p, userId]));
    try {
      const res = await chatService.getOrCreateDirectConversation(userId);
      const conv = (res.data as { conversation?: { _id?: string; conversationId?: string; id?: string } })?.conversation ?? (res.data as { _id?: string; conversationId?: string; id?: string });
      const convId = conv?._id ?? conv?.conversationId ?? conv?.id;
      if (convId) router.push(`/chat/${convId}`);
    } catch {
      // silent — user can retry
    } finally {
      setMessagingUsers(p => { const s = new Set(p); s.delete(userId); return s; });
    }
  };

  // ── Derived follow lookup ───────────────────────────────────────────────────

  const followers: FollowUser[] = ((followersData?.data as any)?.followers ?? []);
  const following: FollowUser[] = ((followingData?.data as any)?.following ?? []).map((u: any) => ({ ...u, isFollowing: true }));
  const nearbyUsers: FollowUser[] = ((neighborsData?.data as any)?.users ?? []);

  // Active lookup set
  const followingIds = useMemo(() => {
    const ids = new Set(following.map(u => u._id || u.id));
    Object.keys(followingState).forEach(id => {
      if (followingState[id]) {
        ids.add(id);
      } else {
        ids.delete(id);
      }
    });
    return ids;
  }, [following, followingState]);

  const filterUsers = (list: FollowUser[]) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      u =>
        `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase().includes(q) ||
        (u.username ?? '').toLowerCase().includes(q) ||
        (u.lga ?? '').toLowerCase().includes(q),
    );
  };

  const handleMainTab = (t: MainTab) => {
    setMainTab(t);
    setSearch('');
    // Keep the URL in sync so deep links (and the /chat redirect) resolve correctly
    const params = new URLSearchParams(searchParams.toString());
    if (t === 'near_me') params.delete('tab');
    else params.set('tab', t);
    const q = params.toString();
    router.replace(q ? `/friendship?${q}` : '/friendship', { scroll: false });
  };


  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderUserList = (list: FollowUser[], loading: boolean, emptyTitle: string, emptySubtitle: string) => {
    if (loading) return <ListSkeleton />;
    const filtered = filterUsers(list);
    if (!filtered.length) return <EmptyState icon="person_search" title={emptyTitle} subtitle={emptySubtitle} />;
    return (
      <div className="divide-y divide-gray-100 bg-white">
        {filtered.map((u, index) => {
          const userId = u._id || u.id || '';
          const key = userId || u.username || `user-${index}`;
          return (
            <UserCard
              key={key}
              user={u}
              currentUserId={user?.id}
              onFollowToggle={handleFollowToggle}
              onMessage={handleMessage}
              pendingIds={pendingUsers}
              messagingIds={messagingUsers}
              isFollowing={!!userId && followingIds.has(userId)}
            />
          );
        })}
      </div>
    );
  };

  // Persistent, context-aware search placeholder per tab.
  const searchPlaceholder = (() => {
    switch (mainTab) {
      case 'chats': return 'Search chats, calls & communities…';
      case 'following': return 'Search people you follow…';
      case 'followers': return 'Search your followers…';
      default: return 'Search neighbours…';
    }
  })();

  // Users plotted on the collapsible map, per active spatial tab.
  const mapUsers =
    mainTab === 'following' ? following :
    mainTab === 'followers' ? followers :
    mainTab === 'near_me' ? nearbyUsers : [];
  const mapLoading =
    mainTab === 'following' ? loadingFollowing :
    mainTab === 'followers' ? loadingFollowers :
    mainTab === 'near_me' ? loadingNearby : false;
  const showMap = MAP_TABS.includes(mainTab);
  // Map auto-hides while scrolling down the list, reappears at the top.
  // Reuses the same scroll-direction signal the bottom nav uses; resetKey=tab
  // so switching tabs re-opens the map.
  const mapCollapsed = useScrollHideBottomNav(showMap, mainTab);

  return (
    <div className="flex flex-1 w-full !h-[100dvh] !min-h-[100dvh] flex-col overflow-hidden !bg-white">
      <TopNav />

      <div className="app-chrome-below-topnav mx-auto w-full max-w-[600px] !bg-white">
      {/* Search + tabs */}
      <header className="z-30 shrink-0 bg-white/95 backdrop-blur-md">
        {/* Persistent, context-aware search — on every tab */}
        <div className="pb-6 pt-3">
          <div className="relative flex items-center mx-auto w-[calc(100%-1.5rem)] max-w-[600px] h-[3.2rem]">
            <span className="material-symbols-outlined absolute left-5 text-gray-400 text-[22px]" style={{ fontVariationSettings: "'wght' 300" }}>search</span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-full pl-[52px] pr-12 bg-[#F4F5F6] rounded-full text-[15px] font-medium text-gray-900 outline-none transition-all focus:bg-[#EDEDEE] placeholder:text-gray-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] border-none"
            />
          </div>
        </div>

        {/* Edge-to-edge Circle Tabs */}
        <div className="pl-4 pb-6 relative">
          <div
            role="tablist"
            aria-label="Friendship sections"
            className="flex items-start gap-4 overflow-x-auto pt-1 pb-2 no-scrollbar pr-8"
          >
            {CONNECT_CATEGORIES.map(cat => {
              const count = cat.id === 'following' ? following.length : cat.id === 'followers' ? followers.length : 0;
              return (
                <TabCircle
                  key={cat.id}
                  active={mainTab === cat.id}
                  onClick={() => handleMainTab(cat.id as MainTab)}
                  label={cat.label}
                  icon={cat.icon}
                  count={count}
                  color={cat.color}
                  text={cat.text}
                  bgSoft={cat.bgSoft}
                />
              );
            })}
          </div>
          {/* Fade out right edge indicator */}
          <div className="absolute top-0 right-0 bottom-6 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          {/* Dynamic Accent Line */}
          <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] transition-all duration-300 ${CONNECT_TAB_ACCENTS[mainTab]}`} />
        </div>
      </header>

      {/* Registered-home map header (spatial tabs only) — auto-hides on scroll. */}
      {showMap && (
        <div className="shrink-0 overflow-hidden border-b border-gray-100 bg-white transition-[height] duration-300 ease-out"
          style={{ height: mapCollapsed ? '0px' : '30vh' }}
        >
          <ConnectMap
            users={mapUsers}
            loading={mapLoading}
            emptyLabel={
              mainTab === 'following'
                ? 'People you follow will appear here once they set their location.'
                : mainTab === 'followers'
                  ? 'Your followers will appear here once they set their location.'
                  : 'Neighbours in your area will appear here.'
            }
          />
        </div>
      )}

      {/* Content */}
      <main
        data-app-scroll-root
        className="feed-scroll-main min-h-0 flex-1 overflow-y-auto scroll-smooth !bg-white pb-36"
      >
        {/* Near me tab */}
        {mainTab === 'near_me' && (
          <>
            {renderUserList(
              nearbyUsers,
              loadingNearby,
              'No neighbours found yet',
              'Neighbours who registered in your area will appear here. Invite people to join your Huud.',
            )}
          </>
        )}

        {/* Following tab */}
        {mainTab === 'following' && renderUserList(
          following,
          loadingFollowing,
          'Not following anyone yet',
          'Search for neighbours nearby in the Near me tab to start building your network.',
        )}

        {/* Followers tab */}
        {mainTab === 'followers' && renderUserList(
          followers,
          loadingFollowers,
          'No followers yet',
          'When other neighbours connect with you on NeyborHuud, they will appear here.',
        )}

        {/* Unified WhatsApp-style Chats: DMs + communities + call log, chronological */}
        {mainTab === 'chats' && <ChatsStream currentUserId={user?.id} search={search} />}

      </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default function FriendshipPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-white p-8 text-sm text-slate-400">
          Loading…
        </div>
      }
    >
      <FriendshipPageContent />
    </Suspense>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-gray-100 animate-pulse bg-white">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-100 rounded-full w-1/3" />
            <div className="h-3 bg-slate-100 rounded-full w-1/4" />
            <div className="h-3 bg-slate-100 rounded-full w-1/2" />
          </div>
          <div className="w-20 h-7 rounded-full bg-slate-100 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
