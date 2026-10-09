'use client';

import Image from 'next/image';
import { Newspaper, ExternalLink } from 'lucide-react';
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
      className="group flex items-start gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-[#12161A] border border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12] shadow-sm hover:shadow transition-all active:scale-[0.99]"
    >
      {article.imageUrl ? (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-white/[0.04]">
          <Image
            src={article.imageUrl}
            alt=""
            width={64}
            height={64}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-[#00C830]">
          <Newspaper size={24} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-black/[0.04] dark:border-white/[0.04]">
            {article.sourceName}
          </span>
          {date ? (
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {date}
            </span>
          ) : null}
        </div>

        <p className="line-clamp-2 text-sm font-extrabold leading-snug text-slate-900 dark:text-white group-hover:text-[#00C830] transition-colors">
          {article.title}
        </p>

        {article.description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {article.description}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 p-1 rounded-lg text-slate-400 group-hover:text-[#00C830] transition-colors">
        <ExternalLink size={16} />
      </div>
    </a>
  );
}
