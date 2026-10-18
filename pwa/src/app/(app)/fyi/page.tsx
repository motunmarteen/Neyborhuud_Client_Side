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
import { XPostCard } from '@/components/feed/XPostCard';
import { PostDetailsModal } from '@/components/feed/PostDetailsModal';
import { fyiService } from '@/services/fyi.service';
import { useFYIList } from '@/hooks/useFYI';
import { useAuth } from '@/hooks/useAuth';
import { Post } from '@/types/api';
import { FeedCommentsSheet } from '@/components/feed/FeedCommentsSheet';
import { usePostMutations } from '@/hooks/usePosts';
import { ReportModal } from '@/components/feed/ReportModal';
import { contentService } from '@/services/content.service';
import { ErrorState } from '@/components/ui/ErrorState';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { useTranslation } from '@/lib/i18n';

function FYIPageInner() {
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [subtypeFilter, setSubtypeFilter] = useState<FYISubtype>('');
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentsAnchor, setCommentsAnchor] = useState<{ left: number; width: number } | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { deletePost, likePost, unlikePost, savePost, unsavePost } = usePostMutations();
  const [detailsPostId, setDetailsPostId] = useState<string | null>(null);
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

  // The same post card as the Feed (F-13). FYI notices react with "Helpful".
  const patchFyi = (postId: string, patch: (p: Post) => Post) =>
    queryClient.setQueriesData({ queryKey: ['fyi'] }, (old: unknown) => {
      const o = old as { pages?: { fyi?: Post[] }[] } | undefined;
      if (!o?.pages) return old;
      return { ...o, pages: o.pages.map((pg) => ({ ...pg, fyi: (pg.fyi || []).map((p) => (p.id === postId ? patch(p) : p)) })) };
    });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['fyi'] });
    queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
  };
  const toggleHelpful = async (post: Post) => {
    const was = post.isHelpful === true;
    patchFyi(post.id, (p) => ({ ...p, isHelpful: !was, helpfulCount: Math.max(0, ((p.helpfulCount as number | undefined) ?? 0) + (was ? -1 : 1)) }));
    try {
      await fyiService.markHelpful(post.id);
    } finally {
      refresh();
    }
  };
  const toggleLike = async (post: Post) => {
    try {
      if (post.isLiked) await unlikePost(post.id);
      else await likePost(post.id);
    } finally {
      refresh();
    }
  };
  const toggleSave = async (post: Post) => {
    try {
      if (post.isSaved) await unsavePost(post.id);
      else await savePost(post.id);
    } finally {
      refresh();
    }
  };

  return (
    <>
      <AppBrowseLayout
        maxWidth="680"
        header={
          <LocalHuudHubHeader
            hubId="fyi"
            action={<LocalHuudHubPrimaryAction label={t('fyi.post')} onClick={() => setIsCreateModalOpen(true)} />}
            toolbar={<FYISubtypeTabs activeSubtype={subtypeFilter} onSubtypeChange={setSubtypeFilter} />}
          />
        }
      >
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white motion-reduce:animate-none" />
            ))}
          </div>
        )}

        {isError && (
          <ErrorState onRetry={() => refetch()} homeHref={null} />
        )}

        {!isLoading && !isError && posts.length === 0 && (
          <BrowseEmptyState
            icon="campaign"
            title={t('fyi.emptyTitle')}
            description={t('fyi.emptyBody')}
            action={<LocalHuudHubPrimaryAction label={t('fyi.post')} onClick={() => setIsCreateModalOpen(true)} />}
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
                <XPostCard
                  post={post}
                  currentUserId={user?.id}
                  onLike={() => void toggleLike(post)}
                  onHelpful={() => void toggleHelpful(post)}
                  onSave={() => void toggleSave(post)}
                  onShare={() => undefined}
                  onComment={() => {
                    const el = document.querySelector(`[data-comment-anchor="post-${post.id}"]`) as HTMLElement | null;
                    if (el) {
                      const rect = el.getBoundingClientRect();
                      setCommentsAnchor({ left: rect.left, width: rect.width });
                    } else {
                      setCommentsAnchor(null);
                    }
                    setCommentsPostId(post.id);
                  }}
                  onDelete={(id) => setDeletingPostId(id)}
                  onReport={(id) => setReportingPostId(id)}
                  onCardClick={() => setDetailsPostId(post.id)}
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

      <PostDetailsModal postId={detailsPostId} isOpen={!!detailsPostId} onClose={() => setDetailsPostId(null)} />

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
      <AppBottomSheet
        open={!!deletingPostId}
        onClose={() => setDeletingPostId(null)}
        title={t('fyi.deleteTitle')}
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setDeletingPostId(null)} className="min-h-12 flex-1 rounded-full bg-white text-sm font-extrabold text-navy ring-1 ring-line">
              {t('common.cancel')}
            </button>
            <button type="button" onClick={handleDeletePost} className="min-h-12 flex-1 rounded-full bg-brand-red text-sm font-extrabold text-white">
              {t('fyi.delete')}
            </button>
          </div>
        }
      >
        <p className="text-sm font-semibold text-muted">{t('fyi.deleteBody')}</p>
      </AppBottomSheet>
    </>
  );
}

export default function FYIPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-8 h-24 max-w-[680px] animate-pulse rounded-2xl bg-white motion-reduce:animate-none" />
      }
    >
      <FYIPageInner />
    </Suspense>
  );
}
