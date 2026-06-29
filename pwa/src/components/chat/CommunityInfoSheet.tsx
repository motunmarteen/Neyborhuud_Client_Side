'use client';

/**
 * CommunityInfoSheet — WhatsApp-style group-info overlay for hub communities.
 * Tap the community name in the chat header to open.
 * Shows members + roles; admins/owners get management actions.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useHubCommunityByConversation, useHubCommunityMembers, useUpdateHubCommunity, useChangeMemberRole, useLeaveHubCommunity } from '@/hooks/useHubCommunities';
import { useAuth } from '@/hooks/useAuth';
import { BottomSheetDragHandle } from '@/components/ui/BottomSheetDragHandle';
import { useBottomSheetMount } from '@/hooks/useBottomSheetMount';
import { useBottomSheetDrag } from '@/hooks/useBottomSheetDrag';

type Role = 'owner' | 'admin' | 'moderator' | 'member';

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  moderator: 'Mod',
  member: '',
};

interface CommunityInfoSheetProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
}

export function CommunityInfoSheet({ open, onClose, conversationId }: CommunityInfoSheetProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { mounted, visible } = useBottomSheetMount({ open, onClose });
  const { handleProps, getPanelStyle } = useBottomSheetDrag({ onDismiss: onClose });

  const { data: hubData } = useHubCommunityByConversation(open ? conversationId : null);
  const hub = (hubData as { data?: { hub?: any } })?.data?.hub;
  const hubId: string | undefined = hub?.id ?? hub?._id;

  const { data: membersData } = useHubCommunityMembers(open && hubId ? hubId : null);
  const members: any[] = (membersData as { data?: { members?: any[] } })?.data?.members ?? [];

  const myMember = members.find((m) => (m.id ?? m._id ?? m.userId) === user?.id);
  const myRole: Role = myMember?.role ?? 'member';
  const canManage = myRole === 'owner' || myRole === 'admin';

  const updateHub = useUpdateHubCommunity(hubId ?? '');
  const changeRole = useChangeMemberRole(hubId ?? '');
  const leaveMutation = useLeaveHubCommunity();

  const [editName, setEditName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const handleSaveName = async () => {
    if (!hubId || !nameValue.trim()) return;
    try {
      await updateHub.mutateAsync({ name: nameValue.trim() });
      toast.success('Community name updated.');
      setEditName(false);
    } catch { /* handleApiError already toasts */ }
  };

  const handleRoleChange = async (targetUserId: string, newRole: Role) => {
    if (!hubId) return;
    try {
      await changeRole.mutateAsync({ userId: targetUserId, role: newRole });
      toast.success('Role updated.');
    } catch { /* handled */ }
  };

  const handleLeave = async () => {
    if (!hubId) return;
    if (!window.confirm('Leave this community?')) return;
    try {
      await leaveMutation.mutateAsync(hubId);
      toast.success('You left the community.');
      onClose();
      router.push('/friendship?tab=chats');
    } catch { /* handled */ }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <button type="button" className={`absolute inset-0 bg-black/40 transition-opacity ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <section
        className={`relative flex w-full max-h-[90vh] max-w-[560px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl`}
        style={getPanelStyle(visible, 600)}
      >
        <BottomSheetDragHandle handleProps={handleProps} className="pt-2.5 pb-1" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 pb-3">
          <h2 className="text-[16px] font-bold text-slate-900">Community Info</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100">
            <span className="material-symbols-outlined text-[20px] text-slate-500">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Community identity */}
          {hub && (
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                {hub.imageUrl ? (
                  <img src={hub.imageUrl} alt={hub.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[28px] text-slate-400">groups</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {editName ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-[15px] font-semibold focus:border-[#00D431] focus:outline-none"
                    />
                    <button type="button" onClick={handleSaveName} disabled={updateHub.isPending} className="rounded-xl bg-[#00D431] px-3 py-1.5 text-xs font-bold text-white active:scale-95 disabled:opacity-50">Save</button>
                    <button type="button" onClick={() => setEditName(false)} className="text-xs text-slate-400">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[16px] font-bold text-slate-900">{hub.name}</p>
                    {canManage && (
                      <button type="button" onClick={() => { setNameValue(hub.name); setEditName(true); }} className="text-slate-400 hover:text-[#00A555]">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    )}
                  </div>
                )}
                <p className="mt-0.5 text-[13px] text-slate-500">{hub.membersCount ?? members.length} members</p>
                {hub.description && <p className="mt-1 text-[13px] text-slate-500 line-clamp-2">{hub.description}</p>}
              </div>
            </div>
          )}

          {/* Members */}
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Members</p>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
            {members.map((m) => {
              const mid = m.id ?? m._id ?? m.userId;
              const mname = [m.firstName, m.lastName].filter(Boolean).join(' ') || m.username || 'Member';
              const role: Role = m.role ?? 'member';
              const isSelf = mid === user?.id;
              return (
                <div key={mid} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                    {m.avatarUrl ? <img src={m.avatarUrl} alt={mname} className="h-full w-full object-cover" /> : (
                      <span className="text-[13px] font-bold text-slate-400">{mname[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-slate-800">{mname}{isSelf ? ' (you)' : ''}</p>
                    {ROLE_LABEL[role] && (
                      <span className="rounded-full bg-[#00A555]/10 px-2 py-0.5 text-[11px] font-bold text-[#00A555]">{ROLE_LABEL[role]}</span>
                    )}
                  </div>
                  {canManage && !isSelf && role !== 'owner' && (
                    <select
                      value={role}
                      onChange={(e) => handleRoleChange(mid, e.target.value as Role)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-700 focus:outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="moderator">Mod</option>
                      <option value="member">Member</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>

          {/* Leave */}
          {myRole !== 'owner' && (
            <button
              type="button"
              onClick={handleLeave}
              disabled={leaveMutation.isPending}
              className="mt-5 w-full rounded-2xl border border-brand-red/20 bg-brand-red/5 py-3 text-sm font-bold text-brand-red transition-colors hover:bg-brand-red/10 active:scale-95 disabled:opacity-50"
            >
              {leaveMutation.isPending ? 'Leaving…' : 'Leave Community'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
