import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hubCommunityService } from '@/services/hubCommunity.service';
import { handleApiError } from '@/lib/error-handler';
import type { CreateHubPayload } from '@/types/hubCommunity';

export function useHubCommunitiesList(
  params?: {
    search?: string;
    category?: string;
    joined?: 'true' | 'false' | 'all';
    page?: number;
    limit?: number;
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['hub-communities', params],
    queryFn: () => hubCommunityService.list(params),
    staleTime: 30_000,
    enabled: options?.enabled !== false,
  });
}

export function useHubCommunity(hubId: string | null) {
  return useQuery({
    queryKey: ['hub-community', hubId],
    queryFn: () => hubCommunityService.get(hubId!),
    enabled: !!hubId,
  });
}

export function useHubCommunityByConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ['hub-community-by-conversation', conversationId],
    queryFn: () => hubCommunityService.getByConversation(conversationId!),
    enabled: !!conversationId,
  });
}

export function useHubCommunityMembers(hubId: string | null, page = 1) {
  return useQuery({
    queryKey: ['hub-community-members', hubId, page],
    queryFn: () => hubCommunityService.getMembers(hubId!, page),
    enabled: !!hubId,
  });
}

export function useCreateHubCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHubPayload) => hubCommunityService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-communities'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: handleApiError,
  });
}

export function useJoinHubCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hubId: string) => hubCommunityService.join(hubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-communities'] });
      queryClient.invalidateQueries({ queryKey: ['hub-community'] });
      queryClient.invalidateQueries({ queryKey: ['hub-community-by-conversation'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: handleApiError,
  });
}

export function useLeaveHubCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hubId: string) => hubCommunityService.leave(hubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-communities'] });
      queryClient.invalidateQueries({ queryKey: ['hub-community'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: handleApiError,
  });
}
