import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { huudGistService } from '@/services/huudGist.service';
import { handleApiError } from '@/lib/error-handler';
import { useAwardCoins } from '@/hooks/useGamification';
import type {
  CreateGistCommentPayload,
  HuudGistComment,
  HuudGistPost,
  UpdateHuudGistPayload,
} from '@/types/huudGist';

export function useHuudGistList(filters?: {
  type?: string;
  section?: string;
  page?: number;
  limit?: number;
}) {
  return useInfiniteQuery({
    queryKey: ['huudGist', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await huudGistService.listThreads({
        ...filters,
        page: pageParam,
        limit: 20,
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const p = lastPage?.pagination;
      if (!p) return undefined;
      return p.page < p.totalPages ? p.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useHuudGistDetail(threadId: string | null) {
  return useQuery({
    queryKey: ['huudGist-detail', threadId],
    queryFn: async () => {
      if (!threadId) throw new Error('Thread ID required');
      const response = await huudGistService.getThread(threadId);
      return response.data;
    },
    enabled: !!threadId,
  });
}

export function useHuudGistMutations(threadId: string) {
  const queryClient = useQueryClient();
  const awardCoins = useAwardCoins();

  const likeMutation = useMutation({
    mutationFn: () => huudGistService.likeThread(threadId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['huudGist-detail', threadId] });
      queryClient.invalidateQueries({ queryKey: ['huudGist'] });
    },
    onError: handleApiError,
  });

  const deleteMutation = useMutation({
    mutationFn: () => huudGistService.deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['huudGist'] });
      queryClient.removeQueries({ queryKey: ['huudGist-detail', threadId] });
    },
    onError: handleApiError,
  });

  const commentMutation = useMutation({
    mutationFn: (payload: CreateGistCommentPayload) =>
      huudGistService.addComment(threadId, payload),
    onSuccess: () => {
      awardCoins('gossip_commented');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['huudGist-detail', threadId] });
      queryClient.invalidateQueries({ queryKey: ['huudGist'] });
    },
    onError: handleApiError,
  });

  return {
    likeThread: likeMutation.mutate,
    deleteThread: deleteMutation.mutateAsync,
    addComment: commentMutation.mutateAsync,
    isLiking: likeMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCommenting: commentMutation.isPending,
  };
}

export function useCreateHuudGist() {
  const queryClient = useQueryClient();
  const awardCoins = useAwardCoins();

  return useMutation({
    mutationFn: huudGistService.createThread,
    onSuccess: () => {
      awardCoins('gossip_created');
      queryClient.invalidateQueries({ queryKey: ['huudGist'] });
    },
    onError: handleApiError,
  });
}

export type { HuudGistPost, HuudGistComment, UpdateHuudGistPayload };
