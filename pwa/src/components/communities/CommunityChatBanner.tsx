'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { Users, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
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
    <div className="border-b border-black/[0.06]  bg-slate-50/90  px-4 py-2.5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-50  border border-emerald-200/70  flex items-center justify-center text-[#00B82E] shrink-0">
            <Users size={16} />
          </div>
          <div className="truncate">
            <p className="truncate text-xs font-black text-slate-900  flex items-center gap-1.5">
              <span>{hub.name}</span>
              <span className="font-normal text-slate-500  text-[11px]">
                · {hub.membersCount.toLocaleString()} members
              </span>
            </p>
            {hub.largeGroupMode ? (
              <p className="text-[10px] text-amber-600  font-semibold">
                Large group — notifications for admins first
              </p>
            ) : !hub.joined && mounted ? (
              <p className="text-[10px] text-slate-500 ">
                Join to participate in this estate conversation
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/communities/${hub.id}`}
            className="rounded-xl border border-black/[0.08]  bg-white  px-3 py-1.5 text-xs font-bold text-slate-700  hover:text-[#00B82E] transition-colors"
          >
            Hub Info
          </Link>
          {mounted && !hub.joined ? (
            <button
              type="button"
              disabled={joinMutation.isPending}
              onClick={() => void handleJoin()}
              className="inline-flex items-center gap-1 rounded-xl bg-[#00B82E] hover:bg-[#00B82E] active:scale-95 px-3 py-1.5 text-xs font-black text-white shadow-sm shadow-[#00B82E]/20 disabled:opacity-50 transition-all"
            >
              {joinMutation.isPending ? 'Joining…' : 'Join Estate'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

