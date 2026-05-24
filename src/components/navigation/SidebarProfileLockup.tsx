'use client';

import Link from 'next/link';
import { ProfileIdentityLockup } from '@/components/profile/ProfileIdentityLockup';

type SidebarProfileLockupProps = {
  avatarUrl?: string | null;
  username?: string | null;
  profileHref: string;
  onNavigate?: () => void;
};

/**
 * Landing `/` stacked lockup — brand map pin (user photo) + @username wordmark.
 * Replaces the old ambient map hero card in the sidebar.
 */
export function SidebarProfileLockup({
  avatarUrl,
  username,
  profileHref,
  onNavigate,
}: SidebarProfileLockupProps) {
  const handle = username?.trim().toLowerCase() || 'neybor';

  return (
    <Link
      href={profileHref}
      onClick={onNavigate}
      className="sidebar-profile-lockup group flex w-full flex-col items-center no-underline outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-2xl"
      aria-label={`View @${handle} profile`}
    >
      <div className="landing-page-header-brand relative flex w-full flex-col items-center">
        <div className="transition-transform duration-200 group-hover:scale-[1.02] group-active:scale-[0.98]">
          <ProfileIdentityLockup avatarUrl={avatarUrl} username={handle} size="hero" />
        </div>
      </div>
    </Link>
  );
}
