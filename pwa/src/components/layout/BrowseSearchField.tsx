'use client';

type BrowseSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function BrowseSearchField({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}: BrowseSearchFieldProps) {
  return (
    <div className={`relative ${className}`.trim()}>
      <span
        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none"
        style={{ color: 'var(--neu-text-muted)' }}
      >
        search
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border-0 py-2.5 pl-9 pr-3 text-sm mod-inset outline-none transition-all focus:ring-2 focus:ring-primary/25"
        style={{ color: 'var(--neu-text)' }}
      />
    </div>
  );
}
