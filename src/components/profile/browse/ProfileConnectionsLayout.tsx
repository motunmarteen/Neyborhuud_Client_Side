'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';

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
  displayName,
  activeTab,
  isLoading,
  error,
  emptyTitle,
  emptyDescription,
  children,
  footer,
}: ProfileConnectionsLayoutProps) {
  const router = useRouter();

  return (
    <AppBrowseLayout
      maxWidth="680"
      subtitle={
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className="material-symbols-outlined shrink-0 text-xl text-primary">group</span>
          <span className="truncate">
            @{username} · {displayName}
          </span>
        </span>
      }
      header={
        <BrowseTabStrip
          tabs={TABS}
          activeId={activeTab}
          onChange={(id) => {
            const path =
              id === 'followers'
                ? `/profile/${username}/followers`
                : `/profile/${username}/following`;
            router.push(path);
          }}
          trailing={
            <button
              type="button"
              onClick={() => router.back()}
              className="mod-chip inline-flex h-9 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
          }
        />
      }
    >
      {isLoading ? (
        <div className="mod-card divide-y overflow-hidden rounded-2xl">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-black/5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-black/5" />
                <div className="h-3 w-24 animate-pulse rounded bg-black/5" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <BrowseEmptyState
          icon="error"
          title="Could not load list"
          description="Something went wrong. Please try again."
          action={
            <button
              type="button"
              onClick={() => router.back()}
              className="mod-chip mod-chip-active rounded-full px-4 py-2 text-sm font-bold text-primary"
            >
              Go back
            </button>
          }
        />
      ) : (
        <>
          {children}
          {footer}
        </>
      )}
    </AppBrowseLayout>
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
    <BrowseEmptyState icon={icon} title={title} description={description} filledIcon />
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
    <div className="mt-4 space-y-3">
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={page === 1}
            className="mod-chip inline-flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-40"
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="text-sm text-[var(--neu-text-muted)]">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={page === totalPages}
            className="mod-chip inline-flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-40"
            aria-label="Next page"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      ) : null}
      {total > 0 ? (
        <p className="text-center text-sm text-[var(--neu-text-muted)]">
          {total.toLocaleString()} {label}
        </p>
      ) : null}
    </div>
  );
}
