import { Skeleton, SkeletonPage } from '@/components/ui/Skeleton';

export default function ProductLoading() {
  return (
    <SkeletonPage label="Loading item">
      <Skeleton className="aspect-square w-full rounded-[22px]" />
      <div className="flex flex-col gap-3 rounded-[22px] bg-white p-4">
        <Skeleton className="h-5 w-3/4 rounded-full" />
        <Skeleton className="h-7 w-1/3 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-5/6 rounded-full" />
        <Skeleton className="mt-2 h-12 w-full rounded-full" />
      </div>
    </SkeletonPage>
  );
}
