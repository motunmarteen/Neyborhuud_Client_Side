"use client";

import { useState } from "react";
import { AppBrowseLayout } from "@/components/layout/AppBrowseLayout";
import { LocalHuudHubHeader } from "@/components/local-huud/LocalHuudHubHeader";
import { JobsBrowse, JobsToolbar } from "@/components/work/JobsBrowse";
import type { JobsFilterState } from "@/components/jobs/JobFilters";

const DEFAULT_FILTERS: JobsFilterState = { type: "All", workMode: "All", category: "All" };

export default function JobsPage() {
  const [filters, setFilters] = useState<JobsFilterState>(DEFAULT_FILTERS);

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <LocalHuudHubHeader
          hubId="jobs"
          toolbar={
            <JobsToolbar
              filters={filters}
              onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
            />
          }
        />
      }
    >
      <JobsBrowse filters={filters} />
    </AppBrowseLayout>
  );
}
