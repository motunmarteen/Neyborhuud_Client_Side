'use client';

import React from 'react';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { useAuth } from '@/hooks/useAuth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CommunitiesPage() {
  const { user } = useAuth();
  const assignedCommunity = (user as any)?.assignedCommunityId ?? (user as any)?.communityId;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6 pb-24">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px] text-purple-500">groups</span>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Communities</h1>
            </div>

            {assignedCommunity && (
              <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'var(--neu-card)', border: '1px solid var(--neu-border)' }}>
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px] text-purple-500">home</span>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-purple-500">Your Community</p>
                  <p className="font-semibold mt-0.5" style={{ color: 'var(--neu-text)' }}>{assignedCommunity}</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl p-10 flex flex-col items-center gap-4 text-center" style={{ background: 'var(--neu-card)', border: '1px solid var(--neu-border)' }}>
              <span className="material-symbols-outlined text-[64px] text-purple-300">groups</span>
              <h2 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>Community Browser</h2>
              <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
                Discover and join communities near you. This feature is coming soon — you&apos;ll be able to browse,
                join, and participate in neighborhood communities around your area.
              </p>
              <div className="mt-2 px-4 py-2 rounded-full text-sm font-medium text-purple-500" style={{ background: 'var(--neu-card)', border: '1px solid var(--neu-border)' }}>
                Coming Soon
              </div>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
