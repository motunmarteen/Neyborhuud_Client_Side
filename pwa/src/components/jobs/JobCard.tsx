"use client";

import { Job } from "@/types/api";
import { fromKobo } from "@/lib/currency";
import { BrowseTile } from "@/components/feed/BrowseTile";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";

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

const WORK_MODE: Record<string, string> = {
  "on-site": "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
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
  const isSaved = !!(job as any).isSaved;
  const place = [job.location?.lga, job.location?.state].filter(Boolean).join(", ");
  const meta = [
    place || null,
    typeof job.applications === "number" ? `${job.applications} applied` : null,
    timeAgo(job.createdAt),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <BrowseTile
      href={`/jobs/${jobId}`}
      kind="job"
      title={job.title}
      status={isClosed ? (job.status === "filled" ? "Filled" : "Closed") : undefined}
      highlight={salary ? <span className="text-brand-green-dark">{salary}</span> : undefined}
      byline={employerName ?? undefined}
      chips={
        <>
          {(job as any).isBoosted ? <Chip tone="amber" icon="🚀">Boosted</Chip> : null}
          <Chip tone="blue">{TYPE_LABELS[job.type] ?? job.type}</Chip>
          {job.workMode ? <Chip>{WORK_MODE[job.workMode] ?? job.workMode}</Chip> : null}
        </>
      }
      meta={meta}
      action={
        onSave
          ? { icon: "bookmark", label: isSaved ? "Remove from saved jobs" : "Save job", on: isSaved, onPress: () => onSave(jobId, isSaved) }
          : undefined
      }
      footer={
        !isClosed && onApply ? (
          <Button
            size="sm"
            fullWidth
            variant={job.hasApplied ? "soft" : "primary"}
            disabled={!!job.hasApplied}
            onClick={() => onApply(jobId)}
          >
            {job.hasApplied ? "✓ Applied" : "Apply"}
          </Button>
        ) : undefined
      }
    />
  );
}
