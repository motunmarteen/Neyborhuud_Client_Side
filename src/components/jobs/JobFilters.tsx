"use client";

export interface JobsFilterState {
  type: string;
  workMode: string;
  category: string;
}

interface JobFiltersProps {
  filters: JobsFilterState;
  onChange: (key: keyof JobsFilterState, value: string) => void;
}

const TYPES = ["All", "Full-time", "Part-time", "Contract", "Freelance", "Internship"];
const WORK_MODES = ["All", "On-site", "Remote", "Hybrid"];
const CATEGORIES = [
  "All", "Tech", "Healthcare", "Education", "Finance",
  "Construction", "Agriculture", "Transport", "Hospitality", "Marketing", "Other",
];

function FilterRow({
  options,
  active,
  onSelect,
}: {
  options: string[];
  active: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {options.map((opt) => {
        const value = opt === "All" ? "All" : opt.toLowerCase().replace(" ", "-");
        const isActive = active === "All" ? opt === "All" : active === value;
        return (
          <button
            key={opt}
            onClick={() => onSelect(opt === "All" ? "All" : value)}
            className={`text-xs px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold transition-all ${
              isActive ? "mod-btn-active text-primary" : "mod-btn"
            }`}
            style={isActive ? {} : { color: "var(--neu-text-secondary)" }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function JobFilters({ filters, onChange }: JobFiltersProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold shrink-0 w-14" style={{ color: "var(--neu-text-muted)" }}>
          Type
        </span>
        <FilterRow
          options={TYPES}
          active={filters.type}
          onSelect={(v) => onChange("type", v)}
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold shrink-0 w-14" style={{ color: "var(--neu-text-muted)" }}>
          Mode
        </span>
        <FilterRow
          options={WORK_MODES}
          active={filters.workMode}
          onSelect={(v) => onChange("workMode", v)}
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold shrink-0 w-14" style={{ color: "var(--neu-text-muted)" }}>
          Field
        </span>
        <FilterRow
          options={CATEGORIES}
          active={filters.category}
          onSelect={(v) => onChange("category", v)}
        />
      </div>
    </div>
  );
}
