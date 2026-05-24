'use client';

import Link from 'next/link';
import { ProfileAuthSectionTitle } from '@/components/profile/ProfileAuthShell';

type HubItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  href?: string;
  onClick?: () => void;
};

type ProfileSnapHubProps = {
  isOwnProfile: boolean;
  onCreatePost?: () => void;
  onSetLocation?: () => void;
  showPinPrompt?: boolean;
};

function HubCard({ item }: { item: HubItem }) {
  const content = (
    <>
      <span className="auth-flow-hero-card__icon" aria-hidden>
        <span className="material-symbols-outlined text-[1.25rem]">{item.icon}</span>
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="auth-flow-hero-card__title !text-[0.9375rem]">{item.title}</p>
        <p className="auth-flow-hero-card__meta">{item.subtitle}</p>
      </div>
      <span className="material-symbols-outlined text-[var(--neu-text-muted)]">chevron_right</span>
    </>
  );

  if (item.onClick) {
    return (
      <button type="button" onClick={item.onClick} className="auth-flow-hero-card w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link href={item.href!} className="auth-flow-hero-card no-underline">
      {content}
    </Link>
  );
}

export function ProfileSnapHub({
  isOwnProfile,
  onCreatePost,
  onSetLocation,
  showPinPrompt = false,
}: ProfileSnapHubProps) {
  const postItems: HubItem[] = [
    {
      id: 'feed',
      title: 'Your Huud feed',
      subtitle: 'Share updates with neighbours nearby',
      icon: 'dynamic_feed',
      onClick: onCreatePost,
    },
    {
      id: 'explore',
      title: 'Street radar',
      subtitle: 'Discover trending posts & local news',
      icon: 'explore',
      href: '/explore',
    },
    {
      id: 'fyi',
      title: 'FYI bulletin',
      subtitle: 'Post neighbourhood announcements',
      icon: 'campaign',
      href: '/feed?type=fyi',
    },
    {
      id: 'help',
      title: 'Ask for help',
      subtitle: 'Reach neighbours who can assist',
      icon: 'volunteer_activism',
      href: '/help-request',
    },
  ];

  const platformItems: HubItem[] = [
    { id: 'marketplace', title: 'Marketplace', subtitle: 'Buy & sell locally', icon: 'storefront', href: '/marketplace' },
    { id: 'events', title: 'Events', subtitle: 'Local gatherings & meetups', icon: 'event', href: '/events' },
    { id: 'jobs', title: 'Jobs', subtitle: 'Work opportunities in your Huud', icon: 'work', href: '/jobs' },
    { id: 'services', title: 'Services', subtitle: 'Book trusted neighbours', icon: 'handyman', href: '/services' },
    { id: 'safety', title: 'Sentinel & SOS', subtitle: 'Safety tools for your Huud', icon: 'shield', href: '/safety/manage' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <ProfileAuthSectionTitle>Post to…</ProfileAuthSectionTitle>

      {showPinPrompt && isOwnProfile && onSetLocation ? (
        <button type="button" onClick={onSetLocation} className="auth-flow-hero-card w-full border-dashed text-left">
          <span className="auth-flow-hero-card__icon" aria-hidden>
            <span className="material-symbols-outlined text-[1.25rem]">add_location_alt</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="auth-flow-hero-card__title !text-[0.9375rem]">Pin your Huud on the map</p>
            <p className="auth-flow-hero-card__meta">
              Set location so neighbours can find you — your map becomes your profile header
            </p>
          </div>
        </button>
      ) : null}

      <div className="flex flex-col gap-2">
        {postItems.map((item) => (
          <HubCard key={item.id} item={item} />
        ))}
      </div>

      <ProfileAuthSectionTitle>Your Huud</ProfileAuthSectionTitle>
      <div className="flex flex-col gap-2">
        {platformItems.map((item) => (
          <Link key={item.id} href={item.href!} className="auth-signup-location-peek no-underline">
            <span className="auth-signup-location-peek__icon" aria-hidden>
              <span className="material-symbols-outlined text-[1rem]">{item.icon}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="auth-signup-location-peek__label">{item.title}</p>
              <p className="auth-signup-location-peek__name truncate">{item.subtitle}</p>
            </div>
            <span className="auth-signup-location-peek__chevron" aria-hidden>›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
