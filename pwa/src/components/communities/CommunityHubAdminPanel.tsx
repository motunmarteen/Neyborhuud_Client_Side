'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Link2,
  Copy,
  Check,
  Users,
  CheckCircle2,
  XCircle,
  Info,
  HelpCircle,
} from 'lucide-react';
import { hubCommunityService } from '@/services/hubCommunity.service';
import type { HubCommunity, HubJoinRequestItem } from '@/types/hubCommunity';

type Props = {
  hub: HubCommunity;
};

export function CommunityHubAdminPanel({ hub }: Props) {
  const queryClient = useQueryClient();
  const isAdmin = ['owner', 'admin', 'moderator'].includes(hub.myRole ?? '');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showEli5, setShowEli5] = useState(false);

  const { data: requestsData } = useQuery({
    queryKey: ['hub-join-requests', hub.id],
    queryFn: () => hubCommunityService.listJoinRequests(hub.id),
    enabled: isAdmin && hub.settings?.joinApprovalRequired,
  });

  const requests = requestsData?.data?.requests ?? [];

  if (!isAdmin) return null;

  const createInvite = async () => {
    try {
      const res = await hubCommunityService.createInvite(hub.id, { expiresInHours: 168 });
      const path = res.data?.inviteUrl ?? `/communities/join/${res.data?.code}`;
      const full =
        typeof window !== 'undefined'
          ? `${window.location.origin}${path}`
          : path;
      setInviteUrl(full);
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success('Invite link copied to clipboard!');
      void queryClient.invalidateQueries({ queryKey: ['hub-invites', hub.id] });
    } catch {
      toast.error('Could not create invite link');
    }
  };

  const review = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await hubCommunityService.reviewJoinRequest(hub.id, requestId, action);
      toast.success(action === 'approve' ? 'Resident approved!' : 'Request declined');
      void queryClient.invalidateQueries({ queryKey: ['hub-join-requests', hub.id] });
      void queryClient.invalidateQueries({ queryKey: ['hub-community', hub.id] });
      void queryClient.invalidateQueries({ queryKey: ['hub-communities'] });
    } catch {
      toast.error('Could not update request');
    }
  };

  return (
    <div className="bg-white dark:bg-[#12161A] rounded-3xl border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center justify-center text-[#00C830]">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Estate Gate Admin
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Manage member approvals and gate invites
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowEli5(!showEli5)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 transition-colors"
          title="Explain Like I'm 5"
          aria-label="Explain admin functions"
        >
          <HelpCircle size={14} />
        </button>
      </div>

      {/* ELI5 Banner */}
      {showEli5 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40 rounded-2xl p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
          <Info size={15} className="text-[#00C830] shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Gatekeeper Info: </span>
            As an estate admin or gate elder, you verify real residents before they gain access to the private neighborhood channel.
          </div>
          <button
            type="button"
            onClick={() => setShowEli5(false)}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Got it
          </button>
        </div>
      )}

      {/* Invite Link Generator */}
      {hub.settings?.allowMemberInvites !== false && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Estate Share Link
            </span>
            <button
              type="button"
              onClick={() => void createInvite()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00C830] hover:bg-[#00B52B] active:scale-95 text-white shadow-sm shadow-[#00C830]/20 transition-all"
            >
              <Link2 size={13} />
              <span>{inviteUrl ? 'Regenerate Link' : 'Generate Invite Link'}</span>
            </button>
          </div>

          {inviteUrl && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-2.5">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate flex-1 select-all">
                {inviteUrl}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast.success('Link copied!');
                }}
                className="shrink-0 p-1.5 rounded-xl bg-white dark:bg-[#1a2127] border border-black/[0.08] dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-[#00C830] transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check size={14} className="text-[#00C830]" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pending Join Requests */}
      {hub.settings?.joinApprovalRequired && requests.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Pending Resident Verifications
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              {requests.length} waiting
            </span>
          </div>

          <ul className="space-y-2">
            {requests.map((r: HubJoinRequestItem) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] p-3 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                    {(r.firstName || r.username || 'U')[0]?.toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {r.firstName || r.username || 'Resident'}
                    </p>
                    {r.username && (
                      <p className="text-[10px] text-slate-500 truncate">@{r.username}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => void review(r.id, 'approve')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={13} />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void review(r.id, 'reject')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 active:scale-95 transition-all"
                  >
                    <XCircle size={13} />
                    <span>Decline</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Large Group Mode Note */}
      {hub.largeGroupMode && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 p-3 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
          <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Large Community Active:</strong> Live push alerts are reserved for estate admins and security. All residents can freely participate in chat.
          </span>
        </div>
      )}
    </div>
  );
}
