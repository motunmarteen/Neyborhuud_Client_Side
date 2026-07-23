"use client";

import Link from "next/link";
import { Job } from "@/types/api";
import { fromKobo } from "@/lib/currency";

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

/* Job type → gradient background */
const TYPE_GRADIENTS: Record<string, string> = {
  "full-time": "linear-gradient(135deg, #1a2a4a 0%, #2a4a8a 50%, #3a5aaa 100%)",
  "part-time": "linear-gradient(135deg, #2a1a4a 0%, #5a3a8a 50%, #7a5aaa 100%)",
  contract: "linear-gradient(135deg, #1a3a2a 0%, #2a6a4a 50%, #3a8a5a 100%)",
  freelance: "linear-gradient(135deg, #3a2a1a 0%, #6a4a2a 50%, #8a6a3a 100%)",
  internship: "linear-gradient(135deg, #1a2a3a 0%, #2a4a6a 50%, #3a6a9a 100%)",
};

function formatSalary(job: Job) {
  if (!job.salary || (!job.salary.min && !job.salary.max)) return null;
  const { min, max, currency, period } = job.salary;
  const sym = currency === "NGN" ? "₦" : currency;
  // min/max from the API are integer kobo — convert to naira before applying
  // the k/M abbreviation thresholds below, which are naira-scale.
  const fmt = (koboAmount: number) => {
    const n = fromKobo(koboAmount);
    return n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1000
      ? `${(n / 1000).toFixed(0)}k`
      : n.toLocaleString();
  };
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
  const gradient = TYPE_GRADIENTS[job.type] || TYPE_GRADIENTS["full-time"];

  return (
    <div className="group/card relative overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
      {/* Full card with gradient background — Stake-style */}
      <div
        className="relative w-full aspect-[4/5] overflow-hidden rounded-2xl"
        style={{ background: gradient }}
      >
        {/* Large watermark icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-white/[0.06]" style={{ fontSize: '120px' }}>
            work
          </span>
        </div>

        {/* Top badges */}
        <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white/90 backdrop-blur-sm border border-white/10">
            {TYPE_LABELS[job.type] ?? job.type}
          </span>
          <span className="flex items-center gap-0.5 rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-bold text-white/80 backdrop-blur-sm border border-white/10">
            <span className="material-symbols-outlined text-[10px]">
              {WORKMODE_ICONS[job.workMode] ?? "work"}
            </span>
            {job.workMode.replace("-", " ")}
          </span>
          {job.category && (
            <span className="rounded-full bg-primary/25 px-2 py-0.5 text-[8px] font-bold uppercase text-emerald-100 backdrop-blur-sm border border-primary/20">
              {job.category}
            </span>
          )}
        </div>

        {/* Top-right badges */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          {(job as any).isBoosted && (
            <span className="flex items-center gap-0.5 rounded-full bg-primary/90 px-2 py-0.5 text-[8px] font-black text-slate-900">
              🚀 Boosted
            </span>
          )}
          {isClosed && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[8px] font-bold text-white/70 backdrop-blur-sm">
              {job.status === "filled" ? "Filled" : "Closed"}
            </span>
          )}
          {job.hasApplied && !isClosed && (
            <span className="rounded-full bg-primary/25 px-2 py-0.5 text-[8px] font-bold text-primary backdrop-blur-sm">
              Applied
            </span>
          )}
        </div>

        {/* Save button */}
        {onSave && (
          <button
            onClick={(e) => { e.stopPropagation(); onSave(jobId, !!(job as any).isSaved); }}
            className="absolute bottom-14 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl border border-white/15 transition-all hover:scale-110 active:scale-90"
            aria-label="Save job"
          >
            <span
              className="material-symbols-outlined text-[17px]"
              style={{
                color: (job as any).isSaved ? "#00D431" : "white",
                filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))",
              }}
            >
              {(job as any).isSaved ? "bookmark" : "bookmark_border"}
            </span>
          </button>
        )}

        {/* Bottom overlaid content — Stake-style */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-3 space-y-1 bg-gradient-to-t from-black/60 to-transparent pt-12">
          <Link
            href={`/jobs/${jobId}`}
            className="block text-[13px] font-extrabold text-white leading-tight line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] hover:underline"
          >
            {job.title}
          </Link>
          {employerName && (
            <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wide truncate">
              {employerName}
            </p>
          )}

          {/* Salary highlight */}
          {salary && (
            <p className="text-[12px] font-black text-primary drop-shadow-[0_0_8px_rgba(0,212,49,0.3)]">
              {salary}
            </p>
          )}

          {/* Stat row */}
          <div className="flex items-center gap-3 pt-0.5">
            {(job.location?.lga || job.location?.state) && (
              <div className="flex items-center gap-1">
                <span className="inline-block w-[5px] h-[5px] rounded-full bg-primary" />
                <span className="text-[10px] font-medium text-white/55">
                  {[job.location?.lga, job.location?.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            {typeof job.applications === "number" && (
              <span className="text-[10px] text-white/40">{job.applications} applied</span>
            )}
            <span className="text-[10px] text-white/35">{timeAgo(job.createdAt)}</span>
          </div>

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {job.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-bold text-white/65 border border-white/5"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 3 && (
                <span className="text-[8px] font-bold text-white/40 px-1 py-0.5">+{job.skills.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Apply button bar below card */}
      <div className="pt-2 px-1">
        {!isClosed && onApply ? (
          <button
            onClick={() => onApply(jobId)}
            disabled={!!job.hasApplied}
            className={`w-full py-2 rounded-xl text-[11px] font-bold text-center transition-all ${
              job.hasApplied
                ? "bg-white/[0.04] border border-white/[0.06] text-[var(--neu-text-muted)] cursor-default"
                : "bg-primary/10 border border-primary/15 text-primary hover:bg-primary/20"
            }`}
          >
            {job.hasApplied ? "✓ Applied" : "Apply Now"}
          </button>
        ) : (
          <Link
            href={`/jobs/${jobId}`}
            className="block w-full py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-center text-[11px] font-bold text-[var(--neu-text-muted)] transition-all hover:bg-white/[0.08]"
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
}
