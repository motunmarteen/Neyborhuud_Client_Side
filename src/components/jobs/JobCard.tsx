"use client";

import Link from "next/link";
import { Job } from "@/types/api";

interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string, isSaved: boolean) => void;
}

const TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
};

const WORKMODE_ICONS: Record<string, string> = {
  "on-site": "location_city",
  remote: "home_work",
  hybrid: "sync_alt",
};

function formatSalary(job: Job) {
  if (!job.salary || (!job.salary.min && !job.salary.max)) return null;
  const { min, max, currency, period } = job.salary;
  const sym = currency === "NGN" ? "₦" : currency;
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1000
      ? `${(n / 1000).toFixed(0)}k`
      : n.toLocaleString();
  return `${sym}${fmt(min)} – ${fmt(max)} / ${period}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function JobCard({ job, onApply, onSave }: JobCardProps) {
  const jobId = (job as any)._id ?? job.id;
  const employerName = job.employer
    ? [job.employer.firstName, job.employer.lastName].filter(Boolean).join(" ") ||
      job.employer.username
    : null;

  const salary = formatSalary(job);
  const isClosed = job.status === "closed" || job.status === "filled";

  return (
    <div className="mod-card rounded-2xl p-4 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/jobs/${jobId}`}
            className="text-[15px] font-bold leading-snug line-clamp-2 hover:text-primary transition-colors"
            style={{ color: "var(--neu-text)" }}
          >
            {job.title}
          </Link>
          {employerName && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--neu-text-muted)" }}>
              {employerName}
            </p>
          )}
        </div>

        {/* Status badge */}
        {isClosed ? (
          <span
            className="text-xs px-2 py-0.5 rounded-full shrink-0 mod-inset font-medium"
            style={{ color: "var(--neu-text-muted)" }}
          >
            {job.status === "filled" ? "Filled" : "Closed"}
          </span>
        ) : job.hasApplied ? (
          <span className="text-xs px-2.5 py-0.5 rounded-full shrink-0 font-bold bg-primary/15 text-primary">
            Applied
          </span>
        ) : null}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span
          className="text-xs px-2.5 py-0.5 rounded-full font-semibold mod-inset"
          style={{ color: "var(--neu-text-secondary)" }}
        >
          {TYPE_LABELS[job.type] ?? job.type}
        </span>
        <span
          className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold mod-inset"
          style={{ color: "var(--neu-text-secondary)" }}
        >
          <span className="material-symbols-outlined text-[11px]">
            {WORKMODE_ICONS[job.workMode] ?? "work"}
          </span>
          {job.workMode.replace("-", " ")}
        </span>
        {job.category && (
          <span
            className="text-xs px-2.5 py-0.5 rounded-full font-medium"
            style={{
              background: "var(--primary)",
              color: "#fff",
              opacity: 0.8,
            }}
          >
            {job.category}
          </span>
        )}
      </div>

      {/* Location + Salary row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {(job.location?.lga || job.location?.state) && (
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--neu-text-muted)" }}>
            <span className="material-symbols-outlined text-[13px]">location_on</span>
            <span>{[job.location?.lga, job.location?.state].filter(Boolean).join(", ")}</span>
          </div>
        )}
        {salary && (
          <div className="flex items-center gap-1 text-xs font-semibold text-primary">
            <span className="material-symbols-outlined text-[13px]">payments</span>
            <span>{salary}</span>
          </div>
        )}
      </div>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="text-[11px] px-2 py-0.5 rounded-lg mod-btn"
              style={{ color: "var(--neu-text-secondary)" }}
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-[11px]" style={{ color: "var(--neu-text-muted)" }}>
              +{job.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3 mt-1"
        style={{ borderTop: "1px solid var(--neu-shadow-dark)" }}
      >
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--neu-text-muted)" }}>
          {typeof job.applications === "number" && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">group</span>
              {job.applications}
            </span>
          )}
          <span>{timeAgo(job.createdAt)}</span>
          {job.expiresAt && (
            <span>
              Closes{" "}
              {new Date(job.expiresAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onSave && (
            <button
              onClick={() => onSave(jobId, !!(job as any).isSaved)}
              className="p-1.5 rounded-lg mod-btn transition-all"
              aria-label="Save job"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ color: (job as any).isSaved ? "var(--primary)" : "var(--neu-text-muted)" }}
              >
                {(job as any).isSaved ? "bookmark" : "bookmark_border"}
              </span>
            </button>
          )}

          {!isClosed && onApply && (
            <button
              onClick={() => onApply(jobId)}
              disabled={!!job.hasApplied}
              className={`text-xs px-4 py-1.5 rounded-xl font-bold transition-all ${
                job.hasApplied
                  ? "mod-inset opacity-60"
                  : "mod-btn-active text-primary"
              }`}
            >
              {job.hasApplied ? "Applied" : "Apply Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
