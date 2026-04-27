'use client';

import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentService } from '@/services/content.service';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { XPostCard } from '@/components/feed/XPostCard';
import { useAuth } from '@/hooks/useAuth';

export default function SavedPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['saved-posts'],
    queryFn: () => contentService.getSavedPosts(1, 40),
    enabled: !!user,
  });

  const posts = (data?.data as any)?.posts ?? (data?.data as any)?.content ?? (data?.data as any)?.data ?? [];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-64" />}>
          <LeftSidebar />
        </Suspense>
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6 pb-24">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Saved Posts</h1>

            {isLoading ? (
              <div className="flex flex-col gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: 'var(--neu-card)' }} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <span className="material-symbols-outlined text-[64px] text-gray-300">bookmark_border</span>
                <p className="text-lg font-medium" style={{ color: 'var(--neu-text-muted)' }}>No saved posts yet</p>
                <p className="text-sm text-center max-w-xs" style={{ color: 'var(--neu-text-muted)' }}>
                  Bookmark posts to find them here later
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {posts.map((post: any) => (
                  <XPostCard
                    key={post.id ?? post._id}
                    post={post}
                    currentUserId={user?.id ?? ''}
                    onLike={() => contentService.likePost(post.id ?? post._id)}
                    onComment={() => {}}
                    onShare={() => {}}
                    onSave={() => contentService.unsavePost(post.id ?? post._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
        <RightSidebar />
      </div>
      <Suspense fallback={<div className="h-16" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
