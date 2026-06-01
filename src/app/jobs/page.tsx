"use client";

import { useState } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
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

  // Infinite scroll
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0, rootMargin: "400px" });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  function handleFilterChange(key: keyof JobsFilterState, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden neu-base">
      <LeftSidebar />

      <main
        data-app-scroll-root
        className="feed-scroll-main flex flex-col flex-1 overflow-y-auto scroll-smooth"
      >
        <TopNav />

        <div className="flex flex-col pb-20">
          {/* Header */}
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="mod-inset rounded-xl size-10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-primary">work</span>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--neu-text-muted)" }}>Find work near you</p>
                </div>
              </div>
              <Link
                href="/jobs/create"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm mod-chip mod-chip-active text-primary transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Post Job
              </Link>
            </div>

            {/* Quick action links */}
            <div className="flex gap-2 mb-4">
              <Link
                href="/jobs/my-applications"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold mod-chip transition-all"
                style={{ color: "var(--neu-text-secondary)" }}
              >
                <span className="material-symbols-outlined text-[14px]">description</span>
                My Applications
              </Link>
              <Link
                href="/jobs/saved"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold mod-chip transition-all"
                style={{ color: "var(--neu-text-secondary)" }}
              >
                <span className="material-symbols-outlined text-[14px]">bookmark</span>
                Saved
              </Link>
            </div>

            {/* Filters */}
            <JobFilters filters={filters} onChange={handleFilterChange} />
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="px-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse mod-card rounded-2xl p-4">
                  <div
                    className="h-5 rounded-lg w-2/3 mb-3"
                    style={{ background: "var(--neu-shadow-dark)" }}
                  />
                  <div className="flex gap-2 mb-3">
                    <div className="h-5 rounded-full w-20" style={{ background: "var(--neu-shadow-dark)" }} />
                    <div className="h-5 rounded-full w-16" style={{ background: "var(--neu-shadow-dark)" }} />
                  </div>
                  <div
                    className="h-3 rounded-lg w-1/2"
                    style={{ background: "var(--neu-shadow-dark)" }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="px-4">
              <div className="flex flex-col items-center justify-center py-12 mod-card rounded-2xl">
                <div className="w-14 h-14 rounded-full mod-inset flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl text-brand-red">warning</span>
                </div>
                <p className="text-sm mb-4" style={{ color: "var(--neu-text)" }}>Could not load jobs</p>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm mod-chip transition-all"
                  style={{ color: "var(--neu-text)" }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Jobs List */}
          {!isLoading && !error && jobs.length > 0 && (
            <div className="px-4 space-y-3">
              {jobs.map((job: any, idx: number) => (
                <JobCard
                  key={job.id || job._id || `job-${idx}`}
                  job={job}
                  onApply={(id) => setApplyTarget({ id, title: job.title })}
                  onSave={(id, isSaved) => saveJob.mutate({ jobId: id, saved: isSaved })}
                />
              ))}
              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} className="py-2 flex justify-center">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--neu-text-muted)" }}>
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Loading more…
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && jobs.length === 0 && (
            <div className="px-4">
              <div className="flex flex-col items-center justify-center py-16 mod-card rounded-2xl">
                <div className="w-16 h-16 rounded-full mod-inset flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl" style={{ color: "var(--neu-text-muted)" }}>
                    work_off
                  </span>
                </div>
                <p className="text-base font-bold mb-2" style={{ color: "var(--neu-text)" }}>
                  No jobs found
                </p>
                <p className="text-sm text-center mb-6" style={{ color: "var(--neu-text-muted)" }}>
                  {Object.keys(apiFilter).length
                    ? "Try different filters"
                    : "Be the first to post a job in your area!"}
                </p>
                <Link
                  href="/jobs/create"
                  className="px-6 py-2.5 rounded-xl font-bold text-sm mod-chip mod-chip-active text-primary transition-all"
                >
                  Post a Job
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <RightSidebar />
      <BottomNav />

      {applyTarget && (
        <ApplyModal
          jobId={applyTarget.id}
          jobTitle={applyTarget.title}
          onClose={() => setApplyTarget(null)}
        />
      )}
    </div>
  );
}
