'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/navigation/TopNav';
import { useAuth } from '@/hooks/useAuth';
import { followService } from '@/services/follow.service';
import { geoService } from '@/services/geo.service';
import { chatService } from '@/services/chat.service';
import { BottomNav } from '@/components/feed/BottomNav';

const MapComponent = dynamic(() => import('@/app/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] flex-col items-center justify-center bg-white p-6 text-center">
      <div className="mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-3xl border border-black/[0.06] bg-brand-surface">
        <span className="material-symbols-outlined text-[32px] text-primary">map</span>
      </div>
      <p className="text-sm font-semibold text-brand-black">Loading map…</p>
    </div>
  ),
});

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
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

const Avatar = ({ user, size = 48 }: { user: FollowUser; size?: number }) => {
  const src = user.avatarUrl || user.profilePicture;
  const initials = `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || (user.username || '?')[0].toUpperCase();
  if (src) {
    return (
      <Image
        src={src}
        alt={user.username}
        width={size}
        height={size}
        className="rounded-full object-cover border border-slate-200 flex-shrink-0"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-[#00D431] to-[#006F35] border border-slate-200 flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
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
  const pending = !!userId && pendingIds.has(userId);
  const messaging = !!userId && messagingIds.has(userId);

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors duration-150 border-b border-gray-100 group">
      <Link href={`/profile/${user.username}`} className="flex-shrink-0">
        <Avatar user={user} size={48} />
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/profile/${user.username}`} className="flex items-center gap-1 min-w-0">
          <span className="font-semibold text-slate-800 text-sm truncate">
            {user.firstName} {user.lastName}
          </span>
          {user.isVerified && <VerifiedBadge />}
        </Link>
        <p className="text-slate-400 text-xs truncate">@{user.username}</p>
        {(user.lga || user.state) && (
          <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-[12px] text-primary">location_on</span>
            <span className="truncate">{[user.lga, user.state].filter(Boolean).join(', ')}</span>
            {user.distanceMetres != null && (
              <span className="text-[#00D431] font-bold ml-1">· {fmtDist(user.distanceMetres)}</span>
            )}
          </p>
        )}
        {user.bio && <p className="text-slate-500 text-xs truncate mt-1 opacity-90 italic">"{user.bio}"</p>}
      </div>

      {!isMe && (
        isFollowing ? (
          <button
            onClick={() => userId && onMessage(userId)}
            disabled={!userId || messaging}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 bg-slate-100 text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            {messaging ? '…' : 'Message'}
          </button>
        ) : (
          <button
            onClick={() => userId && onFollowToggle(userId, false)}
            disabled={!userId || pending}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 bg-[#00D431] text-white shadow-sm hover:brightness-105"
          >
            {pending ? '…' : 'Follow'}
          </button>
        )
      )}
    </div>
  );
}

// ─── Tab pills ─────────────────────────────────────────────────────────────────

