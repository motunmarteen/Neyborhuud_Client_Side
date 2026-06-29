'use client';

import { useState, useEffect } from 'react';
import { newsService } from '@/services/news.service';
import type { RssArticle } from '@/types/incident';
import { formatTimeAgo } from '@/utils/timeAgo';
import { 
  DiscoveryChrome, 
  StakeCard, 
  CategoryCoverCard,
  AutoScrollCarousel
} from '@/components/feed/FeedDiscoveryBlock';

export function FeedNewsCarouselBlock() {
  const [articles, setArticles] = useState<RssArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if previously dismissed
    const isDismissed = localStorage.getItem('nh_news_carousel_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const items = await newsService.getArticles({
          region: 'nigeria',
          limit: 4,
        });
        if (!cancelled) setArticles(items);
      } catch (err) {
        // Fallback
        const fallbackSources = [
          { id: 'punch', name: 'Punch' },
          { id: 'vanguard', name: 'Vanguard' },
          { id: 'channels', name: 'Channels TV' },
        ];
        try {
          const fallback = await newsService.getMultipleFeeds(fallbackSources, 4);
          if (!cancelled) setArticles(fallback);
        } catch {
          // ignore
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('nh_news_carousel_dismissed', 'true');
  };

  if (dismissed || (!loading && articles.length === 0)) {
    return null;
  }



  return (
    <div className="w-full">
      <DiscoveryChrome 
        icon="flash_on" 
        label="News Flash" 
        href="/local-news?tab=nigeria"
      >
        <AutoScrollCarousel interval={2500}>
          {loading ? (
            // Loading skeleton matching StakeCard style
            Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i} 
                className="horizontal-carousel-item relative overflow-hidden rounded-none shrink-0"
                style={{ width: 200, aspectRatio: '1/1' }}
              >
                <div className="w-full h-full bg-black/5 dark:bg-white/5 animate-pulse" />
                <div className="absolute inset-x-0 bottom-0 p-2.5 space-y-2">
                  <div className="h-3 w-3/4 rounded-none bg-black/10 dark:bg-white/10 animate-pulse" />
                  <div className="h-2 w-1/2 rounded-none bg-black/10 dark:bg-white/10 animate-pulse" />
                </div>
              </div>
            ))
          ) : (
            <>
              <CategoryCoverCard
                imageSrc="/illustration_fyi.png"
                title="Top Stories"
                subtitle="National Headlines"
                buttonLabel="Read News"
                buttonHref="/local-news?tab=nigeria"
                gradient="linear-gradient(135deg, rgba(var(--brand-primary-rgb), 0.8) 0%, rgba(var(--brand-blue-rgb), 0.6) 100%)"
                width={200}
              />
              {articles.map((art) => {
                const image = art.imageUrl;
                return (
                  <StakeCard
                    key={art.id}
                    href={art.link || '#'}
                    imageSrc={image}
                    fallbackIcon="newspaper"
                    fallbackGradient="linear-gradient(135deg, #1a2a3a 0%, #2a3a5a 100%)"
                    topBadge={
                      <span className="rounded-none bg-brand-red/80 px-2 py-0.5 text-[8px] font-black uppercase text-white/90 backdrop-blur-sm shadow-sm">
                        {art.region === 'international' ? 'Global' : 'Nigeria'} • {art.sourceName || art.source || 'News'}
                      </span>
                    }
                    title={art.title}
                    subtitle={art.sourceName || art.source || 'News'}
                    statDot="#ff453a"
                    statText={art.pubDate ? formatTimeAgo(art.pubDate) : 'Recent'}
                    width={200}
                  />
                );
              })}
            </>
          )}
        </AutoScrollCarousel>
      </DiscoveryChrome>
    </div>
  );
}
