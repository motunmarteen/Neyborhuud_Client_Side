'use client';

import Link from 'next/link';
import { ProfileBrowseEyebrow } from '@/components/profile/browse/ProfileBrowseSectionTitle';

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

function HubRow({ item }: { item: HubItem }) {
  const content = (
    <>
      <div className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary">
        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
          {item.title}
        </p>
        <p className="text-xs text-[var(--neu-text-muted)]">{item.subtitle}</p>
      </div>
      <span className="material-symbols-outlined shrink-0 text-[var(--neu-text-muted)]">chevron_right</span>
    </>
  );

  if (item.onClick) {
    return (
      <button
        type="button"
        onClick={item.onClick}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-black/[0.02]"
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={item.href!} className="flex items-center gap-3 px-3 py-2.5 no-underline transition-colors hover:bg-black/[0.02]">
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
  if (!isOwnProfile) return null;

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
      href: '/neighborhood?tab=street-radar',
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
    <div className="space-y-4">
      <div className="mod-card overflow-hidden rounded-2xl">
        <div className="border-b px-4 py-3" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
          <ProfileBrowseEyebrow>Post to…</ProfileBrowseEyebrow>
        </div>
        {showPinPrompt && onSetLocation ? (
          <button
            type="button"
            onClick={onSetLocation}
            className="flex w-full items-center gap-3 border-b px-3 py-3 text-left"
            style={{ borderColor: 'var(--neu-shadow-dark)' }}
          >
            <div className="mod-inset flex h-10 w-10 items-center justify-center rounded-xl text-primary">
              <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
                Pin your Huud on the map
              </p>
              <p className="text-xs text-[var(--neu-text-muted)]">
                Set location so neighbours can find you
              </p>
            </div>
          </button>
        ) : null}
        <div className="divide-y" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
          {postItems.map((item) => (
            <HubRow key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="mod-card overflow-hidden rounded-2xl">
        <div className="border-b px-4 py-3" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
          <ProfileBrowseEyebrow>Your Huud</ProfileBrowseEyebrow>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
          {platformItems.map((item) => (
            <HubRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
