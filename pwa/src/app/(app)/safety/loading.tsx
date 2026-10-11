import { Skeleton, SkeletonPage } from '@/components/ui/Skeleton';

export default function SafetyLoading() {
  return (
    <SkeletonPage label="Loading safety tools">
      <Skeleton className="h-24 w-full rounded-[22px]" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[22px]" />
        ))}
      </div>
    </SkeletonPage>
  );
}
