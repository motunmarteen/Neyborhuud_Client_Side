'use client';

/**
 * Phase 7 step 5 data: badges (16 + Legacy), the HuudCredit shop, shout-outs, community
 * projects, sponsored missions, and the admin tools for them. Everything is checked and paid
 * on the server; these hooks only read and ask.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { emitCoinsUpdated } from '@/lib/gamification-events';

const unwrap = <T,>(res: unknown) => ((res as { data?: T })?.data ?? res) as T;
const get = async <T,>(url: string) => unwrap<T>(await apiClient.get<T>(url));
const post = async <T,>(url: string, body?: unknown) => unwrap<T>(await apiClient.post<T>(url, body ?? {}));

// ── Types ────────────────────────────────────────────────────────────────────

export type Badge = { id: string; name: string; emoji: string; group: string; description: string; goal: number; progress: number; earned: boolean; earnedAt?: string };
export type LegacyBadge = { id: string; name: string; emoji: string; description: string; earnedAt?: string };
export type ShopItem = { id: string; kind: 'map_skin' | 'frame' | 'shoutout' | 'birthday_board'; name: string; emoji: string; description: string; price: number; href?: string };
export type Shop = { items: ShopItem[]; owned: string[]; equipped: { mapSkin: string | null; profileFrame: string | null }; balance: number };
export type Shoutout = { id: string; message: string; createdAt: string; from: { name: string; username?: string; avatarUrl?: string } | null };
export type Project = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  lga: string;
  state: string;
  goal: number;
  raised: number;
  matched: number;
  total: number;
  backers: number;
  sponsor: { name: string; ratio: number; cap: number } | null;
  status: 'open' | 'funded' | 'done' | 'cancelled';
  doneNote: string | null;
  myPledge: number;
};
export type Mission = {
  id: string;
  title: string;
  description: string;
  sponsor: string;
  emoji: string;
  reward: number;
  area: { lga: string; state: string } | null;
  endsAt: string;
  placesLeft: number;
  done: boolean;
};

function useRefreshCoins() {
  const qc = useQueryClient();
  return () => {
    for (const key of ['stats', 'wallet', 'transactions', 'shop']) void qc.invalidateQueries({ queryKey: ['gamification', key] });
    emitCoinsUpdated();
  };
}

// ── Badges ───────────────────────────────────────────────────────────────────

export function useMyBadges() {
  return useQuery({ queryKey: ['gamification', 'badges-v2'], queryFn: () => get<{ badges: Badge[]; legacy: LegacyBadge[] }>('/gamification/badges-v2'), staleTime: 60_000, retry: false });
}

export function useUserBadges(userId: string | undefined) {
  return useQuery({
    queryKey: ['gamification', 'user-badges', userId],
    queryFn: () => get<{ earned: Omit<Badge, 'goal' | 'progress' | 'earned' | 'group'>[]; legacy: LegacyBadge[] }>(`/gamification/users/${userId}/badges-v2`),
    enabled: !!userId,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

// ── Shop ─────────────────────────────────────────────────────────────────────

export function useShop(enabled = true) {
  return useQuery({ queryKey: ['gamification', 'shop'], queryFn: () => get<Shop>('/gamification/shop'), enabled, staleTime: 60_000, retry: false });
}

export function useBuyItem() {
  const qc = useQueryClient();
  const refresh = useRefreshCoins();
  return useMutation({
    mutationFn: (itemId: string) => post<Shop>('/gamification/shop/buy', { itemId }),
    onSuccess: (shop) => {
      qc.setQueryData(['gamification', 'shop'], shop);
      refresh();
    },
  });
}

export function useEquipItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { slot: 'mapSkin' | 'profileFrame'; itemId: string | null }) => post<Shop>('/gamification/shop/equip', v),
    onSuccess: (shop) => qc.setQueryData(['gamification', 'shop'], shop),
  });
}

// ── Shout-outs ───────────────────────────────────────────────────────────────

export function useShoutouts(userId: string | undefined) {
  return useQuery({
    queryKey: ['gamification', 'shoutouts', userId],
    queryFn: async () => (await get<{ shoutouts: Shoutout[] }>(`/gamification/users/${userId}/shoutouts`)).shoutouts,
    enabled: !!userId,
    staleTime: 60_000,
    retry: false,
  });
}

export function useSendShoutout(toUserId: string) {
  const qc = useQueryClient();
  const refresh = useRefreshCoins();
  return useMutation({
    mutationFn: (message: string) => post('/gamification/shoutouts', { toUserId, message }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['gamification', 'shoutouts', toUserId] });
      refresh();
    },
  });
}

export function useHideShoutout(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post(`/gamification/shoutouts/${id}/hide`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['gamification', 'shoutouts', userId] }),
  });
}

// ── Projects ─────────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: ['gamification', 'projects'],
    queryFn: () => get<{ area: { lga: string; state: string } | null; projects: Project[] }>('/gamification/projects'),
    staleTime: 60_000,
    retry: false,
  });
}

export function usePledge() {
  const qc = useQueryClient();
  const refresh = useRefreshCoins();
  return useMutation({
    mutationFn: (v: { projectId: string; amount: number }) => post<{ project: Project }>(`/gamification/projects/${v.projectId}/pledge`, { amount: v.amount }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['gamification', 'projects'] });
      refresh();
    },
  });
}

// ── Missions ─────────────────────────────────────────────────────────────────

export function useMissions() {
  return useQuery({
    queryKey: ['gamification', 'missions'],
    queryFn: async () => (await get<{ missions: Mission[] }>('/gamification/missions')).missions,
    staleTime: 60_000,
    retry: false,
  });
}

export function useCompleteMission() {
  const qc = useQueryClient();
  const refresh = useRefreshCoins();
  return useMutation({
    mutationFn: (v: { missionId: string; code: string }) => post<{ reward: number }>(`/gamification/missions/${v.missionId}/complete`, { code: v.code }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['gamification', 'missions'] });
      refresh();
    },
  });
}

// ── Admin ────────────────────────────────────────────────────────────────────

export type WeekTheme = { id: string; title: string; emoji: string; description: string; goal: number; week?: string };

export function useAdminHuudWeek() {
  return useQuery({
    queryKey: ['admin', 'huud-week'],
    queryFn: () => get<{ themes: WeekTheme[]; current: WeekTheme; next: WeekTheme }>('/gamification/admin/huud-week'),
    retry: false,
  });
}

export function useSetHuudWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { themeId: string; which: 'this' | 'next'; goal?: number }) => unwrap(await apiClient.put('/gamification/huud-of-the-week', v)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'huud-week'] });
      void qc.invalidateQueries({ queryKey: ['gamification', 'huud-of-the-week'] });
    },
  });
}

export type AdminProject = Omit<Project, 'id' | 'matched' | 'total' | 'myPledge'> & { _id: string };

export function useAdminProjects() {
  return useQuery({ queryKey: ['admin', 'projects'], queryFn: async () => (await get<{ projects: AdminProject[] }>('/gamification/admin/projects')).projects, retry: false });
}

export function useAdminCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { title: string; description: string; emoji: string; lga: string; state: string; goal: number; sponsor: { name: string; ratio: number; cap: number } | null }) =>
      post('/gamification/admin/projects', v),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'projects'] }),
  });
}

export function useAdminProjectStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: 'done' | 'cancelled'; note?: string }) => post(`/gamification/admin/projects/${v.id}/status`, { status: v.status, note: v.note }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'projects'] }),
  });
}

export type AdminMission = { id: string; title: string; sponsor: string; emoji: string; reward: number; area: string; startsAt: string; endsAt: string; completions: number; maxCompletions: number; status: string };

export function useAdminMissions() {
  return useQuery({ queryKey: ['admin', 'missions'], queryFn: async () => (await get<{ missions: AdminMission[] }>('/gamification/admin/missions')).missions, retry: false });
}

export function useAdminCreateMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: Record<string, unknown>) => post<{ id: string; code: string }>('/gamification/admin/missions', v),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'missions'] }),
  });
}

export function useAdminEndMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post(`/gamification/admin/missions/${id}/end`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'missions'] }),
  });
}

export type EconomyReport = { weeks: { week: string; earned: number; spent: number; earners: number; spenders: number }[]; outstanding: number; reversals: number };

export function useAdminEconomy() {
  return useQuery({ queryKey: ['admin', 'economy'], queryFn: () => get<EconomyReport>('/gamification/admin/economy'), retry: false });
}

export function useAdminReverse() {
  return useMutation({ mutationFn: (v: { refId: string; why: string }) => post<{ impact: number; coins: number }>('/gamification/admin/reverse', v) });
}
