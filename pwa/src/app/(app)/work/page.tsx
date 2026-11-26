"use client";

/**
 * /work — unified "Work" hub (Phase 3, Step 6).
 * Light merge: one page with a Hiring / For Hire toggle that swaps between the
 * existing jobs and services browse experiences. The standalone /jobs and
 * /services routes (and their sub-pages) remain intact underneath.
 */

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppBrowseLayout } from "@/components/layout/AppBrowseLayout";
import { JobsBrowse, JobsToolbar } from "@/components/work/JobsBrowse";
import { ServicesBrowse, ServicesToolbar } from "@/components/work/ServicesBrowse";
import type { JobsFilterState } from "@/components/jobs/JobFilters";

type WorkTab = "hiring" | "for_hire";

const DEFAULT_JOB_FILTERS: JobsFilterState = { type: "All", workMode: "All", category: "All" };

function WorkHubContent() {
  const searchParams = useSearchParams();
  const initialTab: WorkTab =
    searchParams.get("tab") === "for_hire" || searchParams.get("tab") === "services"
      ? "for_hire"
      : "hiring";

  const [tab, setTab] = useState<WorkTab>(initialTab);

  // Jobs (Hiring) filter state
  const [jobFilters, setJobFilters] = useState<JobsFilterState>(DEFAULT_JOB_FILTERS);
  // Services (For Hire) filter state
  const [category, setCategory] = useState("All");
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-[22px] text-primary">work</span>
            <h1 className="text-[20px] font-extrabold tracking-tight text-[var(--neu-text)]">Work</h1>
          </div>

          {/* Hiring / For Hire toggle */}
          <div
            role="tablist"
            aria-label="Work sections"
            className="flex border-b border-line"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "hiring"}
              onClick={() => setTab("hiring")}
              className={`relative h-11 flex-1 text-sm transition-colors ${
                tab === "hiring" ? "font-extrabold text-navy after:absolute after:inset-x-6 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary" : "font-semibold text-muted"
              }`}
            >
              Hiring
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "for_hire"}
              onClick={() => setTab("for_hire")}
              className={`relative h-11 flex-1 text-sm transition-colors ${
                tab === "for_hire" ? "font-extrabold text-navy after:absolute after:inset-x-6 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary" : "font-semibold text-muted"
              }`}
            >
              For Hire
            </button>
          </div>

          {/* Active side's toolbar */}
          {tab === "hiring" ? (
            <JobsToolbar
              filters={jobFilters}
              onChange={(key, value) => setJobFilters((f) => ({ ...f, [key]: value }))}
            />
          ) : (
            <ServicesToolbar
              category={category}
              minRating={minRating}
              onCategory={setCategory}
              onMinRating={setMinRating}
            />
          )}
        </div>
      }
    >
      {tab === "hiring" ? (
        <JobsBrowse filters={jobFilters} />
      ) : (
        <ServicesBrowse category={category} minRating={minRating} />
      )}
    </AppBrowseLayout>
  );
}

export default function WorkHubPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--neu-text-muted)]">Loading…</div>}>
      <WorkHubContent />
    </Suspense>
  );
}
