'use client';

/** Chats (bottom bar): people and group conversations in one list, newest first. */

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { UserPlus, Users } from 'lucide-react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseSearchField } from '@/components/layout/BrowseSearchField';
import { ChatsStream } from '@/components/friendship/ChatsStream';
import { useTranslation } from '@/lib/i18n';

const SHORTCUT =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-3 text-sm font-bold text-navy shadow-[0_2px_8px_rgba(29,36,51,0.08)] transition-colors hover:bg-[#F6F8FB]';

function Inbox() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  return (
    <AppBrowseLayout
      header={
        <div className="flex flex-col gap-3">
          <BrowseSearchField value={search} onChange={setSearch} placeholder={t('chats.search')} />
          <div className="flex gap-2">
            <Link href="/friendship" className={SHORTCUT}>
              <UserPlus size={17} className="text-brand-green-dark" aria-hidden />
              {t('chats.findNeighbours')}
            </Link>
            <Link href="/communities" className={SHORTCUT}>
              <Users size={17} className="text-brand-green-dark" aria-hidden />
              {t('chats.communities')}
            </Link>
          </div>
        </div>
      }
    >
      <ChatsStream search={search} />
    </AppBrowseLayout>
  );
}

export default function ChatInboxPage() {
  return (
    <Suspense>
      <Inbox />
    </Suspense>
  );
}
