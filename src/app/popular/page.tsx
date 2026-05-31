'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentService } from '@/services/content.service';
import { XPostCard } from '@/components/feed/XPostCard';
import { FeedSkeleton } from '@/components/feed/PostSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';

export const dynamic = 'force-dynamic';

export default function PopularPage() {
  const { user } = useAuth();
  const [coords] = useState<{ lat: number; lng: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['popular-feed'],
    queryFn: () =>
      contentService.getLocationFeed(coords?.lat ?? 9.0765, coords?.lng ?? 7.3986, {
        feedTab: 'street_radar',
        ranked: true,
        limit: 30,
      }),
  });

  const posts = data?.content ?? [];

  return (
    <AppBrowseLayout subtitle="What's buzzing in your area right now">
      {isLoading ? (
        <FeedSkeleton count={5} />
      ) : posts.length === 0 ? (
        <BrowseEmptyState
          icon="local_fire_department"
          title="Nothing trending yet"
          description="Check back soon for what's hot in your Huud"
          filledIcon
        />
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post: { id?: string; _id?: string }, idx: number) => (
            <div key={post.id ?? post._id} className="relative">
              {idx < 3 && (
                <div className="absolute -left-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white shadow-md">
                  {idx + 1}
                </div>
              )}
              <XPostCard
                post={post as Parameters<typeof XPostCard>[0]['post']}
                currentUserId={user?.id ?? ''}
                onLike={() => contentService.likePost(post.id ?? post._id ?? '')}
                onComment={() => {}}
                onShare={() => {}}
                onSave={() => contentService.savePost(post.id ?? post._id ?? '')}
              />
            </div>
          ))}
        </div>
      )}
    </AppBrowseLayout>
  );
}
