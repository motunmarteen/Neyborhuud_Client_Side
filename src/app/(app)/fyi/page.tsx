/**
 * FYI Bulletin Page — community announcements hub (Huud Economy shell pattern).
 */

'use client';

import { useState, useCallback, useRef, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import {
  LocalHuudHubHeader,
  LocalHuudHubPrimaryAction,
} from '@/components/local-huud/LocalHuudHubHeader';
import { FYISubtypeTabs, FYISubtype } from '@/components/fyi/FYISubtypeTabs';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { FYICard } from '@/components/fyi/FYICard';
import { useFYIList } from '@/hooks/useFYI';
import { useAuth } from '@/hooks/useAuth';
import { Post } from '@/types/api';
import { FeedCommentsSheet } from '@/components/feed/FeedCommentsSheet';
import { usePostMutations } from '@/hooks/usePosts';
import { ReportModal } from '@/components/feed/ReportModal';
import { contentService } from '@/services/content.service';

function FYIPageInner() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [subtypeFilter, setSubtypeFilter] = useState<FYISubtype>('');
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentsAnchor, setCommentsAnchor] = useState<{ left: number; width: number } | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { deletePost } = usePostMutations();
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
  } = useFYIList({ type: subtypeFilter || undefined });

  const posts: Post[] = data?.pages?.flatMap((page) => page?.fyi || []) || [];

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['fyi'] });
    queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
  };

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

  const handleDeletePost = async () => {
    if (!deletingPostId) return;
    try {
      await deletePost(deletingPostId);
      setDeletingPostId(null);
      queryClient.invalidateQueries({ queryKey: ['fyi'] });
    } catch (error) {
      console.error('Delete fyi bulletin error:', error);
    }
  };

  return (
    <>
      <AppBrowseLayout
        maxWidth="680"
        header={
          <LocalHuudHubHeader
            hubId="fyi"
            toolbar={
              <div className="space-y-3">
                <div className="flex justify-end">
                  <LocalHuudHubPrimaryAction
                    label="Post bulletin"
                    onClick={() => setIsCreateModalOpen(true)}
                  />
                </div>
                <FYISubtypeTabs activeSubtype={subtypeFilter} onSubtypeChange={setSubtypeFilter} />
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
            title="Failed to load bulletins"
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
            icon="campaign"
            title="No bulletins yet"
            description="Be the first to share a community announcement in your Huud."
            action={
              <LocalHuudHubPrimaryAction
                label="Post bulletin"
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
                <FYICard
                  post={post}
                  currentUserId={user?.id}
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
                  onDelete={(id) => setDeletingPostId(id)}
                  onReport={(id) => setReportingPostId(id)}
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

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        defaultContentType="fyi"
        lockContentType
        defaultFyiSubtype={subtypeFilter || undefined}
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

      {/* Report Modal */}
      {reportingPostId && (
        <ReportModal
          postId={reportingPostId}
          onClose={() => setReportingPostId(null)}
          onSubmit={async (postId, reason, description) => {
            await contentService.reportPost(postId, reason, description);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeletingPostId(null)}>
          <div className="mod-modal rounded-2xl p-6 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--neu-text)' }}>Delete Bulletin</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--neu-text-muted)' }}>
              Are you sure you want to delete this bulletin? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingPostId(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold mod-chip"
                style={{ color: 'var(--neu-text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-brand-red/20 text-brand-red mod-chip hover:bg-brand-red/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function FYIPage() {
  return (
    <Suspense
      fallback={
        <div className="mod-card mx-auto mt-8 h-24 max-w-[680px] animate-pulse rounded-2xl" />
      }
    >
      <FYIPageInner />
    </Suspense>
  );
}
