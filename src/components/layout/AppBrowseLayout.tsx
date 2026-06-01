'use client';

import { Suspense, type ReactNode } from 'react';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';

type AppBrowseLayoutProps = {
  children: ReactNode;
  /** Short description under the top nav (page title lives in TopNav). */
  subtitle?: ReactNode;
  /** Toolbar row: search, filters, actions. */
  header?: ReactNode;
  maxWidth?: '680' | '920';
  className?: string;
};

/**
 * Standard in-app shell: sidebar + TopNav + scroll main + right rail + bottom nav.
 * Matches /feed and /jobs (neu-base, mod-* surfaces).
 */
export function AppBrowseLayout({
  children,
  subtitle,
  header,
  maxWidth = '680',
  className = '',
}: AppBrowseLayoutProps) {
  const widthClass = maxWidth === '920' ? 'max-w-[920px]' : 'max-w-[680px]';

  return (
    <div className="relative flex h-app w-full max-w-[100vw] overflow-hidden neu-base">
      <Suspense fallback={<div className="hidden w-64 shrink-0 lg:block" />}>
        <LeftSidebar mode="both" />
      </Suspense>

      <main className="feed-scroll-main flex flex-1 flex-col overflow-y-auto scroll-smooth">
        <TopNav />

        <div
          className={`mx-auto flex w-full ${widthClass} flex-col gap-4 px-4 pt-3 pb-[var(--app-scroll-bottom)] ${className}`.trim()}
        >
          {(subtitle || header) && (
            <div className="browse-toolbar">
              {subtitle ? (
                <div className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
                  {subtitle}
                </div>
              ) : null}
              {header}
            </div>
          )}
          {children}
        </div>
      </main>

      <RightSidebar />

      <Suspense fallback={<div className="h-16 shrink-0 md:hidden" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
