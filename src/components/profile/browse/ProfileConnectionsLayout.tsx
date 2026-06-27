'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import TopNav from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/feed/BottomNav';

type ConnectionTab = 'followers' | 'following';

const TABS: { id: ConnectionTab; label: string; icon: string }[] = [
  { id: 'followers', label: 'Followers', icon: 'group' },
  { id: 'following', label: 'Following', icon: 'sync_alt' },
];

type ProfileConnectionsLayoutProps = {
  username: string;
  displayName: string;
  activeTab: ConnectionTab;
  isLoading: boolean;
  error: unknown;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function ProfileConnectionsLayout({
  username,
  activeTab,
  isLoading,
  error,
  children,
  footer,
}: ProfileConnectionsLayoutProps) {
  const router = useRouter();

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-white overflow-hidden">
      <TopNav />

      <div className="app-chrome-below-topnav mx-auto w-full max-w-[600px] !bg-white flex flex-col flex-1 overflow-hidden">
        {/* Tab Bar Container */}
        <div className="relative bg-white border-b border-gray-100/80 shrink-0">
          <div className="flex items-center justify-between px-6 pt-4 pb-4">
            <div className="flex gap-6">
              {TABS.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      const path =
                        t.id === 'followers'
                          ? `/profile/${username}/followers`
                          : `/profile/${username}/following`;
                      router.push(path);
                    }}
                    className={`text-[13px] font-bold uppercase tracking-wider transition-colors py-1 ${
                      active ? 'text-slate-800 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-8 items-center justify-center rounded-full bg-slate-50 border border-slate-100 px-3.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Go back"
            >
              Back
            </button>
          </div>

          {/* Dynamic Active Tab Line Indicator */}
          <div
            className={`absolute bottom-0 h-[2.5px] transition-all duration-300 bg-blue-600 shadow-[0_1px_8px_rgba(37,99,235,0.4)] ${
              activeTab === 'followers' ? 'left-6 w-20' : 'left-32 w-16'
            }`}
          />
        </div>

        {/* Scrollable list stream */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24 !mt-0 !pt-0">
          {isLoading ? (
            <div className="divide-y divide-slate-150">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3.5 px-6 py-4">
                  <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-55" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-10">
              <BrowseEmptyState
                icon="error"
                title="Could not load list"
                description="Something went wrong. Please try again."
                className="!border-0 !shadow-none !bg-white"
                action={
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 px-5 py-2 text-xs font-bold shadow-sm transition"
                  >
                    Go back
                  </button>
                }
              />
            </div>
          ) : (
            <>
              {children}
              {footer}
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export function ProfileConnectionsEmpty({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <BrowseEmptyState
      icon={icon}
      title={title}
      description={description}
      filledIcon
      className="!border-0 !shadow-none !bg-white py-12"
    />
  );
}

export function ProfileConnectionsPagination({
  page,
  totalPages,
  total,
  label,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1 && total <= 0) return null;

  return (
    <div className="mt-6 space-y-3 pb-6 border-t border-slate-100 pt-4">
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={page === 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 border border-slate-100 disabled:opacity-40"
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="text-sm font-semibold text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={page === totalPages}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 border border-slate-100 disabled:opacity-40"
            aria-label="Next page"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      ) : null}
      {total > 0 ? (
        <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">
          {total.toLocaleString()} {label}
        </p>
      ) : null}
    </div>
  );
}
