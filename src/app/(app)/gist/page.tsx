'use client';

/**
 * Huud Gist — top-level community forum pillar.
 * Promoted out of Local News into its own destination. News (RSS) and Gist
 * (discussion) are now separate. Composed from the same gist hooks/components
 * that previously lived in the Local News "Huud Gist" tab.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import type { AxiosError } from 'axios';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { BrowseFilterChip } from '@/components/layout/BrowseFilterChip';
import { CreateHuudGistModal } from '@/components/huud-gist/CreateHuudGistModal';
import { HuudGistRow } from '@/components/huud-gist/HuudGistRow';
import { useHuudGistList } from '@/hooks/useHuudGist';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { parseGistSection } from '@/lib/localNewsConfig';
import { buildGistSectionList } from '@/lib/huudGistConfig';
import { huudGistService } from '@/services/huudGist.service';
import type { GistSection, GistSectionId } from '@/types/huudGist';
import { gistPostId, type HuudGistPost } from '@/types/huudGist';

function GistInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useClientAuthUser();

  const [gistSection, setGistSection] = useState<GistSectionId>(() =>
    parseGistSection(searchParams.get('section')),
  );
  const [gistSections, setGistSections] = useState<GistSection[]>(() => buildGistSectionList([]));
  const [createOpen, setCreateOpen] = useState(false);

  // Load section taxonomy from the API (falls back to local list on failure)
  useEffect(() => {
    void (async () => {
      try {
        const sections = await huudGistService.getSections();
        setGistSections(sections);
      } catch {
        // keep fallback
      }
    })();
  }, []);

  const gistFilters = useMemo(
    () => ({ section: gistSection === 'all' ? undefined : gistSection }),
    [gistSection],
  );

  const {
    data: gistPages,
    isLoading: gistLoading,
    isError: gistIsError,
    error: gistError,
    refetch: refetchGist,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHuudGistList(gistFilters);

  const gistThreads = useMemo(
    () => gistPages?.pages.flatMap((p) => p?.gossip ?? []) ?? [],
    [gistPages],
  );
  const gistAuthRequired =
    gistIsError && (gistError as AxiosError)?.response?.status === 401;

  const { ref: gistLoadMoreRef, inView: gistLoadMoreInView } = useInView({
    threshold: 0,
    rootMargin: '400px',
  });

  useEffect(() => {
    if (gistLoadMoreInView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [gistLoadMoreInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const selectSection = useCallback(
    (section: GistSectionId) => {
      setGistSection(section);
      const params = new URLSearchParams();
      if (section !== 'all') params.set('section', section);
      const q = params.toString();
      router.replace(q ? `/gist?${q}` : '/gist', { scroll: false });
    },
    [router],
  );

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <>
          <div className="flex items-center justify-between px-4 pt-3">
            <h1 className="text-[18px] font-black tracking-tight text-[var(--neu-text)]">Huud Gist</h1>
            <button
              type="button"
              onClick={() => void refetchGist()}
              disabled={gistLoading}
              className="mod-chip mod-chip-active inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-primary disabled:opacity-50"
              aria-label="Refresh"
            >
              <span className={`material-symbols-outlined text-[18px] ${gistLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
          </div>

          <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
            {gistSections.map((section) => (
              <BrowseFilterChip
                key={section.id}
                active={gistSection === section.id}
                onClick={() => selectSection(section.id)}
              >
                {section.label}
              </BrowseFilterChip>
            ))}
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {user ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mod-chip mod-chip-active inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-primary"
          >
            <span className="material-symbols-outlined text-[18px]">edit_square</span>
            Start a Huud Gist thread
          </button>
        ) : (
          <Link
            href="/login?redirect=/gist"
            className="mod-card flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold no-underline"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">login</span>
            Sign in to start a Huud Gist thread
          </Link>
        )}

        {gistLoading ? (
          <div className="mod-card flex flex-col gap-2 rounded-2xl p-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="mod-inset h-[4.5rem] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : gistIsError && !gistAuthRequired ? (
          <BrowseEmptyState
            icon="wifi_off"
            title="Could not load Huud Gist"
            description="Something went wrong. Tap refresh to try again."
            filledIcon
            action={
              <button
                type="button"
                onClick={() => void refetchGist()}
                className="mod-chip mod-chip-active rounded-full px-4 py-2 text-sm font-bold text-primary"
              >
                Retry
              </button>
            }
          />
        ) : gistAuthRequired ? (
          <BrowseEmptyState
            icon="login"
            title="Sign in to view Huud Gist"
            description="Your session may have expired. Sign in again to browse and join threads."
            action={
              <Link
                href="/login?redirect=/gist"
                className="mod-chip mod-chip-active rounded-full px-4 py-2 text-sm font-bold text-primary no-underline"
              >
                Sign in
              </Link>
            }
          />
        ) : gistThreads.length === 0 ? (
          <BrowseEmptyState
            icon="forum"
            title="No Huud Gist threads yet"
            description="Start the conversation — local gist, questions, business talk, and more."
            filledIcon
            action={
              user ? (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mod-chip mod-chip-active rounded-full px-4 py-2 text-sm font-bold text-primary"
                >
                  Start a thread
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div
              className="mod-card divide-y overflow-hidden rounded-2xl"
              style={{ borderColor: 'var(--neu-shadow-dark)' }}
            >
              {gistThreads.map((post: HuudGistPost, index) => (
                <HuudGistRow key={gistPostId(post) || `gist-${index}`} post={post} />
              ))}
            </div>
            {hasNextPage ? (
              <div ref={gistLoadMoreRef} className="flex justify-center py-4">
                {isFetchingNextPage ? (
                  <span className="text-sm font-semibold text-[var(--neu-text-muted)]">Loading more…</span>
                ) : (
                  <div className="h-6" />
                )}
              </div>
            ) : null}
          </>
        )}
      </div>

      <CreateHuudGistModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        sections={gistSections}
        defaultSection={gistSection}
      />
    </AppBrowseLayout>
  );
}

export default function GistPage() {
  return (
    <Suspense
      fallback={
        <div className="neu-base flex min-h-app items-center justify-center p-8 text-sm text-[var(--neu-text-muted)]">
          Loading…
        </div>
      }
    >
      <GistInner />
    </Suspense>
  );
}
