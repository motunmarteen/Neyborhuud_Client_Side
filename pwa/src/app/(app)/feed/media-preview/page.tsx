'use client';

import Link from 'next/link';
import TopNav from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/feed/BottomNav';
import { XPostCard } from '@/components/feed/XPostCard';
import {
  FEED_MEDIA_PREVIEW_SAMPLES,
  FEED_REPOST_PREVIEW_SAMPLES,
} from '@/lib/feedPreviewSamples';

const noop = () => {};

function PreviewSection({
  title,
  description,
  samples,
}: {
  title: string;
  description: string;
  samples: Array<{ id: string; label: string; hint: string; post: Parameters<typeof XPostCard>[0]['post'] }>;
}) {
  return (
    <section className="mb-8">
      <div className="mx-4 mb-3">
        <h2 className="text-base font-black text-neu-text dark:text-white">{title}</h2>
        <p className="mt-1 text-sm text-neu-text-secondary dark:text-white/60">{description}</p>
      </div>
      <div className="flex flex-col border-t border-black/[0.06] dark:border-white/[0.06]">
        {samples.map((sample) => (
          <div key={sample.id} aria-labelledby={`${sample.id}-label`}>
            <div className="mx-4 my-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] px-3 py-2 border border-black/[0.05] dark:border-white/[0.06]">
              <p id={`${sample.id}-label`} className="text-[11px] font-black uppercase tracking-wide text-neu-text dark:text-white/90">
                {sample.label}
              </p>
              <p className="text-[11px] text-neu-text-secondary dark:text-white/50 mt-0.5">{sample.hint}</p>
            </div>
            <XPostCard
              post={sample.post}
              currentUserId="preview-viewer"
              onLike={noop}
              onComment={noop}
              onShare={noop}
              onSave={noop}
              onReposted={noop}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FeedMediaPreviewPage() {
  return (
    <div className="min-h-screen bg-[var(--neu-bg)] pb-28">
      <TopNav />

      <main className="mx-auto w-full max-w-[580px] px-0 md:px-2 pt-2">
        <div className="mx-4 mb-4 rounded-2xl border border-primary/20 bg-primary/[0.06] p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-primary">Feed preview</p>
          <h1 className="mt-1 text-lg font-black text-neu-text dark:text-white">Media & repost layouts</h1>
          <p className="mt-2 text-sm text-neu-text-secondary dark:text-white/65 leading-relaxed">
            Review samples here before testing on the live feed. Tap the repost icon on any card to open the quote composer.
          </p>
          <Link
            href="/feed"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to live feed
          </Link>
        </div>

        <PreviewSection
          title="Repost / quote"
          description="Quote reposts show your comment plus an embedded original post — like X."
          samples={FEED_REPOST_PREVIEW_SAMPLES}
        />

        <PreviewSection
          title="Media slider"
          description="Single, dual, and carousel media inside post cards."
          samples={FEED_MEDIA_PREVIEW_SAMPLES}
        />
      </main>

      <BottomNav />
    </div>
  );
}
