'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentService } from '@/services/content.service';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { XPostCard } from '@/components/feed/XPostCard';
import { useAuth } from '@/hooks/useAuth';

export default function NeighborhoodPage() {
  const { user } = useAuth();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 9.0765, lng: 7.3986 }), // Abuja fallback
      );
    } else {
      setCoords({ lat: 9.0765, lng: 7.3986 });
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['neighborhood-feed', coords?.lat, coords?.lng],
    queryFn: () =>
      contentService.getLocationFeed(
        coords!.lat,
        coords!.lng,
        { feedTab: 'your_huud', limit: 30 },
      ),
    enabled: !!coords,
  });

  const posts = data?.content ?? [];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-64" />}>
          <LeftSidebar />
        </Suspense>
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6 pb-24">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px] text-green-500">home_pin</span>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>My Huud</h1>
            </div>
            <p className="text-sm -mt-4" style={{ color: 'var(--neu-text-muted)' }}>
              Posts from your immediate neighborhood
            </p>

            {isLoading || !coords ? (
              <div className="flex flex-col gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: 'var(--neu-card)' }} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <span className="material-symbols-outlined text-[64px] text-gray-300">home_pin</span>
                <p className="text-lg font-medium" style={{ color: 'var(--neu-text-muted)' }}>Nothing in your area yet</p>
                <p className="text-sm text-center max-w-xs" style={{ color: 'var(--neu-text-muted)' }}>
                  Be the first to share something in your neighborhood
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
                    onSave={() => contentService.savePost(post.id ?? post._id)}
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
