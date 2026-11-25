'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  applySentinelBackFromQuery,
  captureSentinelReferrerIfNeeded,
  getSentinelBack,
  type SentinelBackTarget,
} from '@/lib/sentinelBrowseBack';

type SentinelBackLinkProps = {
  className?: string;
  fallback?: SentinelBackTarget;
};

const linkClass =
  'tap-target inline-flex min-h-10 w-fit items-center gap-1 rounded-full bg-white pl-2 pr-4 text-sm font-bold text-navy no-underline shadow-[0_2px_8px_rgba(29,36,51,0.08)] hover:bg-[#F6F8FB]';

const fallbackDefault: SentinelBackTarget = { href: '/sentinel', label: 'Sentinel' };

export function SentinelBackLink({ className, fallback }: SentinelBackLinkProps) {
  const searchParams = useSearchParams();
  const [back, setBack] = useState<SentinelBackTarget>(() => fallback ?? fallbackDefault);

  useEffect(() => {
    applySentinelBackFromQuery(window.location.search);
    captureSentinelReferrerIfNeeded();
    setBack(fallback ?? getSentinelBack());
  }, [searchParams, fallback]);

  return (
    <Link href={back.href} className={className ?? linkClass}>
      <span aria-hidden className="material-symbols-outlined text-[20px]">chevron_left</span>
      {back.label}
    </Link>
  );
}
