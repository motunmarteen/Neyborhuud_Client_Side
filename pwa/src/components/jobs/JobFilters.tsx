"use client";

import { ChipRow, ChipSelect } from "@/components/ui/Chip";

export interface JobsFilterState {
  type: string;
  workMode: string;
  category: string;
}

interface JobFiltersProps {
  filters: JobsFilterState;
  onChange: (key: keyof JobsFilterState, value: string) => void;
}

const TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
const WORK_MODES = ["On-site", "Remote", "Hybrid"];
const CATEGORIES = ["Tech", "Healthcare", "Education", "Finance", "Construction", "Agriculture", "Transport", "Hospitality", "Marketing", "Other"];

/** The values the server expects: "full-time", "on-site"… ("All" = no filter). */
const options = (anyLabel: string, list: string[]) => [
  { value: "All", label: anyLabel },
  ...list.map((o) => ({ value: o.toLowerCase().replace(" ", "-"), label: o })),
];

/** One row of dropdown chips (owner 2026-11-26: was three rows of chips). */
export default function JobFilters({ filters, onChange }: JobFiltersProps) {
  return (
    <ChipRow label="Filter jobs">
      <ChipSelect label="Type" value={filters.type} options={options("Any type", TYPES)} onChange={(v) => onChange("type", v)} />
      <ChipSelect label="Where" value={filters.workMode} options={options("Anywhere", WORK_MODES)} onChange={(v) => onChange("workMode", v)} />
      <ChipSelect label="Field" value={filters.category} options={options("Any field", CATEGORIES)} onChange={(v) => onChange("category", v)} />
    </ChipRow>
  );
}
