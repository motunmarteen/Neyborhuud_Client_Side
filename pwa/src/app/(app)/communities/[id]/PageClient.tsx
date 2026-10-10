'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Zap,
  Lock,
  Globe,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Info,
  ArrowRight,
  DoorOpen,
} from 'lucide-react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import {
  useHubCommunity,
  useJoinHubCommunity,
  useLeaveHubCommunity,
  useHubCommunityMembers,
} from '@/hooks/useHubCommunities';
import { CommunityHubAdminPanel } from '@/components/communities/CommunityHubAdminPanel';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { toast } from '@/lib/toast';

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hubId = params.id as string;
  const { user } = useClientAuthUser();
  const [showEli5, setShowEli5] = useState(false);

  const { data, isLoading, isError } = useHubCommunity(hubId);
  const joinMutation = useJoinHubCommunity();
  const leaveMutation = useLeaveHubCommunity();

  const hub = data?.data?.hub;

  const { data: membersData } = useHubCommunityMembers(hubId, 1);
  const members = membersData?.data?.members ?? [];

  const openChat = () => {
    if (hub?.conversationId) {
      router.push(`/chat/${hub.conversationId}`);
    }
  };

  const handleJoinLeave = async () => {
    if (!user) {
      router.push(`/login?redirect=/communities/${hubId}`);
      return;
    }
    if (!hub) return;
    if (hub.joined) {
      try {
        await leaveMutation.mutateAsync(hubId);
        toast.success('Left community');
      } catch {
        toast.error('Could not leave community');
      }
    } else {
      try {
        const res = await joinMutation.mutateAsync(hubId);
        if (res.data?.pending) {
          toast.success('Join request sent — awaiting admin approval');
          return;
        }
        toast.success(`Welcome to ${hub.name}!`);
        const cid = res.data?.conversationId ?? res.data?.hub?.conversationId;
        if (cid) {
          router.push(`/chat/${cid}`);
        }
      } catch {
        toast.error('Could not join community');
      }
    }
  };

  if (isLoading) {
    return (
      <AppBrowseLayout maxWidth="680">
        <div className="bg-white  rounded-3xl border border-black/[0.08]  h-52 animate-pulse" />
      </AppBrowseLayout>
    );
  }

  if (isError || !hub) {
    return (
      <AppBrowseLayout maxWidth="680">
        <BrowseEmptyState
          icon="groups"
          title="Community not found"
          description="This estate hub may have been removed or the link is invalid."
          action={
            <Link
              href="/communities"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-[#00B82E] px-5 py-2.5 text-xs font-black text-white shadow-sm shadow-[#00B82E]/20 no-underline"
            >
              Browse Estates
            </Link>
          }
        />
      </AppBrowseLayout>
    );
  }

  return (
    <AppBrowseLayout maxWidth="680">
      <div className="space-y-4">
        {/* ── Main Estate Hero Card ── */}
        <div className="bg-white  rounded-3xl border border-black/[0.08]  p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50  border border-emerald-200/80  text-[#00B82E] shadow-sm">
                <Users size={28} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900  leading-tight">
                  {hub.name}
                </h1>
                <p className="text-xs font-bold text-slate-500  mt-0.5">
                  {hub.categoryLabel || 'Estate Hub'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowEli5(!showEli5)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200  text-slate-500  transition-colors"
              title="Explain Like I'm 5"
              aria-label="Explain estate hub"
            >
              <HelpCircle size={16} />
            </button>
          </div>

          {/* ELI5 Banner */}
          {showEli5 && (
            <div className="bg-emerald-50  border border-emerald-200/70  rounded-2xl p-3.5 text-xs text-emerald-900  flex items-start gap-2.5">
              <Info size={16} className="text-[#00B82E] shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Estate Hub: </span>
                This is the official digital gate for your neighborhood. Residents
                gather here for gate security notices, emergency sirens, and community decisions.
              </div>
              <button
                type="button"
                onClick={() => setShowEli5(false)}
                className="text-xs font-bold text-emerald-700 hover:underline shrink-0"
              >
                Got it
              </button>
            </div>
          )}

          <p className="text-sm leading-relaxed text-slate-700 ">
            {hub.description || 'Verified residents and neighbors sharing local updates.'}
          </p>

          {/* BC.Game 3-Chip Info Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/[0.06] ">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100  text-slate-700 ">
              <Users size={13} className="text-[#00B82E]" />
              <span>{hub.membersCount.toLocaleString()} verified members</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50  text-emerald-700  border border-emerald-200/60 ">
              <Zap size={13} />
              <span className="capitalize">{hub.activityLevel} activity</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100  text-slate-700 ">
              {hub.visibility === 'private' ? (
                <>
                  <Lock size={12} className="text-amber-600" />
                  <span>Private Gate</span>
                </>
              ) : (
                <>
                  <Globe size={12} className="text-blue-500" />
                  <span>Public Ward</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          {hub.joined ? (
            <>
              <button
                type="button"
                onClick={openChat}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#00B82E] hover:bg-[#00B82E] active:scale-95 py-3.5 text-xs font-black text-white shadow-md shadow-[#00B82E]/20 transition-all"
              >
                <MessageSquare size={16} />
                <span>Open Estate Group Chat</span>
              </button>
              <button
                type="button"
                onClick={() => void handleJoinLeave()}
                disabled={leaveMutation.isPending || hub.myRole === 'owner'}
                className="flex-1 rounded-2xl border border-black/[0.08]  bg-slate-50  py-3.5 text-xs font-bold text-slate-600  hover:text-rose-600 transition-colors disabled:opacity-50"
              >
                {hub.myRole === 'owner' ? 'You Own This Hub' : leaveMutation.isPending ? 'Leaving…' : 'Leave Estate'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleJoinLeave()}
              disabled={joinMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00B82E] hover:bg-[#00B82E] active:scale-95 py-3.5 text-xs font-black text-white shadow-md shadow-[#00B82E]/20 disabled:opacity-50 transition-all"
            >
              <DoorOpen size={16} />
              <span>{joinMutation.isPending ? 'Joining Estate…' : 'Join Estate & Open Chat'}</span>
            </button>
          )}
        </div>

        {/* Quick Link to Messages */}
        <Link
          href="/chat?tab=communities"
          className="group flex items-center justify-between rounded-2xl bg-white  border border-black/[0.08]  px-4.5 py-3.5 text-xs font-bold text-slate-800  hover:border-black/[0.14]  shadow-sm transition-all no-underline"
        >
          <span className="inline-flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-50  text-blue-600 flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <span>View all Estate Chats in Messages</span>
          </span>
          <ChevronRight size={16} className="text-slate-400 group-hover:text-[#00B82E] group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* ── Members Roster ── */}
        {hub.joined && members.length > 0 && (
          <div className="bg-white  rounded-3xl border border-black/[0.08]  p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 ">
                Active Residents ({hub.membersCount.toLocaleString()})
              </h2>
              <span className="text-[11px] font-semibold text-slate-500">
                Verified Roster
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {members.slice(0, 12).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2.5 rounded-2xl border border-black/[0.04]  bg-slate-50/60  p-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-slate-200  flex items-center justify-center text-[11px] font-black text-slate-700 ">
                      {(m.firstName || m.username || 'U')[0]?.toUpperCase()}
                    </div>
                    <span className="truncate text-xs font-bold text-slate-800 ">
                      {m.firstName || m.lastName
                        ? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
                        : m.username ?? 'Member'}
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100  text-slate-500">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>

            {hub.membersCount > members.length && (
              <p className="text-center text-[11px] font-medium text-slate-400 pt-1">
                + {(hub.membersCount - members.length).toLocaleString()} more residents in this estate
              </p>
            )}
          </div>
        )}

        {/* Admin Panel */}
        <CommunityHubAdminPanel hub={hub} />
      </div>
    </AppBrowseLayout>
  );
}
