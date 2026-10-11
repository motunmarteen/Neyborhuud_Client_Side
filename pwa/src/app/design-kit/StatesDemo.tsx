'use client';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonCards, SkeletonList, SkeletonTiles } from '@/components/ui/Skeleton';

export function StatesDemo() {
  return (
    <div className="flex flex-col gap-4 rounded-[22px] bg-background p-3">
      <EmptyState
        icon="🛒"
        title="Nothing for sale here yet"
        description="Be the first to sell something to your neighbours."
        action={{ label: 'Sell something', onClick: () => {} }}
      />
      <div className="rounded-[22px] bg-white">
        <ErrorState onRetry={() => {}} homeHref={null} />
      </div>
      <SkeletonList rows={2} />
      <SkeletonCards count={1} />
      <SkeletonTiles count={2} />
    </div>
  );
}
