'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { socialService } from '@/services/social.service';
import { useFollowing } from '@/hooks/useFollow';
import { UserListItem } from '@/components/profile/UserListItem';
import {
  ProfileConnectionsEmpty,
  ProfileConnectionsLayout,
  ProfileConnectionsPagination,
} from '@/components/profile/browse/ProfileConnectionsLayout';
import { useState } from 'react';
import { normalizeAuthUser } from '@/lib/userAvatar';
import apiClient from '@/lib/api-client';
import type { FollowerUser } from '@/types/follow';

function resolveProfileUserId(profile: { id?: string; _id?: string } | null | undefined) {
  return profile?.id || profile?._id || null;
}

export default function FollowingPage() {
  const params = useParams();
  const username = params.username as string;
  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
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
          /* fall through */
        }
      }
      return socialService.getUserByUsername(username);
    },
    enabled: !!username,
  });

  const profile = profileData?.data;
  const userId = resolveProfileUserId(profile as { id?: string; _id?: string } | undefined);

  const {
    data: followingData,
    isLoading: isFollowingLoading,
    error: followingError,
  } = useFollowing(userId ?? undefined, page, limit);

  const following: FollowerUser[] =
    (followingData as { data?: { following?: FollowerUser[] } })?.data?.following ?? [];
  const pagination = (followingData as { data?: { pagination?: { page: number; totalPages: number; total: number } } })
    ?.data?.pagination;

  const isLoading = isProfileLoading || isFollowingLoading;
  const error = profileError || followingError;

  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName || profile?.username || username;

  return (
    <ProfileConnectionsLayout
      username={username}
      displayName={displayName}
      activeTab="following"
      isLoading={isLoading}
      error={error}
      emptyTitle="Not following anyone yet"
      emptyDescription={`@${username} isn't following anyone yet.`}
      footer={
        pagination ? (
          <ProfileConnectionsPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            label={pagination.total === 1 ? 'person' : 'people'}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          />
        ) : null
      }
    >
      {following.length === 0 ? (
        <ProfileConnectionsEmpty
          icon="sync_alt"
          title="Not following anyone yet"
          description={`@${username} isn't following anyone yet.`}
        />
      ) : (
        <div
          className="mod-card divide-y overflow-hidden rounded-2xl"
          style={{ borderColor: 'var(--neu-shadow-dark)' }}
        >
          {following.map((user) => (
            <UserListItem key={user._id} user={user} />
          ))}
        </div>
      )}
    </ProfileConnectionsLayout>
  );
}
