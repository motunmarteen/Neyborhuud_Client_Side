import { SkeletonList, SkeletonPage } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <SkeletonPage label="Loading settings">
      <SkeletonList rows={4} square />
      <SkeletonList rows={4} square />
    </SkeletonPage>
  );
}
