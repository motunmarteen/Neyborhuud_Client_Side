import { Skeleton, SkeletonList, SkeletonPage } from '@/components/ui/Skeleton';

export default function ExploreLoading() {
  return (
    <SkeletonPage label="Loading">
      <Skeleton className="h-12 w-full rounded-full" />
      <SkeletonList rows={6} />
    </SkeletonPage>
  );
}
