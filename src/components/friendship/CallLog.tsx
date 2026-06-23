'use client';

/**
 * CallLog — read-only recent call history (audio + video) for the Connect hub.
 * One chronological list; each row shows direction (incoming / outgoing / missed)
 * and call type. Tapping a row opens the conversation thread.
 */

import Link from 'next/link';
import { useRecentCalls } from '@/hooks/useRecentCalls';
import { formatTimeAgo } from '@/utils/timeAgo';
import type { CallRecord } from '@/services/call.service';

type CallParty = { _id: string; username?: string; firstName?: string; lastName?: string; avatarUrl?: string };

function partyId(p: CallRecord['caller']): string {
  return typeof p === 'string' ? p : p?._id ?? '';
}
function partyObj(p: CallRecord['caller']): CallParty | null {
  return typeof p === 'string' ? null : (p as CallParty);
}

interface CallLogProps {
  currentUserId?: string;
}

export function CallLog({ currentUserId }: CallLogProps) {
  const { data: calls, isLoading, isError, refetch } = useRecentCalls(30);

  if (isLoading) {
    return (
      <div className="divide-y divide-gray-100 bg-white">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3.5">
            <div className="h-11 w-11 shrink-0 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/3 rounded-full bg-slate-100" />
              <div className="h-3 w-1/4 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 py-12 text-center">
        <span className="material-symbols-outlined text-3xl text-slate-300">phone_disabled</span>
        <p className="mt-2 text-sm text-slate-500">Could not load your call log.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 rounded-full bg-[#00D431] px-4 py-2 text-xs font-bold text-white active:scale-95"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!calls?.length) {
    return (
      <div className="px-4 py-14 text-center">
        <span className="material-symbols-outlined text-3xl text-slate-300">call</span>
        <p className="mt-2 text-sm font-semibold text-slate-700">No calls yet</p>
        <p className="mt-1 text-xs text-slate-400">Your audio and video call history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 bg-white">
      {calls.map((call) => {
        const iCalled = currentUserId ? partyId(call.caller) === currentUserId : false;
        const other = iCalled ? partyObj(call.callee) : partyObj(call.caller);
        const otherName =
          [other?.firstName, other?.lastName].filter(Boolean).join(' ') ||
          other?.username ||
          'Neighbour';

        const isMissed = call.status === 'missed' || call.status === 'cancelled' || call.status === 'rejected';
        const missedForMe = call.status === 'missed' && !iCalled;

        // direction label + icon
        const directionIcon = isMissed
          ? (iCalled ? 'call_made' : 'call_missed')
          : (iCalled ? 'call_made' : 'call_received');
        const directionLabel = isMissed
          ? (missedForMe ? 'Missed' : iCalled ? 'No answer' : 'Declined')
          : (iCalled ? 'Outgoing' : 'Incoming');

        const colorCls = missedForMe ? 'text-brand-red' : 'text-slate-500';

        return (
          <Link
            key={call._id}
            href={`/chat/${encodeURIComponent(call.conversationId)}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            {/* Avatar */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-white/60 bg-slate-100 shadow-sm">
              {other?.avatarUrl ? (
                <img src={other.avatarUrl} alt={otherName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[15px] font-bold text-slate-400">{otherName[0]?.toUpperCase()}</span>
              )}
            </div>

            {/* Name + direction */}
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[15px] font-semibold ${missedForMe ? 'text-brand-red' : 'text-slate-800'}`}>
                {otherName}
              </p>
              <span className={`flex items-center gap-1 text-[12px] ${colorCls}`}>
                <span className="material-symbols-outlined text-[15px]">{directionIcon}</span>
                {directionLabel}
                <span className="text-slate-300">·</span>
                {formatTimeAgo(call.startedAt || call.createdAt)}
              </span>
            </div>

            {/* Call type (audio / video) */}
            <span className="material-symbols-outlined text-[20px] text-slate-400">
              {call.type === 'video' ? 'videocam' : 'call'}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
