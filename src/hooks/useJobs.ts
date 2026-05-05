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
      const pagination =
        (lastPage as any).pagination || (lastPage as any)?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
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
      const pagination =
        (lastPage as any).pagination || (lastPage as any)?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
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
      const pagination =
        (lastPage as any).pagination || (lastPage as any)?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

/** Apply for a job — supports optional cover letter + resume file */
export function useApplyForJob() {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({
        queryKey: ["jobs", "detail", variables.jobId],
      });
      queryClient.invalidateQueries({ queryKey: ["jobs", "my-applications"] });
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

  return useMutation({
    mutationFn: (payload: Parameters<typeof jobsService.createJob>[0]) =>
      jobsService.createJob(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", "list"] });
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
