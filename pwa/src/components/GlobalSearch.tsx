/**
 * Global Search Component
 * Clickable search bar that navigates to the full Explore page
 */

'use client';

import { useRouter } from 'next/navigation';

export const GlobalSearch = () => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/explore')}
      className="w-full flex items-center gap-2 pl-10 pr-4 py-2.5 rounded-full neu-inset text-sm cursor-pointer transition-all hover:opacity-90 relative"
      aria-label="Search NeyborHuud"
    >
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: 'var(--neu-text-muted)' }}>search</span>
      <span className="opacity-60 text-sm" style={{ color: 'var(--neu-text-muted)' }}>Search</span>
    </button>
  );
};