const TabPill = ({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-[76px] py-3 text-xs font-bold transition-all duration-200 relative whitespace-nowrap px-1 ${
      active ? 'text-[#00D431]' : 'text-slate-500 hover:text-slate-800'
    }`}
  >
    <span className="flex items-center justify-center gap-1">
      {children}
      {count != null && count > 0 && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-[#00D431] text-white' : 'bg-slate-100 text-slate-600'}`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </span>
    {active && (
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-1/2 bg-[#00D431] rounded-full" />
    )}
  </button>
);

// ─── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = ({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-white">
    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-gray-100">
      <span className="material-symbols-outlined text-[32px] text-[#00D431] fill-1">{icon}</span>
    </div>
    <h3 className="font-bold text-slate-800 text-sm mb-1">{title}</h3>
    <p className="text-slate-500 text-xs leading-relaxed max-w-xs">{subtitle}</p>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

type MainTab = 'near_me' | 'following' | 'followers' | 'map';

export default function FriendshipPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<MainTab>('near_me');
  const [search, setSearch] = useState('');
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});
  const [pendingUsers, setPendingUsers] = useState<Set<string>>(new Set());
  const [messagingUsers, setMessagingUsers] = useState<Set<string>>(new Set());
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsRequested, setCoordsRequested] = useState(false);

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

  // Request geo location
  const requestCoords = useCallback(() => {
    if (coordsRequested) return;
    setCoordsRequested(true);
    geoService.getCurrentPosition()
      .then(pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }))
      .catch(() => setUserCoords(null));
  }, [coordsRequested]);

  // Request location for near_me and map tabs
  useEffect(() => {
    if (mainTab === 'near_me' || mainTab === 'map') {
      requestCoords();
    }
  }, [mainTab, requestCoords]);

  const { data: nearbyData, isLoading: loadingNearby } = useQuery({
    queryKey: ['nearby-users', userCoords?.lat, userCoords?.lng],
    queryFn: () =>
      userCoords
        ? geoService.getNearbyUsers(userCoords.lat, userCoords.lng, 15000, 50)
        : null,
    enabled: !!userCoords && mainTab === 'near_me',
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
      if (convId) router.push(`/messages/${convId}`);
    } catch {
      // silent — user can retry
    } finally {
      setMessagingUsers(p => { const s = new Set(p); s.delete(userId); return s; });
    }
  };

  // ── Derived follow lookup ───────────────────────────────────────────────────

  const followers: FollowUser[] = ((followersData?.data as any)?.followers ?? []);
  const following: FollowUser[] = ((followingData?.data as any)?.following ?? []).map((u: any) => ({ ...u, isFollowing: true }));
  const nearbyUsers: FollowUser[] = ((nearbyData?.data as any)?.users ?? []);

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
        (u.firstName + ' ' + u.lastName).toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.lga || '').toLowerCase().includes(q),
    );
  };

  const handleMainTab = (t: MainTab) => {
    setMainTab(t);
    setSearch('');
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

  return (
    <div
      className={`flex flex-col bg-white ${
        mainTab === 'map' ? 'h-[100dvh] overflow-hidden' : 'h-[100dvh] overflow-hidden'
      }`}
    >
      <TopNav />

      {/* Search + tabs */}
      <header className="z-30 shrink-0 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        {mainTab !== 'map' && (
          <div className="px-4 pb-3 pt-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search neighbours…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-[#00D431] focus:outline-none focus:ring-1 focus:ring-[#00D431]"
              />
            </div>
          </div>
        )}

        <div className="flex overflow-x-auto border-b border-gray-100 no-scrollbar scroll-smooth">
          <TabPill active={mainTab === 'near_me'} onClick={() => handleMainTab('near_me')}>
            Near me
          </TabPill>
          <TabPill active={mainTab === 'following'} onClick={() => handleMainTab('following')} count={following.length || undefined}>
            Following
          </TabPill>
          <TabPill active={mainTab === 'followers'} onClick={() => handleMainTab('followers')} count={followers.length || undefined}>
            Followers
          </TabPill>
          <TabPill active={mainTab === 'map'} onClick={() => handleMainTab('map')}>
            Map
          </TabPill>
        </div>
      </header>

      {/* Content */}
      <main
        className={`flex-1 bg-white ${
          mainTab === 'map'
            ? 'relative min-h-0 overflow-hidden'
            : 'feed-scroll-main min-h-0 overflow-y-auto scroll-smooth pb-24'
        }`}
      >
        {/* Near me tab */}
        {mainTab === 'near_me' && (
          <>
            {!userCoords && !loadingNearby && (
              <div className="mx-4 mt-4 p-4 rounded-2xl bg-slate-50 border border-gray-100 flex items-start gap-3 shadow-sm">
                <span className="material-symbols-outlined text-[24px] text-[#00D431] mt-0.5">my_location</span>
                <div>
                  <p className="text-slate-800 text-sm font-bold mb-0.5">Location Access Required</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Allow location access to discover active neighbours near you.
                  </p>
                  <button
                    onClick={requestCoords}
                    className="mt-2.5 px-4 py-2 rounded-xl bg-[#00D431] text-white text-xs font-bold hover:brightness-105 active:scale-95 transition-all"
                  >
                    Enable Location
                  </button>
                </div>
              </div>
            )}
            {renderUserList(
              nearbyUsers,
              loadingNearby,
              'No one found nearby',
              'Expand your search radius on the map, or invite neighbours to join your Huud.',
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

        {mainTab === 'map' && (
          <div className="absolute inset-0">
            <MapComponent embedded />
          </div>
        )}

      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
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
