'use client';

type BrowseEmptyStateProps = {
  icon: string;
  title: string;
  description?: string;
  filledIcon?: boolean;
};

export function BrowseEmptyState({ icon, title, description, filledIcon }: BrowseEmptyStateProps) {
  return (
    <div className="mod-card flex flex-col items-center gap-3 rounded-2xl px-6 py-14 text-center">
      <div className="mod-inset flex h-16 w-16 items-center justify-center rounded-full">
        <span
          className={`material-symbols-outlined text-[36px] text-primary${filledIcon ? ' fill-1' : ''}`}
        >
          {icon}
        </span>
      </div>
      <p className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>
        {title}
      </p>
      {description ? (
        <p className="max-w-xs text-sm leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
