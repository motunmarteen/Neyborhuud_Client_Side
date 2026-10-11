import { SkeletonHeader, SkeletonPage, SkeletonTiles } from '@/components/ui/Skeleton';

export default function JobsLoading() {
  return (
    <SkeletonPage label="Loading jobs">
      <SkeletonHeader />
      <SkeletonTiles />
    </SkeletonPage>
  );
}
