'use client';

import React, { useState } from 'react';
import { CommunitiesBrowser } from '@/components/communities/CommunitiesBrowser';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseSearchField } from '@/components/layout/BrowseSearchField';

export const dynamic = 'force-dynamic';

export default function CommunitiesPage() {
  const [search, setSearch] = useState('');

  return (
    <AppBrowseLayout
      maxWidth="920"
      subtitle="Discover and join hyperlocal hubs in your Huud"
      header={<BrowseSearchField value={search} onChange={setSearch} placeholder="Search communities…" />}
    >
      <CommunitiesBrowser search={search} />
    </AppBrowseLayout>
  );
}
