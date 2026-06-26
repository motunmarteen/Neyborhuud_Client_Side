'use client';

import Link from 'next/link';
import { ProfileBrowseEyebrow } from '@/components/profile/browse/ProfileBrowseSectionTitle';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

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
  showPinPrompt?: boolean;
};

function HubRow({ item }: { item: HubItem }) {
  const content = (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-700 transition-colors group-hover:bg-slate-100">
        <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-extrabold text-gray-800 transition-colors group-hover:text-gray-900">
          {item.title}
        </p>
        <p className="text-xs font-semibold text-gray-400 mt-0.5">{item.subtitle}</p>
      </div>
      <span className="material-symbols-outlined shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5">
        chevron_right
      </span>
    </>
  );

  if (item.onClick) {
    return (
      <button
        type="button"
        onClick={item.onClick}
        className="flex w-full items-center gap-3.5 px-3 py-3 text-left rounded-2xl hover:bg-slate-50/50 transition-all duration-200 group"
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={item.href!} className="flex w-full items-center gap-3.5 px-3 py-3 no-underline rounded-2xl hover:bg-slate-50/50 transition-all duration-200 group">
      {content}
    </Link>
  );
}

export function ProfileSnapHub({
  isOwnProfile,
  onCreatePost,
  showPinPrompt = false,
}: ProfileSnapHubProps) {
  const { logout } = useAuth();
  const router = useRouter();

  if (!isOwnProfile) return null;

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('neyborhuud_token');
      localStorage.removeItem('neyborhuud_user');
      router.push('/login');
    }
  };

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

  const accountItems: HubItem[] = [
    { id: 'my-huud', title: 'My Huud', subtitle: 'View your local neighbourhood map', icon: 'location_on', href: '/neighborhood' },
    { id: 'saved', title: 'Saved', subtitle: 'Access your bookmarked posts', icon: 'bookmark', href: '/saved' },
    { id: 'economy', title: 'Huud Economy', subtitle: 'Manage your wallet and coins', icon: 'account_balance', href: '/huud-economy' },
    { id: 'settings', title: 'Settings & Privacy', subtitle: 'Manage your profile and preferences', icon: 'settings', href: '/settings' },
    { id: 'logout', title: 'Fans Out', subtitle: 'Sign out of your account', icon: 'logout', onClick: handleLogout },
  ];

  return (
    <div className="w-full">
      <div className="border-t-8 border-gray-50/80 py-4">
        <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px]">
          <div className="px-3 pb-2.5">
            <ProfileBrowseEyebrow>Post to…</ProfileBrowseEyebrow>
          </div>
          {showPinPrompt ? (
            <Link
              href="/settings/location"
              className="flex w-full items-center gap-3.5 border border-dashed border-gray-200 rounded-2xl px-4 py-4 mb-3 text-left no-underline bg-gray-50/30 hover:bg-gray-50 transition-all"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm">
                <span className="material-symbols-outlined text-[22px]">add_location_alt</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-gray-800">
                  Pin your Huud on the map
                </p>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">
                  Set location so neighbours can find you
                </p>
              </div>
            </Link>
          ) : null}
          <div className="space-y-1">
            {postItems.map((item) => (
              <HubRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t-8 border-gray-50/80 py-4">
        <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px]">
          <div className="px-3 pb-2.5">
            <ProfileBrowseEyebrow>Your Huud</ProfileBrowseEyebrow>
          </div>
          <div className="space-y-1">
            {platformItems.map((item) => (
              <HubRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t-8 border-gray-50/80 py-4">
        <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px]">
          <div className="px-3 pb-2.5">
            <ProfileBrowseEyebrow>Account &amp; Settings</ProfileBrowseEyebrow>
          </div>
          <div className="space-y-1">
            {accountItems.map((item) => (
              <HubRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
