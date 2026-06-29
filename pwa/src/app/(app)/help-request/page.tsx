/**
 * Help Request Page — community support hub (Huud Economy shell pattern).
 */

'use client';

import { useState, useCallback, useRef, Suspense } from 'react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import {
  LocalHuudHubHeader,
  LocalHuudHubPrimaryAction,
} from '@/components/local-huud/LocalHuudHubHeader';
import { HelpRequestCategoryTabs, HelpRequestCategory } from '@/components/help-request/HelpRequestCategoryTabs';
import CreateHelpRequestModal from '@/components/help-request/CreateHelpRequestModal';
import { HelpRequestCard } from '@/components/help-request/HelpRequestCard';
import { useHelpRequestList } from '@/hooks/useHelpRequest';
import { Post } from '@/types/api';
import { FeedCommentsSheet } from '@/components/feed/FeedCommentsSheet';

function HelpRequestPageInner() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<HelpRequestCategory>('');
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentsAnchor, setCommentsAnchor] = useState<{ left: number; width: number } | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHelpRequestList({ category: categoryFilter || undefined });

  const posts: Post[] = data?.pages?.flatMap((page) => page?.helpRequests || []) || [];

  const lastPostRef = useCallback(
    (node: HTMLElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  return (
    <>
      <AppBrowseLayout
        maxWidth="680"
        header={
          <LocalHuudHubHeader
            hubId="help-request"
            toolbar={
              <div className="space-y-3">
                <div className="flex justify-end">
                  <LocalHuudHubPrimaryAction
                    label="Post request"
                    onClick={() => setIsCreateModalOpen(true)}
                  />
                </div>
                <HelpRequestCategoryTabs
                  activeCategory={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                />
              </div>
            }
          />
        }
      >
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mod-card h-40 animate-pulse rounded-2xl" />
            ))}
          </div>
        )}

        {isError && (
          <BrowseEmptyState
            icon="warning"
            title="Failed to load help requests"
            description={error instanceof Error ? error.message : undefined}
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="mod-chip mod-chip-active rounded-xl px-5 py-2.5 text-sm font-bold text-primary"
              >
                Retry
              </button>
            }
          />
        )}

        {!isLoading && !isError && posts.length === 0 && (
          <BrowseEmptyState
            icon="volunteer_activism"
            title="No help requests yet"
            description="Ask your neighbours for support or check back soon."
            action={
              <LocalHuudHubPrimaryAction
                label="Post request"
                onClick={() => setIsCreateModalOpen(true)}
              />
            }
          />
        )}

        <div className="flex flex-col gap-4">
          {posts.map((post, index) => {
            const postId = post.id || `${index}`;
            const isLast = index === posts.length - 1;
            return (
              <div
                key={postId}
                ref={isLast ? lastPostRef : undefined}
                data-comment-anchor={`post-${postId}`}
              >
                <HelpRequestCard
                  post={post}
                  onComment={(id) => {
                    const el = document.querySelector(
                      `[data-comment-anchor="post-${id}"]`,
                    ) as HTMLElement | null;
                    if (el) {
                      const rect = el.getBoundingClientRect();
                      setCommentsAnchor({ left: rect.left, width: rect.width });
                    } else {
                      setCommentsAnchor(null);
                    }
                    setCommentsPostId(id);
                  }}
                />
              </div>
            );
          })}
        </div>

        {isFetchingNextPage ? (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : null}
      </AppBrowseLayout>

      <CreateHelpRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <FeedCommentsSheet
        isOpen={!!commentsPostId}
        target={commentsPostId ? { kind: 'post', id: commentsPostId } : null}
        desktopAnchor={commentsAnchor}
        onClose={() => {
          setCommentsPostId(null);
          setCommentsAnchor(null);
        }}
      />
    </>
  );
}

export default function HelpRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="mod-card mx-auto mt-8 h-24 max-w-[680px] animate-pulse rounded-2xl" />
      }
    >
      <HelpRequestPageInner />
    </Suspense>
  );
}
