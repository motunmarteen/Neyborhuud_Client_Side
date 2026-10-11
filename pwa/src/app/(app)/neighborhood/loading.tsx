import { SkeletonCards, SkeletonHeader, SkeletonPage } from '@/components/ui/Skeleton';

export default function NeighborhoodLoading() {
  return (
    <SkeletonPage label="Loading your area">
      <SkeletonHeader chips={3} />
      <SkeletonCards count={3} photo={true} />
    </SkeletonPage>
  );
}
