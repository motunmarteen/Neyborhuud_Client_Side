import { SkeletonCards, SkeletonHeader, SkeletonPage } from '@/components/ui/Skeleton';

export default function SavedLoading() {
  return (
    <SkeletonPage label="Loading saved posts">
      <SkeletonHeader chips={3} />
      <SkeletonCards count={3} photo={true} />
    </SkeletonPage>
  );
}
