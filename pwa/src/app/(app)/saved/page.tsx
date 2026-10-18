'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentService } from '@/services/content.service';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { FilterChip } from '@/components/ui/Chip';
import { useTranslation } from '@/lib/i18n';
import { BrowseSearchField } from '@/components/layout/BrowseSearchField';
import { SavedPostRow } from '@/components/feed/SavedPostRow';
import { getPostId } from '@/components/feed/TrendingPostRow';
import { RefreshCw } from 'lucide-react';
import type { ContentType, Post } from '@/types/api';

type ContentFilter = 'all' | ContentType;

/** One row of filters (Phase 4 restyle): the label keys live in the locale files. */
const FILTERS: { id: ContentFilter; key: string }[] = [
  { id: 'all', key: 'saved.f.all' },
  { id: 'post', key: 'saved.f.post' },
  { id: 'fyi', key: 'saved.f.fyi' },
  { id: 'job', key: 'saved.f.job' },
  { id: 'event', key: 'saved.f.event' },
  { id: 'marketplace', key: 'saved.f.marketplace' },
  { id: 'help_request', key: 'saved.f.help_request' },
];

function parseSavedPosts(data: unknown): Post[] {
  if (!data || typeof data !== 'object') return [];
  const root = data as { data?: unknown };
  const inner = root.data;

  if (Array.isArray(inner)) return inner as Post[];

  if (inner && typeof inner === 'object') {
    const nested = inner as Record<string, unknown>;
    if (Array.isArray(nested.posts)) return nested.posts as Post[];
    if (Array.isArray(nested.content)) return nested.content as Post[];
    if (Array.isArray(nested.data)) return nested.data as Post[];
  }

  return [];
}

function postSearchText(post: Post) {
  const author = post.author;
  const name =
    author && 'name' in author && author.name
      ? author.name
      : [author && 'firstName' in author ? author.firstName : '', author && 'lastName' in author ? author.lastName : '']
          .filter(Boolean)
          .join(' ');
  return [post.content, post.body, name, author?.username, post.contentType]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function SavedToolbarSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
        ))}
      </div>
      <div className="h-11 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
    </div>
  );
}

export default function SavedPage() {
  const { t } = useTranslation();
  const { user, mounted } = useClientAuthUser();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ContentFilter>('all');
  const [search, setSearch] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['saved-posts'],
    queryFn: () => contentService.getSavedPosts(1, 40),
    enabled: !!user,
  });

  const allPosts = useMemo(() => parseSavedPosts(data), [data]);

  const filteredPosts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allPosts
      .filter((post) => {
        if (filter !== 'all' && (post.contentType ?? 'post') !== filter) return false;
        if (needle && !postSearchText(post).includes(needle)) return false;
        return true;
      })
      .sort((a, b) => {
        const aTime = new Date((a as { createdAt?: string }).createdAt ?? 0).getTime();
        const bTime = new Date((b as { createdAt?: string }).createdAt ?? 0).getTime();
        return bTime - aTime;
      });
  }, [allPosts, filter, search]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of allPosts) {
      const key = post.contentType ?? 'post';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [allPosts]);

  const unsaveMutation = useMutation({
    mutationFn: (postId: string) => contentService.unsavePost(postId),
    onMutate: async (postId) => {
      setRemovingId(postId);
      await queryClient.cancelQueries({ queryKey: ['saved-posts'] });
      const previous = queryClient.getQueryData(['saved-posts']);
      queryClient.setQueryData(['saved-posts'], (old: unknown) => {
        const posts = parseSavedPosts(old).filter((p) => getPostId(p) !== postId);
        if (!old || typeof old !== 'object') return old;
        const root = old as { data?: unknown };
        if (Array.isArray(root.data)) {
          return { ...root, data: posts };
        }
        if (root.data && typeof root.data === 'object') {
          const nested = root.data as Record<string, unknown>;
          if (Array.isArray(nested.posts)) {
            return { ...root, data: { ...nested, posts } };
          }
          if (Array.isArray(nested.content)) {
            return { ...root, data: { ...nested, content: posts } };
          }
        }
        return old;
      });
      return { previous };
    },
    onError: (_err, _postId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['saved-posts'], context.previous);
      }
    },
    onSettled: () => {
      setRemovingId(null);
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    },
  });


  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        !mounted ? (
          <SavedToolbarSkeleton />
        ) : user ? (
          <>
            <div className="flex items-center gap-2">
              <div role="tablist" aria-label={t('saved.title')} className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-1">
                {FILTERS.filter((f) => f.id === 'all' || f.id === filter || (typeCounts.get(f.id) ?? 0) > 0 || allPosts.length === 0).map((f) => (
                  <FilterChip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)} count={f.id === 'all' ? undefined : typeCounts.get(f.id)}>
                    {t(f.key)}
                  </FilterChip>
                ))}
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="tap-target grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-navy shadow-[0_2px_6px_rgba(29,36,51,0.12)] disabled:opacity-50"
                aria-label={t('saved.refresh')}
              >
                <RefreshCw size={16} className={isFetching ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden />
              </button>
            </div>
            <BrowseSearchField value={search} onChange={setSearch} placeholder={t('saved.search')} />
          </>
        ) : undefined
      }
    >
      {!mounted ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[5.5rem] animate-pulse rounded-2xl bg-white motion-reduce:animate-none" />
          ))}
        </div>
      ) : !user ? (
        <BrowseEmptyState
          icon="login"
          title={t('saved.signInTitle')}
          description={t('saved.signInBody')}
          filledIcon
          action={
            <Link
              href="/huud?login=1&next=/saved"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-extrabold text-white"
            >
              {t('saved.signIn')}
            </Link>
          }
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[5.5rem] animate-pulse rounded-2xl bg-white motion-reduce:animate-none" />
          ))}
        </div>
      ) : allPosts.length === 0 ? (
        <BrowseEmptyState
          icon="bookmark"
          title={t('saved.emptyTitle')}
          description={t('saved.emptyBody')}
          filledIcon
          action={
            <Link
              href="/feed"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-extrabold text-white"
            >
              {t('saved.goFeed')}
            </Link>
          }
        />
      ) : filteredPosts.length === 0 ? (
        <BrowseEmptyState
          icon="search_off"
          title={t('saved.noMatchTitle')}
          description={t('saved.noMatchBody')}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-bold text-muted">
            {filteredPosts.length === allPosts.length
              ? t(allPosts.length === 1 ? 'saved.count_one' : 'saved.count_other', { n: allPosts.length })
              : t('saved.showing', { n: filteredPosts.length, total: allPosts.length })}
          </p>
          <div>
            <div className="flex flex-col gap-2">
              {filteredPosts.map((post, index) => {
                const id = getPostId(post);
                return (
                  <SavedPostRow
                    key={id || `saved-${index}`}
                    post={post}
                    onUnsave={(postId) => unsaveMutation.mutate(postId)}
                    isRemoving={removingId === id}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AppBrowseLayout>
  );
}
