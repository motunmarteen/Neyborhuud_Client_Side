import { Skeleton, SkeletonList, SkeletonPage } from '@/components/ui/Skeleton';

export default function HuudEconomyLoading() {
  return (
    <SkeletonPage label="Loading HuudCredit">
      <div className="flex flex-col gap-3 rounded-[22px] bg-white p-5">
        <Skeleton className="h-3.5 w-28 rounded-full" />
        <Skeleton className="h-10 w-40 rounded-full" />
        <Skeleton className="h-3 w-3/4 rounded-full" />
      </div>
      <SkeletonList rows={5} square />
    </SkeletonPage>
  );
}
