"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import JobCard from "@/components/jobs/JobCard";
import { useSavedJobs, useSaveJob } from "@/hooks/useJobs";

export default function SavedJobsPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useSavedJobs();
  const saveJob = useSaveJob();

  const savedItems = data?.pages.flatMap(
    (page) => (page as any)?.data?.savedJobs ?? (page as any)?.savedJobs ?? []
  ) ?? [];

  const { ref, inView } = useInView({ threshold: 0, rootMargin: "300px" });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden neu-base">
      <LeftSidebar />

      <main className="flex flex-col flex-1 overflow-y-auto">
        <TopNav />

        <div className="px-4 pt-5 pb-20">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/jobs"
              className="p-2 rounded-xl mod-btn transition-all"
              style={{ color: "var(--neu-text-muted)" }}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--neu-text)" }}>Saved Jobs</h1>
              <p className="text-xs" style={{ color: "var(--neu-text-muted)" }}>Jobs you have bookmarked</p>
            </div>
          </div>

          {/* Skeleton */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse mod-card rounded-2xl p-4">
                  <div className="h-5 rounded-lg w-2/3 mb-3" style={{ background: "var(--neu-shadow-dark)" }} />
                  <div className="flex gap-2 mb-3">
                    <div className="h-5 rounded-full w-24" style={{ background: "var(--neu-shadow-dark)" }} />
                    <div className="h-5 rounded-full w-16" style={{ background: "var(--neu-shadow-dark)" }} />
                  </div>
                  <div className="h-3 rounded-lg w-1/2" style={{ background: "var(--neu-shadow-dark)" }} />
                </div>
              ))}
            </div>
          )}

          {/* List */}
          {!isLoading && savedItems.length > 0 && (
            <div className="space-y-3">
              {savedItems.map((item: any, idx: number) => {
                const job = item.jobId ?? item;
                const jobId = job._id ?? job.id;
                return (
                  <JobCard
                    key={jobId ?? `saved-${idx}`}
                    job={{ ...job, isSaved: true }}
                    onSave={(id) => saveJob.mutate({ jobId: id, saved: true })}
                  />
                );
              })}
              <div ref={ref} className="py-2 flex justify-center">
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
          {!isLoading && savedItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 mod-card rounded-2xl">
              <div className="w-16 h-16 rounded-full mod-inset flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl" style={{ color: "var(--neu-text-muted)" }}>
                  bookmark_border
                </span>
              </div>
              <p className="text-base font-bold mb-2" style={{ color: "var(--neu-text)" }}>No saved jobs yet</p>
              <p className="text-sm mb-6" style={{ color: "var(--neu-text-muted)" }}>
                Bookmark jobs to revisit them later
              </p>
              <Link
                href="/jobs"
                className="px-6 py-2.5 rounded-xl font-bold text-sm mod-btn-active text-primary transition-all"
              >
                Browse Jobs
              </Link>
            </div>
          )}
        </div>
      </main>

      <RightSidebar />
      <BottomNav />
    </div>
  );
}
