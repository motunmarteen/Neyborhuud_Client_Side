'use client';

import { MoreHorizontal } from 'lucide-react';

type PostCardMenuIconProps = {
  className?: string;
};

/** Lightweight horizontal ellipsis trigger for post cards */
export function PostCardMenuIcon({ className = 'h-[18px] w-[18px]' }: PostCardMenuIconProps) {
  return (
    <MoreHorizontal className={className} strokeWidth={1.5} aria-hidden />
  );
}
