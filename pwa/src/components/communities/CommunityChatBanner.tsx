'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { Users } from 'lucide-react';
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
        toast.success('Join request sent — awaiting admin approval');
        return;
      }
      const cid = res.data?.conversationId ?? hub.conversationId;
      if (cid && cid !== conversationId) {
        router.replace(`/chat/${cid}`);
      }
    } catch {
      toast.error('Could not join community');
    }
  };

  return (
    <div className="bg-white px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-50  border border-emerald-200/70  flex items-center justify-center text-[#00B82E] shrink-0">
            <Users size={16} />
          </div>
          <div className="truncate">
            <p className="truncate text-xs font-bold text-navy  flex items-center gap-1.5">
              <span>{hub.name}</span>
              <span className="font-normal text-slate-500  text-[11px]">
                · {hub.membersCount.toLocaleString()} members
              </span>
            </p>
            {hub.largeGroupMode ? (
              <p className="text-[11px] text-amber-ink font-semibold">
                Large group — notifications for admins first
              </p>
            ) : !hub.joined && mounted ? (
              <p className="text-[11px] text-muted">
                Join to send messages here
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/communities/${hub.id}`}
            className="tap-target inline-flex min-h-10 items-center rounded-full bg-background px-4 text-xs font-bold text-navy"
          >
            About
          </Link>
          {mounted && !hub.joined ? (
            <button
              type="button"
              disabled={joinMutation.isPending}
              onClick={() => void handleJoin()}
              className="tap-target inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-xs font-bold text-white disabled:opacity-50"
            >
              {joinMutation.isPending ? 'Joining…' : 'Join'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

