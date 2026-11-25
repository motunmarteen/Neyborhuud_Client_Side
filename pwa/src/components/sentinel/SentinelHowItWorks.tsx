import type { ReactNode } from 'react';
import Link from 'next/link';

type SentinelHowItWorksProps = {
  title?: string;
  children: ReactNode;
  /** Section of the full guide (/safety/how-it-works#…) for this screen. */
  guide?: string;
};

/** The full guide to every safety tool, optionally opened at one section. */
export function SafetyGuideLink({ section, className = '' }: { section?: string; className?: string }) {
  return (
    <Link
      href={`/safety/how-it-works${section ? `#${section}` : ''}`}
      className={`mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-green-dark hover:underline ${className}`}
    >
      Read the full guide
      <span aria-hidden className="material-symbols-outlined text-[18px]">arrow_forward</span>
    </Link>
  );
}

/** Callout card — explains a feature in plain language (Huud Score section style). */
export function SentinelHowItWorks({ title = 'How it works', children, guide }: SentinelHowItWorksProps) {
  return (
    <div className="rounded-[22px] bg-green-soft p-4">
      <p className="font-heading text-base font-extrabold text-brand-green-dark">{title}</p>
      <div className="mt-1.5 text-sm leading-relaxed text-navy">
        {children}
      </div>
      <SafetyGuideLink section={guide} />
    </div>
  );
}
