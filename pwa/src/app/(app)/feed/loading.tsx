import { SkeletonCards, SkeletonPage } from '@/components/ui/Skeleton';

export default function FeedLoading() {
  return (
    <SkeletonPage label="Loading posts">
      <SkeletonCards count={3} />
    </SkeletonPage>
  );
}
