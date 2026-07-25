'use client';

import { useCallback, useEffect, useState } from 'react';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { safetyService, type CircleMember } from '@/services/safety.service';
import { followService } from '@/services/follow.service';
import { useAuth } from '@/hooks/useAuth';

type Candidate = { _id: string; firstName: string; lastName: string; username: string; avatarUrl?: string };

function personLabel(person: CircleMember['userId']): string {
  if (typeof person === 'string') return person;
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ');
  return name || person.username || 'Someone';
}

export function DashboardCirclePanel() {
  const { user } = useAuth();
  const [myCircle, setMyCircle] = useState<CircleMember[]>([]);
  const [incoming, setIncoming] = useState<CircleMember[]>([]);
  const [belongTo, setBelongTo] = useState<CircleMember[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [mineRes, incomingRes, belongRes] = await Promise.all([
        safetyService.getMyCircle(),
        safetyService.getIncomingCircleInvites(),
        safetyService.getCirclesIBelongTo(),
      ]);
      setMyCircle(mineRes.data?.members ?? []);
      setIncoming(incomingRes.data?.invites ?? []);
      setBelongTo(belongRes.data?.circles ?? []);
    } catch {
      setError('Could not load your Safety Circle.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      try {
        const [followersRes, followingRes] = await Promise.all([
          followService.getFollowers(user.id, 1, 100),
          followService.getFollowing(user.id, 1, 100),
        ]);
        const followerIds = new Set((followersRes.data?.data?.followers ?? []).map((u) => u._id));
        const mutual: Candidate[] = (followingRes.data?.data?.following ?? [])
          .filter((u) => followerIds.has(u._id))
          .map((u) => ({
            _id: u._id,
            firstName: u.firstName ?? '',
            lastName: u.lastName ?? '',
            username: u.username ?? '',
            avatarUrl: u.avatarUrl || u.profilePicture,
          }));
        setCandidates(mutual);
      } catch {
        // Candidate suggestions are a nice-to-have — silently skip on failure.
      }
    })();
  }, [user?.id]);

  const existingMemberIds = new Set(
    myCircle
      .filter((m) => m.status === 'accepted' || m.status === 'pending')
      .map((m) => (typeof m.memberId === 'string' ? m.memberId : m.memberId._id)),
  );
  const inviteCandidates = candidates.filter((c) => !existingMemberIds.has(c._id));

  const run = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    try {
      await action();
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="mod-card rounded-2xl p-6 text-center">
        <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mod-card rounded-2xl p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-blue">Safety circle</p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
          Mutual followers you&apos;ve explicitly let see your safety status — not your live location,
          and not the same as a Guardian, who also receives SOS and trip alerts.
        </p>
      </div>

      {error && (
        <div className="mod-card rounded-2xl border border-brand-red/25 bg-brand-red/10 p-3 text-xs text-brand-red">
          {error}
        </div>
      )}

      {incoming.length > 0 && (
        <div className="mod-card space-y-2 rounded-2xl p-4">
          <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Invites for you</p>
          {incoming.map((inv) => (
            <div key={inv._id} className="flex items-center justify-between gap-2">
              <span className="text-sm" style={{ color: 'var(--neu-text)' }}>
                {personLabel(inv.userId)} wants you to see their status
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy === inv._id}
                  onClick={() => run(inv._id, () => safetyService.respondToCircleInvite(inv._id, 'accepted'))}
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busy === inv._id}
                  onClick={() => run(inv._id, () => safetyService.respondToCircleInvite(inv._id, 'rejected'))}
                  className="mod-chip px-3 py-1.5 text-xs font-semibold"
                  style={{ color: 'var(--neu-text-muted)' }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mod-card space-y-2 rounded-2xl p-4">
        <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>People in your circle</p>
        {myCircle.filter((m) => m.status !== 'removed' && m.status !== 'rejected').length === 0 ? (
          <BrowseEmptyState
            icon="group"
            title="No one in your circle yet"
            description="Invite a mutual follower below so they can see your safety status."
          />
        ) : (
          myCircle
            .filter((m) => m.status !== 'removed' && m.status !== 'rejected')
            .map((m) => (
              <div key={m._id} className="flex items-center justify-between gap-2">
                <span className="text-sm" style={{ color: 'var(--neu-text)' }}>
                  {personLabel(m.memberId)}{' '}
                  {m.status === 'pending' && (
                    <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                      (invite pending)
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  disabled={busy === m._id}
                  onClick={() =>
                    run(m._id, () =>
                      safetyService.removeCircleMember(
                        typeof m.memberId === 'string' ? m.memberId : m.memberId._id,
                      ),
                    )
                  }
                  className="text-xs font-semibold text-brand-red"
                >
                  Remove
                </button>
              </div>
            ))
        )}
      </div>

      {inviteCandidates.length > 0 && (
        <div className="mod-card space-y-2 rounded-2xl p-4">
          <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Invite a mutual follower</p>
          {inviteCandidates.map((c) => (
            <div key={c._id} className="flex items-center justify-between gap-2">
              <span className="text-sm" style={{ color: 'var(--neu-text)' }}>
                {[c.firstName, c.lastName].filter(Boolean).join(' ') || c.username}
              </span>
              <button
                type="button"
                disabled={busy === c._id}
                onClick={() => run(c._id, () => safetyService.inviteToCircle(c._id))}
                className="rounded-full bg-brand-blue px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Invite
              </button>
            </div>
          ))}
        </div>
      )}

      {belongTo.length > 0 && (
        <div className="mod-card space-y-2 rounded-2xl p-4">
          <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Circles you belong to</p>
          <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            You can see status updates from these people in the Circle tab.
          </p>
          {belongTo.map((c) => (
            <p key={c._id} className="text-sm" style={{ color: 'var(--neu-text)' }}>
              {personLabel(c.userId)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
