import { Skeleton, SkeletonCards, SkeletonPage } from '@/components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <SkeletonPage label="Loading profile">
      <div className="flex flex-col items-center gap-3 rounded-[22px] bg-white p-5">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="h-3 w-24 rounded-full" />
        <div className="flex gap-6 pt-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-14 rounded-xl" />
          ))}
        </div>
      </div>
      <SkeletonCards count={2} />
    </SkeletonPage>
  );
}
