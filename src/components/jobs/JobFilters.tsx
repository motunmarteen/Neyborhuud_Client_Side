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
  "All",
  "Tech",
  "Healthcare",
  "Education",
  "Finance",
  "Construction",
  "Agriculture",
  "Transport",
  "Hospitality",
  "Other",
];

function FilterRow({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: string[];
  active: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 shrink-0 w-16">{label}</span>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {options.map((opt) => {
          const value = opt === "All" ? "All" : opt.toLowerCase().replace(" ", "-");
          const isActive = active === "All" ? opt === "All" : active === value;
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt === "All" ? "All" : value)}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-500"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function JobFilters({ filters, onChange }: JobFiltersProps) {
  return (
    <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-4 space-y-3">
      <FilterRow
        label="Type"
        options={TYPES}
        active={filters.type}
        onSelect={(v) => onChange("type", v)}
      />
      <FilterRow
        label="Mode"
        options={WORK_MODES}
        active={filters.workMode}
        onSelect={(v) => onChange("workMode", v)}
      />
      <FilterRow
        label="Category"
        options={CATEGORIES}
        active={filters.category}
        onSelect={(v) => onChange("category", v)}
      />
    </div>
  );
}
