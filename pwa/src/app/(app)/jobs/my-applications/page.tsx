"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";
import { useMyApplications, useWithdrawApplication } from "@/hooks/useJobs";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:    { bg: "var(--neu-shadow-dark)", color: "var(--neu-text-muted)",   label: "Pending"   },
  reviewing:  { bg: "#1A56FF20",             color: "var(--brand-blue)",        label: "Reviewing" },
  accepted:   { bg: "#006F3520",             color: "var(--primary)",           label: "Accepted"  },
  rejected:   { bg: "#FF000020",             color: "var(--brand-red)",         label: "Rejected"  },
  withdrawn:  { bg: "#f9731620",             color: "#f97316",                  label: "Withdrawn" },
};

export default function MyApplicationsPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMyApplications();
  const withdrawMutation = useWithdrawApplication();

  const apps = data?.pages.flatMap(
    (page) => (page as any)?.data?.applications ?? (page as any)?.applications ?? []
  ) ?? [];

  const { ref, inView } = useInView({ threshold: 0, rootMargin: "300px" });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <LocalHuudSubpageShell hubId="jobs">
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse mod-card rounded-2xl p-4">
              <div className="h-5 rounded-lg w-1/2 mb-3" style={{ background: "var(--neu-shadow-dark)" }} />
              <div className="flex gap-2">
                <div className="h-5 rounded-full w-24" style={{ background: "var(--neu-shadow-dark)" }} />
                <div className="h-5 rounded-full w-16" style={{ background: "var(--neu-shadow-dark)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && apps.length > 0 && (
        <div className="space-y-3">
          {apps.map((app: any) => {
            const style = STATUS_STYLES[app.status] ?? STATUS_STYLES.pending;
            const job = app.jobId ?? {};
            return (
              <div key={app._id ?? app.id} className="mod-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/jobs/${job._id ?? job.id}`}
                      className="font-bold text-base leading-snug hover:underline line-clamp-1"
                      style={{ color: "var(--neu-text)" }}
                    >
                      {job.title ?? "Job Listing"}
                    </Link>
                    {(job.location?.lga || job.location?.state) && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--neu-text-muted)" }}>
                        {[job.location?.lga, job.location?.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold shrink-0"
                    style={{ background: style.bg, color: style.color }}
                  >
                    {style.label}
                  </span>
                </div>

                <p className="text-xs mb-3" style={{ color: "var(--neu-text-muted)" }}>
                  Applied {new Date(app.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </p>

                {app.coverLetter && (
                  <div className="mod-inset rounded-xl px-3 py-2 mb-3">
                    <p
                      className="text-xs line-clamp-2"
                      style={{ color: "var(--neu-text-muted)" }}
                    >
                      &ldquo;{app.coverLetter}&rdquo;
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {app.conversationId && (
                    <Link
                      href={`/chat/${app.conversationId}`}
                      className="text-xs font-semibold transition-all flex items-center gap-1"
                      style={{ color: "var(--primary)" }}
                    >
                      <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                      Open Conversation
                    </Link>
                  )}
                  {app.status === "pending" && (
                    <button
                      onClick={() => withdrawMutation.mutate(app._id ?? app.id)}
                      disabled={withdrawMutation.isPending}
                      className="text-xs font-semibold transition-all"
                      style={{ color: "var(--brand-red)" }}
                    >
                      {withdrawMutation.isPending ? "Withdrawing…" : "Withdraw Application"}
                    </button>
                  )}
                </div>
              </div>
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

      {!isLoading && apps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 mod-card rounded-2xl">
          <div className="w-16 h-16 rounded-full mod-inset flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl" style={{ color: "var(--neu-text-muted)" }}>
              description
            </span>
          </div>
          <p className="text-base font-bold mb-2" style={{ color: "var(--neu-text)" }}>
            No applications yet
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--neu-text-muted)" }}>Browse jobs and apply!</p>
          <Link
            href="/jobs"
            className="px-6 py-2.5 rounded-xl font-bold text-sm mod-chip mod-chip-active text-primary transition-all"
          >
            Browse Jobs
          </Link>
        </div>
      )}
    </LocalHuudSubpageShell>
  );
}
