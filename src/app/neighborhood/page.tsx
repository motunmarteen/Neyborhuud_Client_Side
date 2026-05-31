'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentService } from '@/services/content.service';
import { XPostCard } from '@/components/feed/XPostCard';
import { FeedSkeleton } from '@/components/feed/PostSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';

export default function NeighborhoodPage() {
  const { user } = useAuth();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 9.0765, lng: 7.3986 }),
      );
    } else {
      setCoords({ lat: 9.0765, lng: 7.3986 });
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['neighborhood-feed', coords?.lat, coords?.lng],
    queryFn: () =>
      contentService.getLocationFeed(coords!.lat, coords!.lng, { feedTab: 'your_huud', limit: 30 }),
    enabled: !!coords,
  });

  const posts = data?.content ?? [];

  return (
    <AppBrowseLayout subtitle="Posts from your Huud">
      {isLoading || !coords ? (
        <FeedSkeleton count={5} />
      ) : posts.length === 0 ? (
        <BrowseEmptyState
          icon="home_pin"
          title="Nothing in your area yet"
          description="Be the first to share something in your Huud"
          filledIcon
        />
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post: { id?: string; _id?: string }) => (
            <XPostCard
              key={post.id ?? post._id}
              post={post as Parameters<typeof XPostCard>[0]['post']}
              currentUserId={user?.id ?? ''}
              onLike={() => contentService.likePost(post.id ?? post._id ?? '')}
              onComment={() => {}}
              onShare={() => {}}
              onSave={() => contentService.savePost(post.id ?? post._id ?? '')}
            />
          ))}
        </div>
      )}
    </AppBrowseLayout>
  );
}
