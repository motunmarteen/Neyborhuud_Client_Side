'use client';

import type { RssArticle } from '@/types/incident';

type NewsArticleRowProps = {
  article: RssArticle;
};

export function NewsArticleRow({ article }: NewsArticleRowProps) {
  const date = article.pubDate
    ? new Date(article.pubDate).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-black/[0.02]"
    >
      {article.imageUrl ? (
        <div className="mod-inset h-14 w-14 shrink-0 overflow-hidden rounded-xl">
          <img
            src={article.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="mod-inset flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
          <span
            className="material-symbols-outlined text-[22px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden
          >
            newspaper
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="mod-chip shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-[var(--neu-text-muted)]">
            {article.sourceName}
          </span>
          {date ? (
            <span className="text-[10px] text-[var(--neu-text-muted)]">{date}</span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug" style={{ color: 'var(--neu-text)' }}>
          {article.title}
        </p>
        {article.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[var(--neu-text-muted)]">
            {article.description}
          </p>
        ) : null}
      </div>

      <span className="material-symbols-outlined mt-1 shrink-0 text-[20px] text-primary" aria-hidden>
        open_in_new
      </span>
    </a>
  );
}
