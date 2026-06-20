'use client';

import Link from 'next/link';
import { SentinelIcon } from '@/components/navigation/AppNavIcon';
import { usePathname } from 'next/navigation';
import {
  appendSentinelFromParam,
  labelForSentinelPath,
  rememberSentinelBack,
} from '@/lib/sentinelBrowseBack';

type PostSentinelLinkProps = {
  className?: string;
};

/** Shield shortcut on feed cards → Sentinel AI threat scanning. */
export function PostSentinelLink({ className = '' }: PostSentinelLinkProps) {
  const pathname = usePathname();
  const href = appendSentinelFromParam('/safety/sentinel', pathname);

  return (
    <Link
      href={href}
      onClick={(e) => {
        e.stopPropagation();
        rememberSentinelBack(pathname, labelForSentinelPath(pathname));
      }}
      className={`post-sentinel-link post-card-header__icon-btn ${className}`}
      aria-label="Sentinel AI"
      title="Sentinel AI"
    >
      <SentinelIcon className="post-sentinel-link__icon w-5 h-5" aria-hidden />
    </Link>
  );
}
