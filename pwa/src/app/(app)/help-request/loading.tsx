import { SkeletonCards, SkeletonHeader, SkeletonPage } from '@/components/ui/Skeleton';

export default function HelpRequestLoading() {
  return (
    <SkeletonPage label="Loading help requests">
      <SkeletonHeader chips={3} />
      <SkeletonCards count={3} photo={false} />
    </SkeletonPage>
  );
}
