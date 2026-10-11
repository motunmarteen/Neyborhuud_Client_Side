import { SkeletonCards } from '@/components/ui/Skeleton';

/** One post-shaped placeholder (F-09). `index` alternates the photo so a list looks natural. */
export function PostSkeleton({ index = 0 }: { index?: number }) {
  return <SkeletonCards count={1} photo={index % 2 === 0} />;
}

/** Several post-shaped placeholders, announced once as "Loading posts". */
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading posts" className="flex flex-col gap-3">
      <SkeletonCards count={count} />
    </div>
  );
}
