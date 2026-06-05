import { FeedSkeleton } from '@/components/feed/PostSkeleton';

export default function FeedLoading() {
  return (
    <div className="flex flex-col gap-5 pt-[var(--app-topnav-offset)]">
      <FeedSkeleton count={2} />
    </div>
  );
}
