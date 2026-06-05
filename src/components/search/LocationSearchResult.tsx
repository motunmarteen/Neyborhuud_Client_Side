/**
 * Location Search Result Component
 * Displays a location result in the search dropdown
 */

'use client';
import { SearchLocation } from '@/types/search';
import { useRouter } from 'next/navigation';

interface Props {
  location: SearchLocation;
  onClose: () => void;
}

export const LocationSearchResult = ({ location, onClose }: Props) => {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to explore page with location filter
    const locationQuery = `${location.city},${location.state}`;
    router.push(`/feed?location=${encodeURIComponent(locationQuery)}`);
    onClose();
  };

  // Safety check
  if (!location || !location.city || !location.state) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-brand-surface dark:hover:bg-surface-base-dark rounded-lg transition-colors text-left"
    >
      {/* Location Icon */}
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-primary text-xl"  aria-hidden="true">location_on</span>
      </div>

      {/* Location Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--neu-text-muted)] dark:text-white">
          {location.city}, {location.state}
        </p>
        {location.lga && (
          <p className="text-sm text-[var(--neu-text-muted)] dark:text-text-secondary-dark">{location.lga}</p>
        )}
      </div>

      {/* User Count */}
      {typeof location?.userCount === 'number' && (
        <div className="flex items-center gap-1 text-sm text-[var(--neu-text-muted)] dark:text-text-secondary-dark shrink-0">
          <span className="material-symbols-outlined"  aria-hidden="true">group</span>
          {location.userCount.toLocaleString()}
        </div>
      )}
    </button>
  );
};
