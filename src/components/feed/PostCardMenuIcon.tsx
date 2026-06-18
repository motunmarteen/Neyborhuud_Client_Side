'use client';

type PostCardMenuIconProps = {
  className?: string;
};

/** Two-bar menu trigger — replaces generic ⋯ ellipsis on post cards */
export function PostCardMenuIcon({ className = 'h-[18px] w-[18px]' }: PostCardMenuIconProps) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <rect x="2" y="5" width="12" height="2.25" rx="1.125" />
      <rect x="2" y="10.75" width="8" height="2.25" rx="1.125" />
    </svg>
  );
}
