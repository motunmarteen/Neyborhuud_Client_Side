'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentService } from '@/services/content.service';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { XPostCard } from '@/components/feed/XPostCard';
import { useAuth } from '@/hooks/useAuth';

export default function PopularPage() {
  const { user } = useAuth();
  const [coords] = useState<{ lat: number; lng: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['popular-feed'],
    queryFn: () =>
      contentService.getLocationFeed(
        coords?.lat ?? 9.0765,
        coords?.lng ?? 7.3986,
        { feedTab: 'street_radar', ranked: true, limit: 30 },
      ),
  });

  const posts = data?.content ?? [];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6 pb-24">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px] text-orange-500">local_fire_department</span>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Trending Nearby</h1>
            </div>
            <p className="text-sm -mt-4" style={{ color: 'var(--neu-text-muted)' }}>
              What's buzzing in your area right now
            </p>

            {isLoading ? (
              <div className="flex flex-col gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: 'var(--neu-card)' }} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <span className="material-symbols-outlined text-[64px] text-gray-300">local_fire_department</span>
                <p className="text-lg font-medium" style={{ color: 'var(--neu-text-muted)' }}>Nothing trending yet</p>
                <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Check back soon</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {posts.map((post: any, idx: number) => (
                  <div key={post.id ?? post._id} className="relative">
                    {idx < 3 && (
                      <div className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {idx + 1}
                      </div>
                    )}
                    <XPostCard
                      post={post}
                      currentUserId={user?.id ?? ''}
                      onLike={() => contentService.likePost(post.id ?? post._id)}
                      onComment={() => {}}
                      onShare={() => {}}
                      onSave={() => contentService.savePost(post.id ?? post._id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
