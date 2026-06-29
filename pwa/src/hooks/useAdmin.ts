'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminService } from '@/services/admin.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

function unwrap<T>(res: any): T {
  return (res as any)?.data ?? res;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => unwrap(await adminService.getDashboardStats()),
    retry: false,
    staleTime: 30_000,
  });
}

// ─── Users ───────────────────────────────────────────────────────────────────

export type AdminUserFilter = {
  search?: string;
  role?: string;
  status?: string;
  verified?: boolean;
};

export function useAdminUsers(filter: AdminUserFilter = {}) {
  return useInfiniteQuery({
    queryKey: ['admin', 'users', filter],
    queryFn: async ({ pageParam = 1 }) =>
      unwrap(await adminService.getUsers(pageParam as number, 20, filter)),
    getNextPageParam: (last: any) =>
      last?.pagination?.hasMore ? (last.pagination.page ?? 1) + 1 : undefined,
    initialPageParam: 1,
    retry: false,
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      reason,
      duration,
    }: {
      userId: string;
      reason: string;
      duration?: number;
    }) => adminService.suspendUser(userId, reason, duration),
    onSuccess: () => {
      toast.success('User suspended.');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Could not suspend user.'),
  });
}

export function useUnsuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.unsuspendUser(userId),
    onSuccess: () => {
      toast.success('User unsuspended.');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Could not unsuspend user.'),
  });
}

export function useVerifyUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.verifyUser(userId),
    onSuccess: () => {
      toast.success('User verified.');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Could not verify user.'),
  });
}

export function useUnverifyUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.unverifyUser(userId),
    onSuccess: () => {
      toast.success('Verification removed.');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Could not unverify user.'),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: 'user' | 'moderator' | 'admin';
    }) => adminService.updateUserRole(userId, role),
    onSuccess: () => {
      toast.success('Role updated.');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Could not update role.'),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.deleteUser(userId, reason),
    onSuccess: () => {
      toast.success('User deleted.');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Could not delete user.'),
  });
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export type AdminReportFilter = {
  status?: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  targetType?: string;
};

export function useAdminReports(filter: AdminReportFilter = {}) {
  return useInfiniteQuery({
    queryKey: ['admin', 'reports', filter],
    queryFn: async ({ pageParam = 1 }) =>
      unwrap(await adminService.getReports(pageParam as number, 20, filter)),
    getNextPageParam: (last: any) =>
      last?.pagination?.hasMore ? (last.pagination.page ?? 1) + 1 : undefined,
    initialPageParam: 1,
    retry: false,
  });
}

export function useAdminReport(reportId: string | null) {
  return useQuery({
    queryKey: ['admin', 'reports', reportId],
    queryFn: async () => unwrap(await adminService.getReport(reportId!)),
    enabled: !!reportId,
    retry: false,
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      action,
      notes,
    }: {
      reportId: string;
      action: 'dismiss' | 'remove' | 'warn' | 'suspend';
      notes?: string;
    }) => adminService.resolveReport(reportId, action, notes),
    onSuccess: () => {
      toast.success('Report resolved.');
      qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
    onError: () => toast.error('Could not resolve report.'),
  });
}
