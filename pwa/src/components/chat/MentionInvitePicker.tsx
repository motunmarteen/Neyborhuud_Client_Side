'use client';

/**
 * MentionInvitePicker — autocomplete shown while typing "@name" in a chat.
 * Suggests people from the user's network who are NOT already in the chat;
 * selecting one starts the Incognito Invite flow for that person.
 */

import { useMemo } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { followService } from '@/services/follow.service';
import { useAuth } from '@/hooks/useAuth';

export type MentionPerson = { id: string; name: string; username?: string; avatarUrl?: string | null };

interface MentionInvitePickerProps {
  /** The text after "@" the user is typing; null = not mentioning. */
  query: string | null;
  /** User IDs already in the conversation (excluded from suggestions). */
  excludeIds: string[];
  onPick: (person: MentionPerson) => void;
}

export function MentionInvitePicker({ query, excludeIds, onPick }: MentionInvitePickerProps) {
  const { user } = useAuth();

  const { data: followingData } = useQuery({
    queryKey: ['following', user?.id, 'mention-picker'],
    queryFn: () => (user ? followService.getFollowing(user.id, 1, 100) : null),
    enabled: query !== null && !!user,
    staleTime: 60_000,
  });

  const matches = useMemo<MentionPerson[]>(() => {
    if (query === null) return [];
    const list = ((followingData?.data as { following?: any[] })?.following ?? []) as any[];
    const exclude = new Set(excludeIds);
    return list
      .map((u) => ({
        id: (u._id ?? u.id) as string,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || 'Neighbour',
        username: u.username as string | undefined,
        avatarUrl: (u.avatarUrl ?? u.profilePicture ?? null) as string | null,
      }))
      .filter((p) => !exclude.has(p.id))
      .filter(
        (p) =>
          query === '' ||
          p.name.toLowerCase().includes(query) ||
          (p.username?.toLowerCase().includes(query) ?? false),
      )
      .slice(0, 6);
  }, [followingData, query, excludeIds]);

  if (query === null || matches.length === 0) return null;

  return (
    <div className="mx-2 mb-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="border-b border-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Invite to this chat
      </div>
      <div className="max-h-[200px] divide-y divide-slate-100 overflow-y-auto">
        {matches.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
              {p.avatarUrl ? (
                <Image src={p.avatarUrl} alt={p.name} width={36} height={36} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[13px] font-bold text-slate-400">{p.name[0]?.toUpperCase()}</span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-slate-800">{p.name}</span>
              {p.username ? <span className="block truncate text-[12px] text-slate-400">@{p.username}</span> : null}
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#00A555]">person_add</span>
          </button>
        ))}
      </div>
    </div>
  );
}
