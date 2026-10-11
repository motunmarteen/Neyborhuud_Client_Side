import { SkeletonList, SkeletonPage } from '@/components/ui/Skeleton';

export default function NotificationsLoading() {
  return (
    <SkeletonPage label="Loading notifications">
      <SkeletonList rows={8} />
    </SkeletonPage>
  );
}
