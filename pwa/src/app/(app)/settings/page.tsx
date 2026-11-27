'use client';

/**
 * Settings (rebuilt 2026-11-26): one list grouped like a phone's own Settings. Each row opens its
 * own page; nothing important is hidden behind tabs. Your card at the top opens your profile.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  Bell,
  BookOpen,
  ChevronRight,
  CreditCard,
  FileText,
  Globe,
  KeyRound,
  LogOut,
  MapPin,
  Map,
  PenSquare,
  Shield,
  ShieldCheck,
  Siren,
  UserCog,
  UserX,
  Users,
} from 'lucide-react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { RowAvatar } from '@/components/friendship/PeopleRows';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { authService } from '@/services/auth.service';
import { isAdminUser } from '@/lib/adminAccess';
import { resolveUserAvatarUrl } from '@/lib/userAvatar';

type Row = { href: string; label: string; hint?: string; icon: ReactNode; tone?: string };

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: 'Account',
    rows: [
      { href: '/settings/profile', label: 'Edit profile', hint: 'Photo, name, bio, birthday', icon: <PenSquare size={19} /> },
      { href: '/settings/account', label: 'Username and invites', hint: 'Your handle, invite link, your data', icon: <UserCog size={19} /> },
      { href: '/settings/password', label: 'Password', icon: <KeyRound size={19} /> },
      { href: '/settings/payout', label: 'Payment details', hint: 'Where buyers pay you', icon: <CreditCard size={19} /> },
    ],
  },
  {
    title: 'Your area',
    rows: [
      { href: '/settings/location', label: 'Your area and distance', hint: 'How far around you to see posts', icon: <MapPin size={19} /> },
      { href: '/settings/places', label: 'My places', hint: 'Home and the spots you go often', icon: <Map size={19} /> },
      { href: '/safety/security-desks', label: 'Estate security', hint: 'Who near you gets SOS texts', icon: <ShieldCheck size={19} /> },
    ],
  },
  {
    title: 'Notifications and privacy',
    rows: [
      { href: '/settings/notifications', label: 'Notifications', hint: 'What alerts you, and how', icon: <Bell size={19} /> },
      { href: '/settings/privacy', label: 'Privacy', hint: 'Who sees your profile, area, phone, email', icon: <Shield size={19} /> },
      { href: '/settings/blocked', label: 'Blocked people', icon: <UserX size={19} /> },
      { href: '/safety/sentinel/settings', label: 'Sentinel alerts', hint: 'Which danger warnings reach you', icon: <Siren size={19} /> },
    ],
  },
  {
    title: 'App',
    rows: [
      { href: '/settings/display', label: 'Language and display', hint: 'Language, text size, save data', icon: <Globe size={19} /> },
      { href: '/settings/posts', label: 'Post defaults', hint: 'How new posts start', icon: <FileText size={19} /> },
    ],
  },
  {
    title: 'Help',
    rows: [
      { href: '/safety/how-it-works', label: 'How Sentinel keeps you safe', icon: <ShieldCheck size={19} /> },
      { href: '/info/community-rules', label: 'Community rules', icon: <Users size={19} /> },
      { href: '/info/privacy-policy', label: 'Privacy policy', icon: <BookOpen size={19} /> },
      { href: '/info/terms-of-service', label: 'Terms of service', icon: <BookOpen size={19} /> },
    ],
  },
];

const CARD = 'overflow-hidden rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]';

function SettingsRow({ row }: { row: Row }) {
  return (
    <li className="border-b border-line/60 last:border-0">
      <Link href={row.href} prefetch={false} className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-background">
        <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-soft text-brand-green-dark">
          {row.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-navy">{row.label}</span>
          {row.hint ? <span className="block truncate text-[13px] text-muted">{row.hint}</span> : null}
        </span>
        <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
      </Link>
    </li>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, mounted } = useClientAuthUser();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || (user?.username ? `@${user.username}` : '');
  const avatar = user ? resolveUserAvatarUrl({ profilePicture: (user as { profilePicture?: string }).profilePicture, avatarUrl: user.avatarUrl }) : null;
  const groups = isAdminUser(user)
    ? [...GROUPS, { title: 'Admin', rows: [{ href: '/admin', label: 'Admin panel', icon: <Shield size={19} /> }] }]
    : GROUPS;

  const signOut = async () => {
    try {
      await authService.logout();
    } finally {
      router.replace('/login');
    }
  };

  return (
    <AppBrowseLayout>
      {mounted && user ? (
        <Link href={`/profile/${user.username}`} prefetch={false} className={`${CARD} flex items-center gap-3 p-4 transition-colors hover:bg-[#F6F8FB]`}>
          <RowAvatar src={avatar} name={name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-heading text-lg font-extrabold text-navy">{name}</span>
            <span className="block truncate text-[13px] text-muted">@{user.username} · View your profile</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
        </Link>
      ) : (
        <div className={`${CARD} h-[76px] animate-pulse motion-reduce:animate-none`} aria-hidden />
      )}

      {groups.map((g) => (
        <section key={g.title} aria-label={g.title}>
          <h2 className="mb-2 mt-2 px-1 font-heading text-base font-extrabold text-navy">{g.title}</h2>
          <ul className={CARD}>
            {g.rows.map((row) => (
              <SettingsRow key={row.href} row={row} />
            ))}
          </ul>
        </section>
      ))}

      <button
        type="button"
        onClick={() => void signOut()}
        className={`${CARD} mt-2 flex min-h-14 w-full items-center justify-center gap-2 text-[15px] font-bold text-brand-red hover:bg-red-soft`}
      >
        <LogOut size={18} aria-hidden /> Sign out
      </button>
    </AppBrowseLayout>
  );
}
