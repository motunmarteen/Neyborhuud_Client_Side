'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { BrowseFilterChip } from '@/components/layout/BrowseFilterChip';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { NewsArticleRow } from '@/components/news/NewsArticleRow';
import {
  LOCAL_NEWS_TABS,
  NEWS_TOPICS,
  NIGERIA_SOURCES,
  INTERNATIONAL_SOURCES,
  parseLocalNewsTab,
  parseNewsTopic,
  filterArticlesByTopic,
  type LocalNewsTab,
  type NewsTopicId,
} from '@/lib/localNewsConfig';
import { newsService } from '@/services/news.service';
import { NewsFxStrip } from '@/components/news/NewsFxStrip';
import type { NewsSource, RssArticle } from '@/types/incident';
import { ErrorState } from '@/components/ui/ErrorState';

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
  const [activeTab, setActiveTab] = useState<LocalNewsTab>(() =>
    parseLocalNewsTab(searchParams.get('tab')),
  );

  const [newsTopic, setNewsTopic] = useState<NewsTopicId>(() =>
    parseNewsTopic(searchParams.get('topic')),
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

  useEffect(() => {
    void (async () => {
      try {
        const categoriesRes = await newsService.getCategories();

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

  const syncUrl = useCallback(
    (tab: LocalNewsTab, topic: NewsTopicId) => {
      const params = new URLSearchParams();
      params.set('tab', tab);
      if (topic !== 'all') params.set('topic', topic);
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
    syncUrl(tab, newsTopic);
    if (tab === 'nigeria' || tab === 'international') loadRss(tab, newsTopic, []);
  };

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <>
          <NewsFxStrip />
          <BrowseTabStrip
            tabs={[...LOCAL_NEWS_TABS]}
            activeId={activeTab}
            onChange={(id) => setTab(id as LocalNewsTab)}
            trailing={
              <button
                type="button"
                onClick={() => loadRss(activeTab, newsTopic, selectedSourceIds)}
                disabled={rssLoading}
                className="mod-chip mod-chip-active inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-primary disabled:opacity-50"
                aria-label="Refresh"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${rssLoading ? 'animate-spin' : ''}`}
                >
                  refresh
                </span>
                <span>Refresh</span>
              </button>
            }
          />

          <>
              <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
                {newsTopics.map((topic) => (
                  <BrowseFilterChip
                    key={topic.id}
                    active={newsTopic === topic.id}
                    onClick={() => {
                      setNewsTopic(topic.id);
                      syncUrl(activeTab, topic.id);
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
        </>
      }
    >
      <div className="space-y-5">
        {rssLoading ? (
          <div className="mod-card flex flex-col gap-2 rounded-2xl p-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="mod-inset h-[4.5rem] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : rssError ? (
          <ErrorState homeHref={null} />
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
