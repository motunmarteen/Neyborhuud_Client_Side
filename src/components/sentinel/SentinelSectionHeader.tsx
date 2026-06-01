import type { ReactNode } from 'react';

type SentinelSectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function SentinelSectionHeader({ title, subtitle, action }: SentinelSectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
