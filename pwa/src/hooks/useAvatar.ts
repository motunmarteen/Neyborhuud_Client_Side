'use client';

/** 3D avatar data: the catalogue (prices from the server), my avatar, saving and buying. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiBaseUrl } from '@/lib/api-client';
import { emitCoinsUpdated } from '@/lib/gamification-events';

export type AvatarItem = { id: string; slot: string; name: string; price: number; color?: string };
export type AvatarConfig = Record<string, string>;
type Catalogue = { items: AvatarItem[]; defaults: AvatarConfig };
type Mine = { avatar: { config: AvatarConfig; updatedAt: string | null; hasPortrait: boolean } | null; owned: string[]; balance: number };

const unwrap = <T,>(res: unknown) => ((res as { data?: T })?.data ?? res) as T;

export function useAvatarCatalogue() {
  return useQuery({
    queryKey: ['avatar', 'catalogue'],
    queryFn: async () => unwrap<Catalogue>(await apiClient.get('/avatar/catalogue')),
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

export function useMyAvatar() {
  return useQuery({ queryKey: ['avatar', 'me'], queryFn: async () => unwrap<Mine>(await apiClient.get('/avatar/me')), retry: 1 });
}

export function useSaveAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { config: AvatarConfig; portrait?: string }) => unwrap(await apiClient.put('/avatar/me', v)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['avatar'] });
      void qc.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useBuyAvatarItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => unwrap<{ owned: string[] }>(await apiClient.post('/avatar/buy', { itemId })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['avatar', 'me'] });
      for (const key of ['stats', 'wallet', 'transactions', 'shop']) void qc.invalidateQueries({ queryKey: ['gamification', key] });
      emitCoinsUpdated();
    },
  });
}

/** Full URL of an avatar portrait from its API path ("/avatar/<id>/portrait.png?v=…"). */
export function avatarPortraitUrl(path: string | undefined | null): string | undefined {
  return path ? `${getApiBaseUrl()}${path}` : undefined;
}
