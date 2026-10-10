'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Zap, ShieldCheck, MessageSquare, Plus, Loader2 } from 'lucide-react';
import type { HubCommunity } from '@/types/hubCommunity';

const ACTIVITY_TONE: Record<HubCommunity['activityLevel'], { text: string; bg: string }> = {
  High: { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  Moderate: { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  Low: { text: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
};

type CommunityRowProps = {
  community: HubCommunity;
  joined: boolean;
  onJoin: (id: string) => void;
  joinPending?: boolean;
};

export function CommunityRow({
  community,
  joined,
  onJoin,
  joinPending = false,
}: CommunityRowProps) {
  const chatHref = community.conversationId
    ? `/chat/${community.conversationId}`
    : `/communities/${community.id}`;

  const activity = ACTIVITY_TONE[community.activityLevel] || ACTIVITY_TONE.Moderate;

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-black/[0.06] bg-white p-3.5 transition-all hover:bg-slate-50/70 shadow-2xs">
      <Link
        href={`/communities/${community.id}`}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#00B82E] border border-emerald-100 shadow-2xs no-underline hover:scale-105 active:scale-95 transition-transform"
      >
        <Users size={22} strokeWidth={2.2} />
      </Link>

      <Link href={`/communities/${community.id}`} className="min-w-0 flex-1 no-underline">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-[14px] font-bold text-slate-900">
            {community.name}
          </p>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600 border border-black/[0.04]">
            {community.categoryLabel}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[12px] font-medium text-slate-500 leading-snug">
          {community.description}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[11px] font-semibold text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Users size={12} className="text-slate-400" />
            {community.membersCount.toLocaleString()} members
          </span>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] border ${activity.bg} ${activity.text}`}>
            <Zap size={10} />
            {community.activityLevel} activity
          </span>
        </div>
      </Link>

      {joined ? (
        <Link
          href={chatHref}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-800 no-underline shadow-2xs hover:bg-emerald-100 active:scale-95 transition-all"
        >
          <MessageSquare size={13} />
          Chat
        </Link>
      ) : (
        <button
          type="button"
          disabled={joinPending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onJoin(community.id);
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#00B82E] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#00B82E] disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
        >
          {joinPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <>
              <Plus size={13} strokeWidth={2.5} />
              Join
            </>
          )}
        </button>
      )}
    </div>
  );
}
