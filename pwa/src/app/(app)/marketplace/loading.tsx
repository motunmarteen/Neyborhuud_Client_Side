import { SkeletonHeader, SkeletonPage, SkeletonTiles } from '@/components/ui/Skeleton';

export default function MarketplaceLoading() {
  return (
    <SkeletonPage label="Loading marketplace">
      <SkeletonHeader />
      <SkeletonTiles />
    </SkeletonPage>
  );
}
