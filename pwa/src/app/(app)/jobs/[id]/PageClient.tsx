"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";
import ApplyModal from "@/components/jobs/ApplyModal";
import { useJob, useSaveJob, useCloseJob, useBoostJob } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { BoostModal } from "@/components/gamification/BoostModal";
import { formatNaira } from "@/lib/currency";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { RowsSkeleton } from "@/components/friendship/PeopleRows";


function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [showApply, setShowApply] = useState(false);
  const [showBoost, setShowBoost] = useState(false);

  const { data, isLoading, error } = useJob(id);
  const saveJob = useSaveJob();
  const closeJob = useCloseJob();
  const boostJob = useBoostJob();

  const job = (data as any)?.data ?? data;

  if (isLoading) {
    return (
      <LocalHuudSubpageShell hubId="jobs">
        <RowsSkeleton rows={3} />
      </LocalHuudSubpageShell>
    );
  }

  if (error || !job) {
    return (
      <LocalHuudSubpageShell hubId="jobs">
        <EmptyState icon="💼" title="Job not found" description="It may have been closed or removed." action={{ label: "See jobs", href: "/jobs" }} />
      </LocalHuudSubpageShell>
    );
  }

  const isOwner = user?.id === job.employerId;
  const employerName = job.employer
    ? [job.employer.firstName, job.employer.lastName].filter(Boolean).join(" ") ||
      job.employer.username
    : null;

  const facts: { icon: string; label: string; value: string }[] = [
    { icon: "location_on", label: "Where", value: [job.location?.lga, job.location?.state].filter(Boolean).join(", ") || "Nigeria" },
    { icon: "category", label: "Field", value: job.category },
    ...(job.salary ? [{ icon: "payments", label: "Pay", value: `${formatNaira(job.salary.min)} – ${formatNaira(job.salary.max)} a ${String(job.salary.period).replace(/ly$/, "").replace("dai", "day")}` }] : []),
    ...(job.expiresAt ? [{ icon: "event", label: "Closes", value: formatDate(job.expiresAt) }] : []),
    ...(typeof job.applications === "number" ? [{ icon: "group", label: "Applied", value: `${job.applications} ${job.applications === 1 ? "person" : "people"}` }] : []),
  ];
  const card = "rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)]";

  return (
    <>
    <LocalHuudSubpageShell hubId="jobs">
      <section className={card}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-extrabold leading-tight text-navy">{job.title}</h1>
            {employerName ? (
              <p className="mt-1 text-sm text-muted">
                by{" "}
                {job.employer?.username ? (
                  <Link href={`/profile/${job.employer.username}`} className="font-bold text-brand-green-dark">
                    {employerName}
                  </Link>
                ) : (
                  employerName
                )}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => saveJob.mutate({ jobId: job.id, saved: !!job.isSaved })}
            disabled={saveJob.isPending}
            aria-label={job.isSaved ? "Remove from saved" : "Save job"}
            aria-pressed={!!job.isSaved}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-background text-navy hover:bg-[#E6EAF0]"
          >
            <span
              className={`material-symbols-outlined text-[22px] ${job.isSaved ? "text-brand-green-dark" : ""}`}
              style={{ fontVariationSettings: job.isSaved ? "'FILL' 1" : "'FILL' 0" }}
              aria-hidden
            >
              bookmark
            </span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Chip tone="green">{(job.type ?? "").replace("-", " ")}</Chip>
          <Chip tone="blue">{(job.workMode ?? "").replace("-", " ")}</Chip>
          {job.status && job.status !== "active" ? <Chip tone="red">{job.status === "filled" ? "Filled" : "Closed"}</Chip> : null}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-background p-3">
          {facts.map((f) => (
            <div key={f.label} className="flex min-w-0 items-start gap-2">
              <span className="material-symbols-outlined mt-0.5 text-[18px] text-brand-green-dark" aria-hidden>{f.icon}</span>
              <div className="min-w-0">
                <dt className="text-[12px] font-semibold text-muted">{f.label}</dt>
                <dd className="text-sm font-bold leading-snug text-navy first-letter:uppercase">{f.value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <div className="mt-4">
          {isOwner ? (
            <div className="flex gap-2">
              {job.status === "active" ? (
                <Button variant="secondary" className="flex-1" loading={closeJob.isPending} onClick={() => closeJob.mutate(job.id)}>
                  Close job
                </Button>
              ) : null}
              <Button variant="soft" className="flex-1" onClick={() => setShowBoost(true)}>
                {job.isBoosted ? "Extend boost" : "Boost"}
              </Button>
            </div>
          ) : job.status === "active" ? (
            <Button fullWidth disabled={job.hasApplied} onClick={() => setShowApply(true)}>
              {job.hasApplied ? "You applied" : "Apply"}
            </Button>
          ) : null}
        </div>
      </section>

      <section className={card}>
        <h2 className="font-heading text-base font-extrabold text-navy">About the job</h2>
        <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-navy">{job.description}</p>
        {job.requirements?.length ? (
          <>
            <h2 className="mt-4 font-heading text-base font-extrabold text-navy">You need</h2>
            <ul className="mt-1.5 space-y-1.5">
              {job.requirements.map((req: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[15px] text-navy">
                  <span className="material-symbols-outlined mt-0.5 text-[18px] text-brand-green-dark" aria-hidden>check_circle</span>
                  {req}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {job.skills?.length ? (
          <>
            <h2 className="mt-4 font-heading text-base font-extrabold text-navy">Skills</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.skills.map((skill: string) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
            </div>
          </>
        ) : null}
        <p className="mt-4 text-[13px] text-muted">Posted {formatDate(job.createdAt)}</p>
      </section>
    </LocalHuudSubpageShell>

      {showApply && (
        <ApplyModal
          jobId={job.id}
          jobTitle={job.title}
          onClose={() => setShowApply(false)}
        />
      )}

      {showBoost && (
        <BoostModal
          type="job"
          itemTitle={job.title}
          options={[
            { days: 3, coins: 200, label: "3 Days" },
            { days: 7, coins: 400, label: "7 Days", badge: "Best Value" },
          ]}
          defaultDays={7}
          isPending={boostJob.isPending}
          alreadyActive={job.isBoosted}
          activeUntil={job.boostedUntil}
          onConfirm={(days) => boostJob.mutate({ jobId: job.id ?? id, days: days as 3 | 7 })}
          onClose={() => setShowBoost(false)}
        />
      )}
    </>
  );
}
