'use client';

type BrowseSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Screen-reader name; defaults to the placeholder. */
  label?: string;
  className?: string;
};

/** Search box for list pages (Phase 4 restyle): a white pill like the Feed's composer. */
export function BrowseSearchField({ value, onChange, placeholder = 'Search…', label, className = '' }: BrowseSearchFieldProps) {
  return (
    <div className={`relative ${className}`.trim()}>
      <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-muted" aria-hidden>
        search
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="h-11 w-full rounded-full border-0 bg-white pl-10 pr-4 text-sm font-semibold text-navy shadow-[0_2px_8px_rgba(29,36,51,0.08)] outline-none placeholder:font-semibold placeholder:text-muted focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
