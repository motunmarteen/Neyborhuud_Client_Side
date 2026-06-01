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
  'inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary no-underline hover:underline';

export function SentinelBackLink({ className, fallback }: SentinelBackLinkProps) {
  const searchParams = useSearchParams();
  const [back, setBack] = useState<SentinelBackTarget>(() => fallback ?? getSentinelBack());

  useEffect(() => {
    applySentinelBackFromQuery(window.location.search);
    captureSentinelReferrerIfNeeded();
    setBack(fallback ?? getSentinelBack());
  }, [searchParams, fallback]);

  return (
    <Link href={back.href} className={className ?? linkClass}>
      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
      {back.label}
    </Link>
  );
}
