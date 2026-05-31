'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentService } from '@/services/content.service';
import { XPostCard } from '@/components/feed/XPostCard';
import { FeedSkeleton } from '@/components/feed/PostSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';

export default function SavedPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['saved-posts'],
    queryFn: () => contentService.getSavedPosts(1, 40),
    enabled: !!user,
  });

  const posts =
    (data?.data as { posts?: unknown[] })?.posts ??
    (data?.data as { content?: unknown[] })?.content ??
    (data?.data as { data?: unknown[] })?.data ??
    [];

  return (
    <AppBrowseLayout subtitle="Posts you've bookmarked">
      {isLoading ? (
        <FeedSkeleton count={3} />
      ) : posts.length === 0 ? (
        <BrowseEmptyState
          icon="bookmark"
          title="No saved posts yet"
          description="Bookmark posts from your feed to find them here later"
          filledIcon
        />
      ) : (
        <div className="flex flex-col gap-4">
          {(posts as { id?: string; _id?: string }[]).map((post) => (
            <XPostCard
              key={post.id ?? post._id}
              post={post as Parameters<typeof XPostCard>[0]['post']}
              currentUserId={user?.id ?? ''}
              onLike={() => contentService.likePost(post.id ?? post._id ?? '')}
              onComment={() => {}}
              onShare={() => {}}
              onSave={() => contentService.unsavePost(post.id ?? post._id ?? '')}
            />
          ))}
        </div>
      )}
    </AppBrowseLayout>
  );
}
