"use client";

export interface EventsFilterState {
  type: string;
  date: string;
}

const TYPE_OPTIONS = [
  "All",
  "Community",
  "Social",
  "Sports",
  "Cultural",
  "Educational",
  "Business",
  "Other",
];

const DATE_OPTIONS = ["All", "Today", "This Week", "This Month"];

interface Props {
  filters: EventsFilterState;
  onChange: (key: keyof EventsFilterState, value: string) => void;
}

export default function EventFilters({ filters, onChange }: Props) {
  return (
    <div className="space-y-3">
      {/* Type row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TYPE_OPTIONS.map((opt) => {
          const val = opt === "All" ? "All" : opt.toLowerCase();
          const active = filters.type === val;
          return (
            <button
              key={opt}
              onClick={() => onChange("type", val)}
              className={`shrink-0 text-sm px-4 py-1.5 rounded-full transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Date row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DATE_OPTIONS.map((opt) => {
          const val = opt === "All" ? "All" : opt.toLowerCase().replace(/ /g, "-");
          const active = filters.date === val;
          return (
            <button
              key={opt}
              onClick={() => onChange("date", val)}
              className={`shrink-0 text-sm px-4 py-1.5 rounded-full transition-colors ${
                active
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
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
