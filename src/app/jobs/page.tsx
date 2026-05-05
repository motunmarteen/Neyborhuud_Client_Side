"use client";

import { useState } from "react";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import JobCard from "@/components/jobs/JobCard";
import JobFilters, { JobsFilterState } from "@/components/jobs/JobFilters";
import ApplyModal from "@/components/jobs/ApplyModal";
import { useJobs } from "@/hooks/useJobs";

export default function JobsPage() {
  const [filters, setFilters] = useState<JobsFilterState>({
    type: "All",
    workMode: "All",
    category: "All",
  });
  const [applyTarget, setApplyTarget] = useState<{ id: string; title: string } | null>(null);

  function handleFilterChange(key: keyof JobsFilterState, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const apiFilter = {
    ...(filters.type !== "All" && { type: filters.type }),
    ...(filters.workMode !== "All" && { workMode: filters.workMode }),
    ...(filters.category !== "All" && { category: filters.category }),
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    useJobs(Object.keys(apiFilter).length ? apiFilter : undefined);

  const jobs = data?.pages.flatMap((page) => (page as any).data ?? []) ?? [];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#1a1a2e] border-b border-gray-800 backdrop-blur-md bg-opacity-95">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-400 text-2xl">work</span>
                  <h1 className="text-2xl font-bold text-white">Jobs</h1>
                </div>
                <Link
                  href="/jobs/create"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-full font-semibold transition-all flex items-center gap-2 text-white text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Post a Job
                </Link>
              </div>

              {/* Quick Links */}
              <div className="flex gap-2 mb-4">
                <Link
                  href="/jobs/my-applications"
                  className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-all text-sm flex items-center gap-1.5 border border-gray-700"
                >
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  My Applications
                </Link>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
            {/* Filters */}
            <JobFilters filters={filters} onChange={handleFilterChange} />

            {/* Loading */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse bg-[#1a1a2e] border border-gray-800 rounded-xl p-4">
                    <div className="h-5 bg-gray-800 rounded w-2/3 mb-3" />
                    <div className="h-3 bg-gray-800 rounded w-1/3 mb-3" />
                    <div className="flex gap-2 mb-3">
                      <div className="h-5 bg-gray-800 rounded-full w-20" />
                      <div className="h-5 bg-gray-800 rounded-full w-16" />
                    </div>
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">Could not load jobs</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Jobs List */}
            {!isLoading && !error && jobs.length > 0 && (
              <>
                <div className="space-y-4">
                  {jobs.map((job: any, idx: number) => (
                    <JobCard
                      key={job.id || `job-${idx}`}
                      job={job}
                      onApply={(id) =>
                        setApplyTarget({ id, title: job.title })
                      }
                    />
                  ))}
                </div>

                {hasNextPage && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-8 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 rounded-lg font-semibold transition-colors"
                    >
                      {isFetchingNextPage ? "Loading…" : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty */}
            {!isLoading && !error && jobs.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-gray-600 text-6xl">work_off</span>
                <h3 className="text-xl font-semibold text-gray-400 mt-4 mb-2">No jobs found</h3>
                <p className="text-gray-500 mb-6">
                  {Object.keys(apiFilter).length
                    ? "Try different filters"
                    : "Be the first to post a job in your area!"}
                </p>
                <Link
                  href="/jobs/create"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
                >
                  Post a Job
                </Link>
              </div>
            )}
          </div>
        </div>
        <RightSidebar />
      </div>
      <BottomNav />

      {/* Apply Modal */}
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
