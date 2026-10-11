import { SkeletonList, SkeletonPage } from '@/components/ui/Skeleton';

export default function ChatLoading() {
  return (
    <SkeletonPage label="Loading chats">
      <SkeletonList rows={8} />
    </SkeletonPage>
  );
}
