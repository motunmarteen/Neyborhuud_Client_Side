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
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation();
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
          setRssError('load-failed');
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
            tabs={LOCAL_NEWS_TABS.map((tab) => ({ ...tab, label: t(`news.tab.${tab.id}`) }))}
            activeId={activeTab}
            onChange={(id) => setTab(id as LocalNewsTab)}
            trailing={
              <button
                type="button"
                onClick={() => loadRss(activeTab, newsTopic, selectedSourceIds)}
                disabled={rssLoading}
                className="tap-target grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-navy shadow-[0_2px_6px_rgba(29,36,51,0.12)] disabled:opacity-50"
                aria-label={t('news.refresh')}
              >
                <span aria-hidden className={`material-symbols-outlined text-[18px] ${rssLoading ? 'animate-spin motion-reduce:animate-none' : ''}`}>
                  refresh
                </span>
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
                    {t(`news.topic.${topic.id}`) === `news.topic.${topic.id}` ? topic.label : t(`news.topic.${topic.id}`)}
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
                  {t('news.allSources')}
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
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-white motion-reduce:animate-none" />
            ))}
          </div>
        ) : rssError ? (
          <ErrorState homeHref={null} />
        ) : articles.length === 0 ? (
          <BrowseEmptyState
            icon="newspaper"
            title={t('news.emptyTitle')}
            description={t('news.emptyBody')}
            filledIcon
          />
        ) : (
          <div className="flex flex-col gap-2">
            {articles.map((article) => (
              <NewsArticleRow key={article.id} article={article} />
            ))}
          </div>
        )}

        {isRssTab && !rssLoading && !rssError && articles.length > 0 ? (
          <p className="text-center text-[11px] font-semibold text-muted">{t('news.openNote')}</p>
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
