"use client";

import { ChipRow, ChipSelect, FilterChip } from "@/components/ui/Chip";

export interface EventsFilterState {
  type: string;
  date: string;
}

const TYPE_OPTIONS = ["All", "Community", "Social", "Sports", "Cultural", "Educational", "Business", "Other"];

const DATE_OPTIONS = [
  { value: "All", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "this-week", label: "This week" },
  { value: "this-month", label: "This month" },
];

interface Props {
  filters: EventsFilterState;
  onChange: (key: keyof EventsFilterState, value: string) => void;
}

/** One row (owner 2026-11-26): when, as a dropdown chip, then the kinds of event. */
export default function EventFilters({ filters, onChange }: Props) {
  return (
    <ChipRow label="Filter events">
      <ChipSelect label="Any time" value={filters.date} options={DATE_OPTIONS} onChange={(v) => onChange("date", v)} />
      <span aria-hidden className="h-5 w-px shrink-0 bg-line" />
      {TYPE_OPTIONS.map((opt) => {
        const val = opt === "All" ? "All" : opt.toLowerCase();
        return (
          <FilterChip key={opt} active={filters.type === val} onClick={() => onChange("type", val)}>
            {opt}
          </FilterChip>
        );
      })}
    </ChipRow>
  );
}
