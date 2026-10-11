import { SkeletonHeader, SkeletonPage, SkeletonTiles } from '@/components/ui/Skeleton';

export default function EventsLoading() {
  return (
    <SkeletonPage label="Loading events">
      <SkeletonHeader />
      <SkeletonTiles />
    </SkeletonPage>
  );
}
