'use client';

import { useState, type FormEvent } from 'react';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { BrowseSelect } from '@/components/ui/BrowseSelect';
import {
  safetyService,
  type GuardianRelationship,
  type GuardianStatus,
} from '@/services/safety.service';

const STATUS_OPTIONS: Array<{ value: GuardianStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'removed', label: 'Removed' },
];

type DashboardGuardiansPanelProps = {
  guardians: GuardianRelationship[];
  incomingRequests: GuardianRelationship[];
  statusFilter: GuardianStatus | 'all';
  onStatusFilterChange: (v: GuardianStatus | 'all') => void;
  linkers: Array<{ _id: string; firstName: string; lastName: string; username: string; avatarUrl?: string }>;
  linkersLoading: boolean;
  linkersLoaded: boolean;
  linkersMessage: string | null;
  onLoadLinkers: () => void;
  onRefresh: () => Promise<void>;
  onError: (msg: string) => void;
  loading: boolean;
};

export function DashboardGuardiansPanel({
  guardians,
  incomingRequests,
  statusFilter,
  onStatusFilterChange,
  linkers,
  linkersLoading,
  linkersLoaded,
  linkersMessage,
  onLoadLinkers,
  onRefresh,
  onError,
  loading,
}: DashboardGuardiansPanelProps) {
  const [linkerSearch, setLinkerSearch] = useState('');
  const [guardianForm, setGuardianForm] = useState({
    guardianId: '',
    nickname: '',
    relationshipType: 'friend' as 'parent' | 'spouse' | 'sibling' | 'friend' | 'colleague' | 'other',
    priorityLevel: 1,
    isTemporary: false,
    expiresAt: '',
  });

  const onAddGuardian = async (e: FormEvent) => {
    e.preventDefault();
    if (!guardianForm.guardianId) {
      onError('Select a mutual follower to add as guardian.');
      return;
    }
    try {
      await safetyService.requestGuardian({
        guardianId: guardianForm.guardianId,
        nickname: guardianForm.nickname || undefined,
        relationshipType: guardianForm.relationshipType,
        priorityLevel: guardianForm.priorityLevel,
        isTemporary: guardianForm.isTemporary,
        expiresAt: guardianForm.isTemporary && guardianForm.expiresAt ? guardianForm.expiresAt : undefined,
      });
      setGuardianForm((p) => ({ ...p, guardianId: '', nickname: '' }));
      setLinkerSearch('');
      await onRefresh();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to send request';
      onError(msg);
    }
  };

  const onRespond = async (requestId: string, action: 'accepted' | 'rejected') => {
    try {
      await safetyService.respondGuardian({ requestId, action });
      await onRefresh();
    } catch (err: unknown) {
      onError((err as Error)?.message || 'Failed to respond');
    }
  };

  const onRemove = async (guardianId: string) => {
    try {
      await safetyService.removeGuardian(guardianId);
      await onRefresh();
    } catch (err: unknown) {
      onError((err as Error)?.message || 'Failed to remove');
    }
  };

  const filteredLinkers = linkers.filter((l) => {
    const q = linkerSearch.toLowerCase();
    return (
      !q ||
      l.firstName.toLowerCase().includes(q) ||
      l.lastName.toLowerCase().includes(q) ||
      l.username.toLowerCase().includes(q)
    );
  });

  const relationshipOptions = [
    { value: 'parent', label: 'Parent' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'friend', label: 'Friend' },
    { value: 'colleague', label: 'Colleague' },
    { value: 'other', label: 'Other' },
  ] as const;

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-clip">
      {incomingRequests.length > 0 && (
        <section className="mod-card space-y-3 rounded-2xl border border-primary/20 p-4">
          <SentinelSectionHeader
            title="Incoming requests"
            subtitle="Accept to receive their SOS and status updates"
          />
          <ul className="space-y-2">
            {incomingRequests.map((r) => {
              const requester = typeof r.userId === 'string' ? null : r.userId;
              return (
                <li
                  key={r._id}
                  className="mod-inset flex flex-wrap items-center justify-between gap-3 rounded-xl p-3"
                >
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                      {requester
                        ? `${requester.firstName ?? ''} ${requester.lastName ?? ''}`.trim() || requester.email
                        : 'User'}
                    </p>
                    <p className="text-xs capitalize" style={{ color: 'var(--neu-text-muted)' }}>
                      {r.relationshipType ?? 'friend'} · priority {r.priorityLevel}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void onRespond(r._id, 'accepted')}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRespond(r._id, 'rejected')}
                      className="mod-chip px-3 py-1.5 text-xs font-semibold text-brand-red"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mod-card relative z-10 min-w-0 max-w-full space-y-4 overflow-visible rounded-2xl p-4">
        <SentinelSectionHeader
          title="Add a guardian"
          subtitle="Mutual followers only — they get SOS, trips, and your status"
          action={
            <button
              type="button"
              onClick={onLoadLinkers}
              disabled={linkersLoading}
              className="text-xs font-semibold text-primary"
            >
              {linkersLoading ? 'Loading…' : linkers.length ? 'Refresh list' : 'Load followers'}
            </button>
          }
        />
        <form onSubmit={onAddGuardian} className="min-w-0 max-w-full space-y-3 overflow-visible">
          {!linkersLoaded && linkers.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
              Tap <strong className="text-primary">Load followers</strong> to list mutual followers you can add as guardians.
            </p>
          ) : null}

          {linkersLoading ? (
            <div className="mod-inset animate-pulse rounded-xl px-3 py-4 text-center text-xs" style={{ color: 'var(--neu-text-muted)' }}>
              Loading mutual followers…
            </div>
          ) : null}

          {linkersMessage && !linkersLoading ? (
            <p
              className={`text-xs leading-relaxed ${linkers.length === 0 ? 'rounded-xl border border-amber-400/40 bg-amber-50/80 px-3 py-2 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200' : ''}`}
              style={linkers.length > 0 ? { color: 'var(--neu-text-muted)' } : undefined}
            >
              {linkersMessage}
            </p>
          ) : null}

          {linkers.length > 0 && !linkersLoading ? (
            <>
              <input
                value={linkerSearch}
                onChange={(e) => setLinkerSearch(e.target.value)}
                placeholder="Search followers…"
                className="mod-inset w-full rounded-xl px-3 py-2 text-sm"
              />
              <div className="mod-inset max-h-44 space-y-1 overflow-y-auto rounded-xl p-2">
                {filteredLinkers.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                    No matches for your search.
                  </p>
                ) : (
                  filteredLinkers.map((linker) => {
                    const initials =
                      `${linker.firstName?.[0] ?? ''}${linker.lastName?.[0] ?? ''}`.trim() ||
                      linker.username?.[0]?.toUpperCase() ||
                      '?';
                    const displayName =
                      `${linker.firstName} ${linker.lastName}`.trim() || linker.username || 'User';
                    return (
                      <button
                        key={linker._id}
                        type="button"
                        onClick={() => setGuardianForm((p) => ({ ...p, guardianId: linker._id }))}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left ${
                          guardianForm.guardianId === linker._id ? 'bg-primary/15 ring-1 ring-primary' : ''
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                          {initials}
                        </div>
                        <span className="min-w-0 truncate text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
                          {displayName}
                          {linker.username ? (
                            <span className="font-normal" style={{ color: 'var(--neu-text-muted)' }}>
                              {' '}
                              @{linker.username}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : null}
          <div className="grid min-w-0 grid-cols-1 gap-2">
            <input
              value={guardianForm.nickname}
              onChange={(e) => setGuardianForm((p) => ({ ...p, nickname: e.target.value }))}
              placeholder="Nickname (Dad, Aunty…)"
              className="mod-inset w-full min-w-0 max-w-full rounded-xl px-3 py-2 text-sm"
            />
            <BrowseSelect
              ariaLabel="Relationship type"
              value={guardianForm.relationshipType}
              options={[...relationshipOptions]}
              onChange={(v) =>
                setGuardianForm((p) => ({
                  ...p,
                  relationshipType: v as typeof guardianForm.relationshipType,
                }))
              }
            />
          </div>
          <button
            type="submit"
            disabled={!guardianForm.guardianId}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Send guardian request
          </button>
        </form>
      </section>

      <section className="mod-card relative z-0 min-w-0 max-w-full space-y-3 rounded-2xl p-4">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <SentinelSectionHeader title="Your guardians" subtitle="Who receives your emergency alerts" />
          <BrowseSelect
            ariaLabel="Filter guardians by status"
            className="w-full sm:w-36"
            value={statusFilter}
            options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
            onChange={(v) => onStatusFilterChange(v as GuardianStatus | 'all')}
          />
        </div>
        {loading && guardians.length === 0 ? (
          <div className="animate-pulse mod-inset h-20 rounded-xl" />
        ) : guardians.length === 0 ? (
          <BrowseEmptyState
            icon="shield_person"
            title="No guardians yet"
            description="Add trusted contacts so they are notified when you trigger SOS."
          />
        ) : (
          <ul className="space-y-2">
            {guardians.map((g) => {
              const gObj = typeof g.guardianId === 'string' ? null : g.guardianId;
              const gId = typeof g.guardianId === 'string' ? g.guardianId : g.guardianId?._id;
              return (
                <li
                  key={g._id}
                  className="mod-inset flex flex-wrap items-center justify-between gap-2 rounded-xl p-3"
                >
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                      {g.nickname ||
                        `${gObj?.firstName ?? ''} ${gObj?.lastName ?? ''}`.trim() ||
                        gObj?.email ||
                        'Guardian'}
                    </p>
                    <p className="text-xs capitalize" style={{ color: 'var(--neu-text-muted)' }}>
                      {g.relationshipType ?? 'friend'} · priority {g.priorityLevel} · {g.status}
                    </p>
                  </div>
                  {g.status !== 'removed' && gId ? (
                    <button
                      type="button"
                      onClick={() => void onRemove(gId)}
                      className="mod-chip text-xs font-semibold text-brand-red"
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
