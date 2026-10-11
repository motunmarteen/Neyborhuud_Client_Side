import { Skeleton, SkeletonPage } from '@/components/ui/Skeleton';

export default function SosLoading() {
  return (
    <SkeletonPage label="Loading SOS">
      <div className="flex flex-col items-center gap-4 py-10">
        <Skeleton className="h-44 w-44 rounded-full" />
        <Skeleton className="h-4 w-48 rounded-full" />
        <Skeleton className="h-3 w-64 rounded-full" />
      </div>
    </SkeletonPage>
  );
}
