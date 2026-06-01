'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import type { AxiosError } from 'axios';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { BrowseFilterChip } from '@/components/layout/BrowseFilterChip';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { CreateHuudGistModal } from '@/components/huud-gist/CreateHuudGistModal';
import { HuudGistRow } from '@/components/huud-gist/HuudGistRow';
import { NewsArticleRow } from '@/components/news/NewsArticleRow';
import { useHuudGistList } from '@/hooks/useHuudGist';
import { useAuth } from '@/hooks/useAuth';
import {
  LOCAL_NEWS_TABS,
  NEWS_TOPICS,
  NIGERIA_SOURCES,
  INTERNATIONAL_SOURCES,
  parseGistSection,
  parseLocalNewsTab,
  parseNewsTopic,
  filterArticlesByTopic,
  type LocalNewsTab,
  type NewsTopicId,
} from '@/lib/localNewsConfig';
import { buildGistSectionList } from '@/lib/huudGistConfig';
import { huudGistService } from '@/services/huudGist.service';
import { newsService } from '@/services/news.service';
import type { GistSection, GistSectionId } from '@/types/huudGist';
import type { NewsSource, RssArticle } from '@/types/incident';
import { gistPostId, type HuudGistPost } from '@/types/huudGist';

function sourcesForRegion(
  tab: LocalNewsTab,
  nigeria: NewsSource[],
  international: NewsSource[],
): NewsSource[] {
  if (tab === 'nigeria') return nigeria;
  if (tab === 'international') return international;
  return [];
}

function LocalNewsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LocalNewsTab>(() =>
    parseLocalNewsTab(searchParams.get('tab')),
  );
  const [gistSection, setGistSection] = useState<GistSectionId>(() =>
    parseGistSection(searchParams.get('section')),
  );
  const [newsTopic, setNewsTopic] = useState<NewsTopicId>(() =>
    parseNewsTopic(searchParams.get('topic')),
  );
  const [gistSections, setGistSections] = useState<GistSection[]>(() =>
    buildGistSectionList([]),
  );
  const [newsTopics, setNewsTopics] = useState<Array<{ id: NewsTopicId; label: string }>>([
    ...NEWS_TOPICS.map(({ id, label }) => ({ id, label })),
  ]);
  const [nigeriaSources, setNigeriaSources] = useState<NewsSource[]>(NIGERIA_SOURCES);
  const [internationalSources, setInternationalSources] =
    useState<NewsSource[]>(INTERNATIONAL_SOURCES);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [rssLoading, setRssLoading] = useState(false);
  const [rssError, setRssError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [categoriesRes, sections] = await Promise.all([
          newsService.getCategories(),
          huudGistService.getSections(),
        ]);

        setGistSections(sections);

        const categories = categoriesRes.data?.categories;
        if (categories?.length) {
          const ng = categories.find((c) => c.key === 'nigeria')?.sources;
          const intl = categories.find((c) => c.key === 'international')?.sources;
          if (ng?.length) setNigeriaSources(ng);
          if (intl?.length) setInternationalSources(intl);
        }

        const topics = categoriesRes.data?.topics;
        if (topics?.length) {
          setNewsTopics(topics.map((t) => ({ id: t.id as NewsTopicId, label: t.label })));
        }
      } catch {
        // Keep local fallbacks when API is unreachable
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

  const syncUrl = useCallback(
    (tab: LocalNewsTab, section: GistSectionId, topic: NewsTopicId) => {
      const params = new URLSearchParams();
      params.set('tab', tab);
      if (tab === 'huud-gist' && section !== 'all') params.set('section', section);
      if (tab !== 'huud-gist' && topic !== 'all') params.set('topic', topic);
      router.replace(`/local-news?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const loadRss = useCallback(
    async (tab: LocalNewsTab, topic: NewsTopicId, sourceIds: string[]) => {
      if (tab !== 'nigeria' && tab !== 'international') return;

      setRssLoading(true);
      setRssError(null);

      try {
        const results = await newsService.getArticles({
          region: tab,
          topic,
          sources: sourceIds.length > 0 ? sourceIds : undefined,
          limit: 12,
        });
        setArticles(results);
      } catch {
        const pool = sourcesForRegion(tab, nigeriaSources, internationalSources).filter(
          (s) => sourceIds.length === 0 || sourceIds.includes(s.id),
        );
        try {
          const fallback = await newsService.getMultipleFeeds(pool, 12);
          setArticles(filterArticlesByTopic(fallback, topic));
        } catch {
          setRssError('Failed to load news. Please try again.');
        }
      } finally {
        setRssLoading(false);
      }
    },
    [nigeriaSources, internationalSources],
  );

  useEffect(() => {
    setActiveTab(parseLocalNewsTab(searchParams.get('tab')));
    setGistSection(parseGistSection(searchParams.get('section')));
    setNewsTopic(parseNewsTopic(searchParams.get('topic')));
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'nigeria' || activeTab === 'international') {
      loadRss(activeTab, newsTopic, selectedSourceIds);
    }
  }, [activeTab, newsTopic, selectedSourceIds, loadRss]);

  const sources = sourcesForRegion(activeTab, nigeriaSources, internationalSources);
  const isRssTab = activeTab === 'nigeria' || activeTab === 'international';

  const setTab = (tab: LocalNewsTab) => {
    setActiveTab(tab);
    setSelectedSourceIds([]);
    syncUrl(tab, gistSection, newsTopic);
    if (tab === 'nigeria' || tab === 'international') loadRss(tab, newsTopic, []);
  };

  const topicLabel = newsTopics.find((t) => t.id === newsTopic)?.label;

  const subtitle =
    activeTab === 'huud-gist'
      ? `Huud Gist · ${gistThreads.length} thread${gistThreads.length === 1 ? '' : 's'}`
      : activeTab === 'nigeria'
        ? `Nigeria · ${articles.length} stories${newsTopic !== 'all' ? ` · ${topicLabel}` : ''}`
        : `International · ${articles.length} stories${newsTopic !== 'all' ? ` · ${topicLabel}` : ''}`;

  return (
    <AppBrowseLayout
      maxWidth="680"
      subtitle={
        <span className="inline-flex min-w-0 items-center gap-2">
          <span className="material-symbols-outlined shrink-0 text-xl text-primary">newspaper</span>
          <span className="truncate">{subtitle}</span>
        </span>
      }
      header={
        <>
          <BrowseTabStrip
            tabs={[...LOCAL_NEWS_TABS]}
            activeId={activeTab}
            onChange={(id) => setTab(id as LocalNewsTab)}
            trailing={
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'huud-gist') void refetchGist();
                  else loadRss(activeTab, newsTopic, selectedSourceIds);
                }}
                disabled={activeTab === 'huud-gist' ? gistLoading : rssLoading}
                className="mod-chip mod-chip-active inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-primary disabled:opacity-50"
                aria-label="Refresh"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${gistLoading || rssLoading ? 'animate-spin' : ''}`}
                >
                  refresh
                </span>
                <span className="hidden min-[420px]:inline">Refresh</span>
              </button>
            }
          />

          {activeTab === 'huud-gist' ? (
            <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
              {gistSections.map((section) => (
                <BrowseFilterChip
                  key={section.id}
                  active={gistSection === section.id}
                  onClick={() => {
                    setGistSection(section.id);
                    syncUrl(activeTab, section.id, newsTopic);
                  }}
                >
                  {section.label}
                </BrowseFilterChip>
              ))}
            </div>
          ) : (
            <>
              <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
                {newsTopics.map((topic) => (
                  <BrowseFilterChip
                    key={topic.id}
                    active={newsTopic === topic.id}
                    onClick={() => {
                      setNewsTopic(topic.id);
                      syncUrl(activeTab, gistSection, topic.id);
                      loadRss(activeTab, topic.id, selectedSourceIds);
                    }}
                  >
                    {topic.label}
                  </BrowseFilterChip>
                ))}
              </div>
              <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
                <BrowseFilterChip
                  active={selectedSourceIds.length === 0}
                  onClick={() => {
                    setSelectedSourceIds([]);
                    loadRss(activeTab, newsTopic, []);
                  }}
                >
                  All sources
                </BrowseFilterChip>
                {sources.map((src) => (
                  <BrowseFilterChip
                    key={src.id}
                    active={selectedSourceIds.includes(src.id)}
                    onClick={() => {
                      const next = selectedSourceIds.includes(src.id)
                        ? selectedSourceIds.filter((id) => id !== src.id)
                        : [...selectedSourceIds, src.id];
                      setSelectedSourceIds(next);
                      loadRss(activeTab, newsTopic, next);
                    }}
                  >
                    {src.name}
                  </BrowseFilterChip>
                ))}
              </div>
            </>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {activeTab === 'huud-gist' ? (
          <>
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
                href="/login?redirect=/local-news?tab=huud-gist"
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
                    href="/login?redirect=/local-news?tab=huud-gist"
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
                      <span className="text-sm font-semibold text-[var(--neu-text-muted)]">
                        Loading more…
                      </span>
                    ) : (
                      <div className="h-6" />
                    )}
                  </div>
                ) : null}
              </>
            )}
          </>
        ) : rssLoading ? (
          <div className="mod-card flex flex-col gap-2 rounded-2xl p-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="mod-inset h-[4.5rem] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : rssError ? (
          <BrowseEmptyState icon="wifi_off" title="Could not load news" description={rssError} filledIcon />
        ) : articles.length === 0 ? (
          <BrowseEmptyState
            icon="newspaper"
            title="No articles in this section"
            description="Try another topic or source, or tap Refresh."
            filledIcon
          />
        ) : (
          <div
            className="mod-card divide-y overflow-hidden rounded-2xl"
            style={{ borderColor: 'var(--neu-shadow-dark)' }}
          >
            {articles.map((article) => (
              <NewsArticleRow key={article.id} article={article} />
            ))}
          </div>
        )}

        {isRssTab && !rssLoading && !rssError && articles.length > 0 ? (
          <p className="text-center text-[11px] text-[var(--neu-text-muted)]">
            Headlines open on the publisher site
          </p>
        ) : null}
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

export default function LocalNewsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-app items-center justify-center neu-base">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LocalNewsInner />
    </Suspense>
  );
}
