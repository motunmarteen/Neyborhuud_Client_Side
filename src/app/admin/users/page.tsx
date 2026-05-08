'use client';

import { useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import {
  useAdminUsers,
  useSuspendUser,
  useUnsuspendUser,
  useVerifyUser,
  useUnverifyUser,
  useUpdateUserRole,
  useDeleteUser,
} from '@/hooks/useAdmin';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { User } from '@/types/api';

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  user:        'bg-slate-700 text-slate-200',
  moderator:   'bg-sky-700 text-sky-100',
  admin:       'bg-violet-700 text-violet-100',
  super_admin: 'bg-amber-600 text-amber-100',
};

// ── Suspend modal ─────────────────────────────────────────────────────────────

function SuspendModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const suspend = useSuspendUser();

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    const uid = (user as any)._id ? String((user as any)._id) : user.id;
    await suspend.mutateAsync({
      userId: uid,
      reason,
      duration: duration ? Number(duration) : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a2e] p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-black text-white">Suspend @{user.username}</h3>
        <label className="mb-1 block text-xs font-bold text-white/60">Reason <span className="text-red-400">*</span></label>
        <textarea
          className="w-full rounded-xl bg-white/10 p-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
          rows={3}
          placeholder="Why is this user being suspended?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <label className="mb-1 mt-3 block text-xs font-bold text-white/60">Duration (days, leave blank = permanent)</label>
        <input
          type="number"
          min={1}
          className="w-full rounded-xl bg-white/10 p-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="e.g. 7"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-bold text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || suspend.isPending}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {suspend.isPending ? 'Suspending…' : 'Suspend'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────

function UserRow({ user }: { user: User }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);

  const verify    = useVerifyUser();
  const unverify  = useUnverifyUser();
  const unsuspend = useUnsuspendUser();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  const uid = (user as any)._id ? String((user as any)._id) : user.id;
  const isSuspended = (user as any).status === 'suspended' || (user as any).isSuspended === true;
  const initial = ((user.firstName || user.username)?.[0] ?? 'U').toUpperCase();

  return (
    <>
      {showSuspend && <SuspendModal user={user} onClose={() => setShowSuspend(false)} />}
      <tr className="border-b border-white/5 hover:bg-white/3 transition-colors">
        {/* Avatar + name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.username} className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">@{user.username}</p>
              <p className="truncate text-xs text-white/40">{user.email}</p>
            </div>
          </div>
        </td>

        {/* Role */}
        <td className="hidden px-4 py-3 sm:table-cell">
          <span className={`inline-block rounded-lg px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${ROLE_COLORS[user.role] ?? ROLE_COLORS.user}`}>
            {user.role}
          </span>
        </td>

        {/* Verification */}
        <td className="hidden px-4 py-3 md:table-cell">
          {(user as any).emailVerified || (user as any).isVerified ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
              <span className="material-symbols-outlined text-[14px]">mark_email_read</span> Verified
            </span>
          ) : (
            <span className="text-xs text-amber-400/70">Unverified</span>
          )}
        </td>

        {/* Status */}
        <td className="hidden px-4 py-3 md:table-cell">
          <span className={`text-xs font-bold ${isSuspended ? 'text-red-400' : 'text-emerald-400'}`}>
            {isSuspended ? 'Suspended' : 'Active'}
          </span>
        </td>

        {/* Joined */}
        <td className="hidden px-4 py-3 lg:table-cell text-xs text-white/40">
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-right">
          <div className="relative inline-block">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-xl border border-white/10 p-2 text-white/50 hover:text-white transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">more_horiz</span>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a2e] shadow-2xl">
                  {/* Verify / Unverify */}
                  <button
                    onClick={() => { user.identityVerified ? unverify.mutate(uid) : verify.mutate(uid); setMenuOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    {user.identityVerified ? 'Remove Verification' : 'Verify User'}
                  </button>

                  {/* Suspend / Unsuspend */}
                  {isSuspended ? (
                    <button
                      onClick={() => { unsuspend.mutate(uid); setMenuOpen(false); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-emerald-400 hover:bg-white/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">lock_open</span>
                      Unsuspend
                    </button>
                  ) : (
                    <button
                      onClick={() => { setShowSuspend(true); setMenuOpen(false); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-amber-400 hover:bg-white/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">block</span>
                      Suspend
                    </button>
                  )}

                  {/* Change role */}
                  <div className="border-t border-white/10 px-4 py-2">
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-white/30">Change Role</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(['user', 'moderator', 'admin'] as const).filter((r) => r !== user.role).map((r) => (
                        <button
                          key={r}
                          onClick={() => { updateRole.mutate({ userId: uid, role: r }); setMenuOpen(false); }}
                          className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/60 hover:bg-white/20 hover:text-white capitalize transition-colors"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`Permanently delete @${user.username}? This cannot be undone.`)) {
                        deleteUser.mutate({ userId: uid, reason: 'Admin action' });
                      }
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    Delete Account
                  </button>
                </div>
              </>
            )}
          </div>
        </td>
      </tr>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ROLE_FILTERS = ['All', 'user', 'moderator', 'admin', 'super_admin'];
const STATUS_FILTERS = ['All', 'active', 'suspended'];

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const debouncedSearch = useDebouncedValue(search, 300);

  const filter = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(roleFilter !== 'All' ? { role: roleFilter } : {}),
    ...(statusFilter !== 'All' ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminUsers(filter);

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0, rootMargin: '200px' });
  const handleInView = useCallback(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => { handleInView(); });

  const allUsers: User[] =
    data?.pages.flatMap((p: any) => {
      const items = p?.users ?? p?.data ?? p?.items ?? [];
      return Array.isArray(items) ? items : [];
    }) ?? [];

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Users</h1>
          <p className="text-sm text-white/40">Manage all NeyborHuud accounts</p>
        </div>
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-white/30">search</span>
          <input
            type="search"
            placeholder="Search by username or email…"
            className="w-full rounded-xl bg-white/10 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-emerald-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-1">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition-colors ${
                roleFilter === r
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="ml-2 flex flex-wrap gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-sky-600 text-white'
                  : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-white/50">
            <span className="material-symbols-outlined text-[40px] text-red-400">error</span>
            <p className="mt-2 text-sm">Could not load users.</p>
          </div>
        ) : allUsers.length === 0 ? (
          <div className="py-16 text-center text-white/40">
            <span className="material-symbols-outlined text-[40px]">person_search</span>
            <p className="mt-2 text-sm">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/30">User</th>
                  <th className="hidden px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/30 sm:table-cell">Role</th>
                  <th className="hidden px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/30 md:table-cell">Email Verified</th>
                  <th className="hidden px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/30 md:table-cell">Status</th>
                  <th className="hidden px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/30 lg:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-white/30">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user: User) => (
                  <UserRow key={user.id ?? (user as any)._id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
        )}
      </div>
    </div>
  );
}
