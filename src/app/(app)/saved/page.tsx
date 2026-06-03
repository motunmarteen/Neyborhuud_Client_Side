'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentService } from '@/services/content.service';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { BrowseFilterChip } from '@/components/layout/BrowseFilterChip';
import { BrowseSearchField } from '@/components/layout/BrowseSearchField';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { SavedPostRow } from '@/components/feed/SavedPostRow';
import { getPostId } from '@/components/feed/TrendingPostRow';
import type { ContentType, Post } from '@/types/api';

type ContentFilter = 'all' | ContentType;

const VIEW_TABS = [
  { id: 'all', label: 'All', icon: 'bookmark' },
  { id: 'post', label: 'Posts', icon: 'article' },
  { id: 'fyi', label: 'FYI', icon: 'info' },
  { id: 'job', label: 'Jobs', icon: 'work' },
] as const;

const EXTRA_FILTERS: { id: ContentFilter; label: string }[] = [
  { id: 'event', label: 'Events' },
  { id: 'marketplace', label: 'Market' },
  { id: 'help_request', label: 'Help' },
];

function StatCard({
  icon,
  label,
  value,
  tone = 'primary',
}: {
  icon: string;
  label: string;
  value: string | number;
  tone?: 'primary' | 'blue';
}) {
  const toneClass =
    tone === 'blue' ? 'text-brand-blue bg-brand-blue/10' : 'text-primary bg-primary/15';

  return (
    <div className="mod-card flex items-center gap-3 rounded-xl p-4">
      <div className={`mod-inset flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}>
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--neu-text)' }}>
          {value}
        </p>
        <p className="text-xs text-[var(--neu-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

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
      <div className="mod-card h-[2.75rem] animate-pulse rounded-2xl" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="mod-inset h-9 w-20 animate-pulse rounded-full" />
        ))}
      </div>
      <div className="mod-inset h-10 animate-pulse rounded-xl" />
    </div>
  );
}

export default function SavedPage() {
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
            <BrowseTabStrip
              tabs={[...VIEW_TABS]}
              activeId={VIEW_TABS.some((t) => t.id === filter) ? filter : 'all'}
              onChange={(id) => setFilter(id as ContentFilter)}
              trailing={
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="mod-chip mod-chip-active inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-primary disabled:opacity-50"
                  aria-label="Refresh saved posts"
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${isFetching ? 'animate-spin' : ''}`}
                    aria-hidden
                  >
                    refresh
                  </span>
                  <span>{isFetching ? 'Loading' : 'Refresh'}</span>
                </button>
              }
            />

            <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
              {EXTRA_FILTERS.map((item) => (
                <BrowseFilterChip
                  key={item.id}
                  active={filter === item.id}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                  {(typeCounts.get(item.id) ?? 0) > 0 ? (
                    <span className="ml-1 opacity-70">({typeCounts.get(item.id)})</span>
                  ) : null}
                </BrowseFilterChip>
              ))}
            </div>

            <BrowseSearchField
              value={search}
              onChange={setSearch}
              placeholder="Search saved posts…"
            />
          </>
        ) : undefined
      }
    >
      {!mounted ? (
        <div className="mod-card flex flex-col gap-2 rounded-2xl p-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mod-inset h-[5.5rem] animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !user ? (
        <BrowseEmptyState
          icon="login"
          title="Sign in to view saved posts"
          description="Bookmark posts from your feed and they'll appear here."
          filledIcon
          action={
            <Link
              href="/login"
              className="mod-chip mod-chip-active inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold text-primary"
            >
              Sign in
            </Link>
          }
        />
      ) : isLoading ? (
        <div className="mod-card flex flex-col gap-2 rounded-2xl p-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mod-inset h-[5.5rem] animate-pulse rounded-xl" />
          ))}
        </div>
      ) : allPosts.length === 0 ? (
        <BrowseEmptyState
          icon="bookmark"
          title="No saved posts yet"
          description="Bookmark posts from your feed to find them here later."
          filledIcon
          action={
            <Link
              href="/feed"
              className="mod-chip mod-chip-active inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold text-primary"
            >
              Browse feed
            </Link>
          }
        />
      ) : filteredPosts.length === 0 ? (
        <BrowseEmptyState
          icon="search_off"
          title="No matches"
          description="Try a different filter or search term."
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon="bookmark" label="Total saved" value={allPosts.length} />
            <StatCard
              icon="filter_list"
              label="Showing now"
              value={filteredPosts.length}
              tone="blue"
            />
          </div>

          <div>
            <h2 className="mb-3 text-base font-bold" style={{ color: 'var(--neu-text)' }}>
              Your bookmarks
            </h2>
            <div
              className="mod-card divide-y overflow-hidden rounded-2xl"
              style={{ borderColor: 'var(--neu-shadow-dark)' }}
            >
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
