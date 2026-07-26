'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useHubCommunityByConversation, useJoinHubCommunity } from '@/hooks/useHubCommunities';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { chatService } from '@/services/chat.service';
import { useGroupCall } from '@/components/calls/GroupCallProvider';

type CommunityChatBannerProps = {
  conversationId: string;
};

export function CommunityChatBanner({ conversationId }: CommunityChatBannerProps) {
  const router = useRouter();
  const { user, mounted } = useClientAuthUser();
  const { data } = useHubCommunityByConversation(conversationId);
  const joinMutation = useJoinHubCommunity();
  const [calling, setCalling] = useState(false);
  const { phase: groupCallPhase, call: activeGroupCall, joinCall } = useGroupCall();

  // Light polling for "is a call already happening here" so the banner can
  // offer "Join call" instead of only "Start call" — getActiveCall previously
  // existed but nothing ever called it.
  const { data: activeCallData } = useQuery({
    queryKey: ['group-call-active', conversationId],
    queryFn: () => chatService.getActiveCall(conversationId),
    enabled: !!conversationId,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
  const activeSession = activeCallData?.data?.session;
  const inThisCall = activeGroupCall?.conversationId === conversationId && groupCallPhase === 'active';

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

  // Starts (or, if one is already ringing/active, just joins) a real N-party
  // mesh group call — see GroupCallProvider for the WebRTC signaling. This
  // used to only POST /calls and show a toast with no actual call; now it
  // starts the session AND immediately joins the caller into the mesh.
  const startCall = async (callType: 'voice' | 'video') => {
    if (!hub.joined) {
      toast.error('Join the community first');
      return;
    }
    if (groupCallPhase === 'joining' || groupCallPhase === 'active') {
      toast.error('You are already in a call');
      return;
    }
    setCalling(true);
    try {
      let sessionId: string | undefined;
      let resolvedType = callType;
      if (activeSession) {
        // Already a call in progress — just join it (its own call type wins).
        sessionId = activeSession.id;
        resolvedType = (activeSession.callType as 'voice' | 'video') ?? callType;
      } else {
        try {
          const res = await chatService.startCall(conversationId, callType);
          sessionId = res.data?.session?.id;
        } catch (err: unknown) {
          // 409 = someone else started one microseconds before us — join that instead of failing.
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 409) {
            const active = await chatService.getActiveCall(conversationId);
            sessionId = active.data?.session?.id;
            resolvedType = (active.data?.session?.callType as 'voice' | 'video') ?? callType;
          } else {
            throw err;
          }
        }
      }
      if (!sessionId) {
        toast.error('Could not start call');
        return;
      }
      await joinCall({ sessionId, conversationId, callType: resolvedType });
    } catch {
      toast.error('Could not start call');
    } finally {
      setCalling(false);
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
          {activeSession && !inThisCall ? (
            <p className="text-[11px] font-semibold text-primary">
              {activeSession.callType === 'video' ? 'Video' : 'Voice'} call in progress
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {hub.joined && mounted && activeSession && !inThisCall ? (
            <button
              type="button"
              disabled={calling}
              onClick={() => void startCall((activeSession.callType as 'voice' | 'video') ?? 'voice')}
              className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white disabled:opacity-50"
            >
              {calling ? 'Joining…' : 'Join call'}
            </button>
          ) : hub.joined && mounted ? (
            <>
              <button
                type="button"
                disabled={calling}
                onClick={() => void startCall('voice')}
                className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600"
                title="Voice call"
              >
                📞
              </button>
              <button
                type="button"
                disabled={calling}
                onClick={() => void startCall('video')}
                className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600"
                title="Video call"
              >
                📹
              </button>
            </>
          ) : null}
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
