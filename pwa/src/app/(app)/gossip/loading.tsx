import { SkeletonCards, SkeletonHeader, SkeletonPage } from '@/components/ui/Skeleton';

export default function GossipLoading() {
  return (
    <SkeletonPage label="Loading gist">
      <SkeletonHeader chips={0} />
      <SkeletonCards count={3} photo={false} />
    </SkeletonPage>
  );
}
