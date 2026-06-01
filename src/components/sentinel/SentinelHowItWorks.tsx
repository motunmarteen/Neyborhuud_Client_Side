import type { ReactNode } from 'react';

type SentinelHowItWorksProps = {
  title?: string;
  children: ReactNode;
};

/** Callout card — explains a feature in plain language (Huud Score section style). */
export function SentinelHowItWorks({ title = 'How it works', children }: SentinelHowItWorksProps) {
  return (
    <div className="mod-card rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">{title}</p>
      <div className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--neu-text)' }}>
        {children}
      </div>
    </div>
  );
}
