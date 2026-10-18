'use client';

/**
 * Phase 7 step 4: quests and Huud of the Week, from the server. The server checks every step
 * against real records and pays anything newly finished when the quests are fetched; the
 * "+N HuudCredit" cards come from the HuudCreditListener.
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { emitCoinsUpdated } from '@/lib/gamification-events';

export type QuestStep = { id: string; title: string; icon: string; href: string; done: boolean };
export type Quests = {
  welcome: { steps: QuestStep[]; done: boolean; paid: boolean; reward: number };
  daily: { day: string; quests: (QuestStep & { paid: boolean; reward: number })[]; bonus: { reward: number; paid: boolean; done: boolean } };
  justPaid: number;
};

export type HuudWeek = {
  week: string;
  theme: { id: string; title: string; emoji: string; description: string; goal: number };
  area: { lga: string; state: string } | null;
  progress: number;
  people: number;
  done: boolean;
  areasDone: number;
  reward: number;
  lastWeek: { title: string; emoji: string; done: boolean } | null;
};

const unwrap = <T,>(res: unknown) => ((res as { data?: T })?.data ?? res) as T;

export function useQuests(enabled = true) {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ['gamification', 'quests'],
    queryFn: async () => unwrap<Quests>(await apiClient.get<Quests>('/gamification/quests')),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const paid = q.data?.justPaid ?? 0;
  useEffect(() => {
    if (paid > 0) {
      for (const key of ['stats', 'wallet', 'transactions']) void queryClient.invalidateQueries({ queryKey: ['gamification', key] });
      emitCoinsUpdated();
    }
  }, [paid, q.dataUpdatedAt, queryClient]);
  return q;
}

export function useHuudWeek(enabled = true) {
  return useQuery({
    queryKey: ['gamification', 'huud-of-the-week'],
    queryFn: async () => unwrap<HuudWeek>(await apiClient.get<HuudWeek>('/gamification/huud-of-the-week')),
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
