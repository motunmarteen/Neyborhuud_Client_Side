'use client';

/**
 * IncognitoInviteSheet — propose a time-boxed "witness" invite into a chat.
 *
 * The invited person joins for a chosen duration; they see ONLY messages from
 * when they accept until their timer expires (enforced server-side), then are
 * auto-removed. Requires the other participant(s) to approve first.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { chatService } from '@/services/chat.service';
import { followService } from '@/services/follow.service';
import { useAuth } from '@/hooks/useAuth';

const DURATIONS: { label: string; seconds: number }[] = [
  { label: '5 min', seconds: 5 * 60 },
  { label: '15 min', seconds: 15 * 60 },
  { label: '30 min', seconds: 30 * 60 },
  { label: '1 hour', seconds: 60 * 60 },
];

type Person = { id: string; name: string; avatarUrl?: string | null };

interface IncognitoInviteSheetProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  /** Optionally pre-select the invitee (e.g. from an @mention). */
  invitee?: Person | null;
}

export function IncognitoInviteSheet({ open, onClose, conversationId, invitee }: IncognitoInviteSheetProps) {
  const { user } = useAuth();
  const [duration, setDuration] = useState(DURATIONS[1].seconds);
  const [submitting, setSubmitting] = useState(false);
  const [picked, setPicked] = useState<Person | null>(invitee ?? null);
  const [search, setSearch] = useState('');

  // Candidates = people you follow (your network).
  const { data: followingData } = useQuery({
    queryKey: ['following', user?.id, 'incognito-picker'],
    queryFn: () => (user ? followService.getFollowing(user.id, 1, 100) : null),
    enabled: open && !invitee && !!user,
    staleTime: 60_000,
  });

  const candidates = useMemo<Person[]>(() => {
    const list = ((followingData?.data as { following?: any[] })?.following ?? []) as any[];
    const q = search.trim().toLowerCase();
    return list
      .map((u) => ({
        id: u._id ?? u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || 'Neighbour',
        avatarUrl: u.avatarUrl ?? u.profilePicture ?? null,
      }))
      .filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [followingData, search]);

  if (!open) return null;
  const target = picked;

  const handleInvite = async () => {
    if (!target) return;
    setSubmitting(true);
    try {
      await chatService.proposeIncognitoInvite(conversationId, target.id, duration);
      toast.success(`Invite sent — waiting for approval to add ${target.name}.`);
      onClose();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Could not send invite.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-[480px] rounded-t-[28px] bg-white p-5 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

        <div className="mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-[#00A555]">visibility</span>
          <h2 className="text-[17px] font-bold text-slate-900">Invite to witness</h2>
        </div>
        <p className="mb-4 text-[13px] leading-relaxed text-slate-500">
          {target ? (
            <>
              <span className="font-semibold text-slate-700">{target.name}</span> will join this chat for the time you
              choose.
            </>
          ) : (
            <>Choose someone to invite. </>
          )}{' '}
          They&apos;ll see only messages sent <span className="font-semibold">while they&apos;re here</span> — never
          your earlier history — and leave automatically when the timer ends.
        </p>

        {/* Person picker (your network) */}
        {!target ? (
          <>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people you follow…"
              className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#00D431] focus:outline-none"
            />
            <div className="mb-4 max-h-[220px] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
              {candidates.length === 0 ? (
                <p className="px-3 py-6 text-center text-[13px] text-slate-400">No matches in your network.</p>
              ) : (
                candidates.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPicked(p)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[13px] font-bold text-slate-400">{p.name[0]?.toUpperCase()}</span>
                      )}
                    </span>
                    <span className="truncate text-[14px] font-semibold text-slate-800">{p.name}</span>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-[#00A555]"
          >
            <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
            Change person ({target.name})
          </button>
        )}

        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-slate-400">How long?</p>
        <div className="mb-5 grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.seconds}
              type="button"
              onClick={() => setDuration(d.seconds)}
              className={`rounded-xl py-2.5 text-[13px] font-bold transition-all ${
                duration === d.seconds
                  ? 'bg-[#00D431] text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-700">
          The other person in this chat must approve before your guest is added.
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInvite}
            disabled={submitting || !target}
            className="flex-1 rounded-xl bg-[#00D431] py-3 text-sm font-bold text-white active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  );
}
