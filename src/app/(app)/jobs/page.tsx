"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { AppBrowseLayout } from "@/components/layout/AppBrowseLayout";
import { BrowseEmptyState } from "@/components/layout/BrowseEmptyState";
import {
  LocalHuudHubHeader,
  LocalHuudHubPrimaryAction,
} from "@/components/local-huud/LocalHuudHubHeader";
import JobCard from "@/components/jobs/JobCard";
import JobFilters, { JobsFilterState } from "@/components/jobs/JobFilters";
import ApplyModal from "@/components/jobs/ApplyModal";
import { useJobs, useSaveJob } from "@/hooks/useJobs";

const DEFAULT_FILTERS: JobsFilterState = { type: "All", workMode: "All", category: "All" };

export default function JobsPage() {
  const [filters, setFilters] = useState<JobsFilterState>(DEFAULT_FILTERS);
  const [applyTarget, setApplyTarget] = useState<{ id: string; title: string } | null>(null);
  const saveJob = useSaveJob();

  const apiFilter = {
    ...(filters.type !== "All" && { type: filters.type }),
    ...(filters.workMode !== "All" && { workMode: filters.workMode }),
    ...(filters.category !== "All" && { category: filters.category }),
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useJobs(Object.keys(apiFilter).length ? apiFilter : undefined);

  const jobs = data?.pages.flatMap((page) => (page as any)?.data?.jobs ?? (page as any)?.jobs ?? []) ?? [];

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0, rootMargin: "400px" });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <LocalHuudHubHeader
          hubId="jobs"
          toolbar={
            <div className="space-y-3">
              <div className="flex justify-end">
                <LocalHuudHubPrimaryAction href="/jobs/create" label="Post job" />
              </div>
              <JobFilters filters={filters} onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))} />
            </div>
          }
        />
      }
    >
      {isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mod-card aspect-[4/5] animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <BrowseEmptyState
          icon="warning"
          title="Could not load jobs"
          description="Check your connection and try again."
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="mod-chip mod-chip-active rounded-xl px-5 py-2.5 text-sm font-bold text-primary"
            >
              Retry
            </button>
          }
        />
      )}

      {!isLoading && !error && jobs.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {jobs.map((job: any, idx: number) => (
            <JobCard
              key={job.id || job._id || `job-${idx}`}
              job={job}
              onApply={(id) => setApplyTarget({ id, title: job.title })}
              onSave={(id, isSaved) => saveJob.mutate({ jobId: id, saved: isSaved })}
            />
          ))}
          <div ref={loadMoreRef} className="col-span-2 flex justify-center py-2">
            {isFetchingNextPage ? (
              <span className="text-sm text-[var(--neu-text-muted)]">Loading more…</span>
            ) : null}
          </div>
        </div>
      )}

      {!isLoading && !error && jobs.length === 0 && (
        <BrowseEmptyState
          icon="work_off"
          title="No jobs found"
          description={
            Object.keys(apiFilter).length
              ? "Try different filters to see more listings."
              : "Be the first to post a job in your Huud."
          }
          action={
            <Link
              href="/jobs/create"
              className="mod-chip mod-chip-active inline-flex rounded-xl px-5 py-2.5 text-sm font-bold text-primary no-underline"
            >
              Post a job
            </Link>
          }
        />
      )}

      {applyTarget ? (
        <ApplyModal
          jobId={applyTarget.id}
          jobTitle={applyTarget.title}
          onClose={() => setApplyTarget(null)}
        />
      ) : null}
    </AppBrowseLayout>
  );
}
