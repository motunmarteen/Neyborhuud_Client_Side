"use client";

import Link from "next/link";
import { Job } from "@/types/api";

interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-green-500/20 text-green-400 border-green-500/30",
  "part-time": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contract: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  freelance: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  internship: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const WORKMODE_COLORS: Record<string, string> = {
  "on-site": "bg-orange-500/20 text-orange-400",
  remote: "bg-teal-500/20 text-teal-400",
  hybrid: "bg-indigo-500/20 text-indigo-400",
};

function formatSalary(job: Job) {
  if (!job.salary) return null;
  const { min, max, currency, period } = job.salary;
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n.toLocaleString();
  return `${currency === "NGN" ? "₦" : currency}${fmt(min)} – ${fmt(max)} / ${period}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function JobCard({ job, onApply }: JobCardProps) {
  const employerName =
    job.employer
      ? [job.employer.firstName, job.employer.lastName].filter(Boolean).join(" ") ||
        job.employer.username
      : null;

  const salary = formatSalary(job);

  return (
    <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/jobs/${job.id}`}
            className="text-base font-semibold text-white hover:text-blue-400 transition-colors line-clamp-2"
          >
            {job.title}
          </Link>
          {employerName && (
            <p className="text-sm text-gray-400 mt-0.5 truncate">{employerName}</p>
          )}
        </div>
        {job.status === "filled" && (
          <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 shrink-0">
            Filled
          </span>
        )}
        {job.status === "closed" && (
          <span className="text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full px-2 py-0.5 shrink-0">
            Closed
          </span>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span
          className={`text-xs border rounded-full px-2 py-0.5 capitalize ${TYPE_COLORS[job.type] ?? "bg-gray-700 text-gray-300"}`}
        >
          {(job.type ?? "").replace("-", " ")}
        </span>
        <span
          className={`text-xs rounded-full px-2 py-0.5 capitalize ${WORKMODE_COLORS[job.workMode] ?? "bg-gray-700 text-gray-300"}`}
        >
          {(job.workMode ?? "").replace("-", " ")}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1 text-gray-400 text-sm mb-2">
        <span className="material-symbols-outlined text-[14px]">location_on</span>
        <span className="truncate">
          {[job.location?.lga, job.location?.state].filter(Boolean).join(", ") ||
            "Nigeria"}
        </span>
      </div>

      {/* Salary */}
      {salary && (
        <div className="flex items-center gap-1 text-green-400 text-sm mb-3">
          <span className="material-symbols-outlined text-[14px]">payments</span>
          <span>{salary}</span>
        </div>
      )}

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {job.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-xs bg-gray-800 text-gray-300 rounded px-2 py-0.5"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="text-xs text-gray-500">+{job.skills.length - 3} more</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {typeof job.applications === "number" && (
            <span>{job.applications} applicant{job.applications !== 1 ? "s" : ""}</span>
          )}
          {job.expiresAt && (
            <span>Closes {formatDate(job.expiresAt)}</span>
          )}
        </div>

        {job.status === "active" && onApply && (
          <button
            onClick={() => onApply(job.id)}
            disabled={job.hasApplied}
            className={`text-sm px-3 py-1.5 rounded-full font-semibold transition-all ${
              job.hasApplied
                ? "bg-gray-700 text-gray-400 cursor-default"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {job.hasApplied ? "Applied" : "Apply"}
          </button>
        )}
      </div>
    </div>
  );
}
