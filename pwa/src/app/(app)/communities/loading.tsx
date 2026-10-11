import { SkeletonHeader, SkeletonList, SkeletonPage } from '@/components/ui/Skeleton';

export default function CommunitiesLoading() {
  return (
    <SkeletonPage label="Loading communities">
      <SkeletonHeader chips={3} />
      <SkeletonList rows={6} square />
    </SkeletonPage>
  );
}
