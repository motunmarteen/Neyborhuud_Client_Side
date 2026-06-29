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
import TopNav from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/feed/BottomNav';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { CreateHuudGistModal } from '@/components/huud-gist/CreateHuudGistModal';
import { HuudGistRow } from '@/components/huud-gist/HuudGistRow';
import { useHuudGistList } from '@/hooks/useHuudGist';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { parseGistSection } from '@/lib/localNewsConfig';
import { buildGistSectionList } from '@/lib/huudGistConfig';
import { huudGistService } from '@/services/huudGist.service';
import type { GistSection, GistSectionId } from '@/types/huudGist';
import { gistPostId, type HuudGistPost } from '@/types/huudGist';

const ACCENT_PALETTE = [
  { color: 'bg-blue-600', text: 'text-blue-600', bgSoft: 'bg-blue-50' },
  { color: 'bg-purple-600', text: 'text-purple-600', bgSoft: 'bg-purple-50' },
  { color: 'bg-emerald-600', text: 'text-emerald-600', bgSoft: 'bg-emerald-50' },
  { color: 'bg-pink-600', text: 'text-pink-600', bgSoft: 'bg-pink-50' },
  { color: 'bg-rose-500', text: 'text-rose-500', bgSoft: 'bg-rose-50' },
  { color: 'bg-orange-500', text: 'text-orange-500', bgSoft: 'bg-orange-50' },
  { color: 'bg-teal-600', text: 'text-teal-600', bgSoft: 'bg-teal-50' },
  { color: 'bg-indigo-600', text: 'text-indigo-600', bgSoft: 'bg-indigo-50' },
  { color: 'bg-amber-600', text: 'text-amber-600', bgSoft: 'bg-amber-50' },
  { color: 'bg-lime-600', text: 'text-lime-600', bgSoft: 'bg-lime-50' },
  { color: 'bg-sky-500', text: 'text-sky-500', bgSoft: 'bg-sky-50' },
  { color: 'bg-violet-600', text: 'text-violet-600', bgSoft: 'bg-violet-50' },
];

const GIST_ACCENTS: Record<string, { color: string; text: string; bgSoft: string }> = {
  all: { color: 'bg-[#00D431]', text: 'text-[#00D431]', bgSoft: 'bg-[#00D431]/10' },
  local_gist: { color: 'bg-blue-600', text: 'text-blue-600', bgSoft: 'bg-blue-50' },
  community_question: { color: 'bg-purple-600', text: 'text-purple-600', bgSoft: 'bg-purple-50' },
  business_inquiry: { color: 'bg-emerald-600', text: 'text-emerald-600', bgSoft: 'bg-emerald-50' },
};

const getGistSectionAccent = (secId: string) => {
  if (GIST_ACCENTS[secId]) return GIST_ACCENTS[secId];
  let hash = 0;
  for (let i = 0; i < secId.length; i++) {
    hash = secId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % ACCENT_PALETTE.length;
  return ACCENT_PALETTE[idx];
};

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
    <div className="flex flex-1 w-full !h-[100dvh] !min-h-[100dvh] flex-col overflow-hidden !bg-white">
      <TopNav />

      <div className="app-chrome-below-topnav mx-auto w-full max-w-[600px] !bg-white flex flex-col flex-1 overflow-hidden">
        {/* Header/Tabs Container */}
        <div className="z-30 bg-white shrink-0">
          <div className="relative pl-4 pt-3 pb-3 border-b border-gray-100">
            <div className="flex items-start gap-4 overflow-x-auto pt-1 pb-2 no-scrollbar pr-8">
              {gistSections.map((section) => {
                const active = gistSection === section.id;
                const accent = getGistSectionAccent(section.id);
                return (
                  <button
                    key={section.id}
                    onClick={() => selectSection(section.id)}
                    className="flex flex-col items-center justify-start gap-2 bg-transparent transition-transform active:opacity-60 w-[22vw] max-w-[80px] shrink-0"
                  >
                    <div className={`w-[52px] h-[52px] rounded-full ${active ? accent.color + ' text-white shadow-md' : accent.bgSoft + ' ' + accent.text + ' hover:opacity-85'} flex items-center justify-center shrink-0 transition-all duration-200`}>
                      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'wght' 300" }}>{section.icon || 'forum'}</span>
                    </div>
                    <span className="text-[12px] font-medium text-gray-800 text-center leading-tight tracking-tight break-words px-1">{section.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Dynamic Accent Line */}
            <div className={`absolute bottom-0 left-0 right-0 h-[2.5px] transition-all duration-300 ${getGistSectionAccent(gistSection).color}`} />
          </div>
        </div>

        {/* Scrollable Discussions Stream */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24 !mt-0 !pt-0">
          <div className="flex flex-col">
            {/* Discussion Actions Subheader */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">Discussions</span>
                <button
                  type="button"
                  onClick={() => void refetchGist()}
                  disabled={gistLoading}
                  className="flex items-center justify-center h-6 w-6 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 text-slate-400 hover:text-slate-650"
                  aria-label="Refresh"
                >
                  <span className={`material-symbols-outlined text-[16px] ${gistLoading ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                </button>
              </div>
              {user ? (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="rounded-full bg-primary hover:bg-brand-green-dark px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                >
                  Start a thread
                </button>
              ) : (
                <Link
                  href="/login?redirect=/gist"
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors no-underline shadow-sm"
                >
                  Sign in to post
                </Link>
              )}
            </div>

            {gistLoading ? (
              <div className="flex flex-col bg-white border-b border-gray-100">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4.5 border-b border-gray-100 last:border-b-0 animate-pulse">
                    <div className="h-10 w-10 shrink-0 rounded-2xl bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-slate-100" />
                      <div className="h-3 w-3/4 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : gistIsError && !gistAuthRequired ? (
              <BrowseEmptyState
                icon="wifi_off"
                title="Could not load Huud Gist"
                description="Something went wrong. Tap refresh to try again."
                filledIcon
                className="flex flex-col items-center justify-center text-center gap-3 !border-none !bg-transparent !shadow-none !px-6 !my-0 py-10"
                action={
                  <button
                    type="button"
                    onClick={() => void refetchGist()}
                    className="rounded-full bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-2 text-xs font-bold text-slate-700"
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
                className="flex flex-col items-center justify-center text-center gap-3 !border-none !bg-transparent !shadow-none !px-6 !my-0 py-10"
                action={
                  <Link
                    href="/login?redirect=/gist"
                    className="rounded-full bg-primary hover:bg-brand-green-dark px-4 py-2 text-xs font-bold text-white no-underline shadow-sm transition-colors"
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
                className="flex flex-col items-center justify-center text-center gap-3 !border-none !bg-transparent !shadow-none !px-6 !my-0 py-10"
                action={
                  user ? (
                    <button
                      type="button"
                      onClick={() => setCreateOpen(true)}
                      className="rounded-full bg-primary hover:bg-brand-green-dark px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
                    >
                      Start a thread
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <div className="flex flex-col bg-white border-b border-gray-100">
                  {gistThreads.map((post: HuudGistPost, index) => (
                    <HuudGistRow key={gistPostId(post) || `gist-${index}`} post={post} />
                  ))}
                </div>
                {hasNextPage ? (
                  <div ref={gistLoadMoreRef} className="flex justify-center py-6">
                    {isFetchingNextPage ? (
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading more…</span>
                    ) : (
                      <div className="h-6" />
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <CreateHuudGistModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        sections={gistSections}
        defaultSection={gistSection}
      />
      <BottomNav />
    </div>
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
