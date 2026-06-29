/**
 * Jobs Hook
 * Manages job postings, applications, and saved jobs with React Query
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { jobsService } from "@/services/jobs.service";
import { getErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { useAwardCoins } from "@/hooks/useGamification";

export interface JobsFilter {
  type?: string;
  category?: string;
  workMode?: string;
  minSalary?: number;
  maxSalary?: number;
}

/** Paginated list of jobs with optional filters */
export function useJobs(filter?: JobsFilter) {
  return useInfiniteQuery({
    queryKey: ["jobs", "list", filter],
    queryFn: ({ pageParam = 1 }) =>
      jobsService.getJobs(pageParam as number, 20, filter),
    getNextPageParam: (lastPage) => {
      const p =
        (lastPage as any).pagination ||
        (lastPage as any)?.data?.pagination;
      if (!p) return undefined;
      return p.page < p.pages ? p.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 60000,
  });
}

/** Single job by id */
export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: ["jobs", "detail", jobId],
    queryFn: () => jobsService.getJob(jobId!),
    enabled: !!jobId,
    staleTime: 30000,
  });
}

/** Current user's submitted applications */
export function useMyApplications() {
  return useInfiniteQuery({
    queryKey: ["jobs", "my-applications"],
    queryFn: ({ pageParam = 1 }) =>
      jobsService.getMyApplications(pageParam as number, 20),
    getNextPageParam: (lastPage) => {
      const p =
        (lastPage as any).pagination ||
        (lastPage as any)?.data?.pagination;
      if (!p) return undefined;
      return p.page < p.pages ? p.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30000,
  });
}

/** Current user's saved jobs */
export function useSavedJobs() {
  return useInfiniteQuery({
    queryKey: ["jobs", "saved"],
    queryFn: ({ pageParam = 1 }) =>
      jobsService.getSavedJobs(pageParam as number, 20),
    getNextPageParam: (lastPage) => {
      const p =
        (lastPage as any).pagination ||
        (lastPage as any)?.data?.pagination;
      if (!p) return undefined;
      return p.page < p.pages ? p.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

/** Apply for a job — supports optional cover letter + resume file */
export function useApplyForJob() {
  const queryClient = useQueryClient();
  const awardCoins = useAwardCoins();

  return useMutation({
    mutationFn: ({
      jobId,
      coverLetter,
      resume,
    }: {
      jobId: string;
      coverLetter?: string;
      resume?: File;
    }) => jobsService.applyForJob(jobId, coverLetter, resume),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feed-discovery"] });
      queryClient.invalidateQueries({
        queryKey: ["jobs", "detail", variables.jobId],
      });
      queryClient.invalidateQueries({ queryKey: ["jobs", "my-applications"] });
      awardCoins("job_applied");
      toast.success("Application submitted successfully!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to submit application");
    },
  });
}

/** Create a new job posting */
export function useCreateJob() {
  const queryClient = useQueryClient();
  const awardCoins = useAwardCoins();

  return useMutation({
    mutationFn: (payload: Parameters<typeof jobsService.createJob>[0]) =>
      jobsService.createJob(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "list"] });
      awardCoins("job_posted");
      toast.success("Job posted successfully!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to post job");
    },
  });
}

/** Update an existing job posting */
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      data,
    }: {
      jobId: string;
      data: Parameters<typeof jobsService.updateJob>[1];
    }) => jobsService.updateJob(jobId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["jobs", "detail", variables.jobId],
      });
      queryClient.invalidateQueries({ queryKey: ["jobs", "list"] });
      toast.success("Job updated successfully!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to update job");
    },
  });
}

/** Delete a job posting */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => jobsService.deleteJob(jobId),
    onSuccess: (_data, jobId) => {
      queryClient.removeQueries({ queryKey: ["jobs", "detail", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "list"] });
      toast.success("Job deleted.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to delete job");
    },
  });
}

/** Withdraw a pending application */
export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationId: string) =>
      jobsService.withdrawApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "my-applications"] });
      toast.success("Application withdrawn.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to withdraw application");
    },
  });
}

/** Save / unsave a job */
export function useSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, saved }: { jobId: string; saved: boolean }) =>
      saved ? jobsService.unsaveJob(jobId) : jobsService.saveJob(jobId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feed-discovery"] });
      queryClient.invalidateQueries({
        queryKey: ["jobs", "detail", variables.jobId],
      });
      queryClient.invalidateQueries({ queryKey: ["jobs", "saved"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to save job");
    },
  });
}

/** Close a job posting */
export function useCloseJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => jobsService.closeJob(jobId),
    onSuccess: (_data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "detail", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "list"] });
      toast.success("Job closed.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to close job");
    },
  });
}

/** Reopen a closed job posting */
export function useReopenJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => jobsService.reopenJob(jobId),
    onSuccess: (_data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "detail", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "list"] });
      toast.success("Job reopened.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to reopen job");
    },
  });
}

/** Report a job */
export function useReportJob() {
  return useMutation({
    mutationFn: ({ jobId, reason, description }: { jobId: string; reason: string; description?: string }) =>
      jobsService.reportJob(jobId, reason, description),
    onSuccess: () => {
      toast.success("Job reported. Thank you.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to report job");
    },
  });
}

/** Nearby jobs by coordinates */
export function useNearbyJobs(latitude: number | null, longitude: number | null) {
  return useQuery({
    queryKey: ["jobs", "nearby", latitude, longitude],
    queryFn: () => jobsService.getNearbyJobs(latitude!, longitude!),
    enabled: latitude !== null && longitude !== null,
    staleTime: 60000,
  });
}

/** Fetch up to `limit` jobs posted by a specific user (for profile pages) */
export function useUserJobs(userId: string | null, limit = 3) {
  return useQuery({
    queryKey: ["jobs", "by-user", userId, limit],
    queryFn: async () => {
      const res = await jobsService.getJobs(1, limit, { employerId: userId! });
      const items = (res as any)?.data ?? (res as any)?.jobs ?? (res as any) ?? [];
      return Array.isArray(items) ? items : (items?.data ?? []);
    },
    enabled: !!userId,
    staleTime: 60_000,
    retry: false,
  });
}

export function useBoostJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, days }: { jobId: string; days: 3 | 7 }) =>
      jobsService.boostJob(jobId, days),
    onSuccess: (res, { days }) => {
      const data = (res as any)?.data ?? res;
      const until = data?.boostedUntil
        ? new Date(data.boostedUntil).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
        : "";
      toast.success(
        data?.extended ? `Boost extended! Featured until ${until} 🚀` : `Job boosted for ${days} days! 🚀`,
        { description: `${data?.deducted ?? "–"} HuudCoins deducted.` },
      );
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "wallet"] });
    },
    onError: (error) => toast.error(getErrorMessage(error) || "Boost failed. Please try again."),
  });
}
