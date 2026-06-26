'use client';

type PostCardMenuIconProps = {
  className?: string;
};

/** Modern 2-stroke hamburger icon for post cards */
export function PostCardMenuIcon({ className = 'h-[18px] w-[18px]' }: PostCardMenuIconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={1.5} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className} 
      aria-hidden
    >
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="11" y1="15" x2="21" y2="15" />
    </svg>
  );
}
