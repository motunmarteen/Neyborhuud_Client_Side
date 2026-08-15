'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useHubCommunityByConversation, useJoinHubCommunity } from '@/hooks/useHubCommunities';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';

type CommunityChatBannerProps = {
  conversationId: string;
};

export function CommunityChatBanner({ conversationId }: CommunityChatBannerProps) {
  const router = useRouter();
  const { user, mounted } = useClientAuthUser();
  const { data } = useHubCommunityByConversation(conversationId);
  const joinMutation = useJoinHubCommunity();

  const hub = data?.data?.hub;
  if (!hub) return null;

  const handleJoin = async () => {
    if (!user) {
      router.push(`/login?redirect=/chat/${conversationId}`);
      return;
    }
    try {
      const res = await joinMutation.mutateAsync(hub.id);
      if (res.data?.pending) {
        toast.success('Join request sent — waiting for admin approval');
        return;
      }
      const cid = res.data?.conversationId ?? hub.conversationId;
      if (cid && cid !== conversationId) {
        router.replace(`/chat/${cid}`);
      }
    } catch {
      toast.error('Could not join');
    }
  };

  return (
    <div className="border-b border-gray-100 bg-slate-50 px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-700">
            {hub.name}
            <span className="ml-2 font-normal text-slate-500">
              · {hub.membersCount.toLocaleString()} members
            </span>
          </p>
          {hub.largeGroupMode ? (
            <p className="text-[11px] text-status-warning">Large group — notifications for admins first</p>
          ) : null}
          {!hub.joined && mounted ? (
            <p className="text-[11px] text-slate-500">Join to participate in this community chat.</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href={`/communities/${hub.id}`}
            className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-600 no-underline"
          >
            Details
          </Link>
          {mounted && !hub.joined ? (
            <button
              type="button"
              disabled={joinMutation.isPending}
              onClick={() => void handleJoin()}
              className="rounded-full bg-[#00D431] px-3 py-1 text-[11px] font-bold text-white disabled:opacity-50"
            >
              {joinMutation.isPending ? 'Joining…' : 'Join'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
