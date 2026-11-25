'use client';

/** Communities: estates, streets and groups near you. One list; tap a row for details, Join or Chat on the right. */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseSearchField } from '@/components/layout/BrowseSearchField';
import { CommunityRow } from '@/components/communities/CommunityRow';
import { CreateCommunityModal } from '@/components/communities/CreateCommunityModal';
import { LIST_CLASS, RowsSkeleton } from '@/components/friendship/PeopleRows';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useHubCommunitiesList, useJoinHubCommunity } from '@/hooks/useHubCommunities';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { unwrapApiData } from '@/lib/apiPayload';
import { toast } from '@/lib/toast';
import { useTranslation } from '@/lib/i18n';
import type { HubCategory } from '@/types/hubCommunity';

/** One row of filters: everything, mine, then kinds. */
type Filter = 'all' | 'joined' | Exclude<HubCategory, 'general'>;
const FILTERS: { id: Filter; icon?: string }[] = [
  { id: 'all' },
  { id: 'joined' },
  { id: 'residents', icon: '🏘️' },
  { id: 'security', icon: '🛡️' },
  { id: 'trade', icon: '🛒' },
  { id: 'sports', icon: '⚽' },
  { id: 'volunteer', icon: '🤝' },
];

export default function CommunitiesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, mounted } = useClientAuthUser();
  const [search, setSearch] = useState('');
  const [needle, setNeedle] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // "Set up my estate" on a quiet map (?create=1) opens the create form straight away.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('create') === '1') setCreateOpen(true);
  }, []);

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => setNeedle(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useHubCommunitiesList(
    {
      search: needle || undefined,
      category: filter === 'all' || filter === 'joined' ? undefined : filter,
      joined: filter === 'joined' ? 'true' : 'all',
      limit: 50,
    },
    { enabled: mounted },
  );
  const join = useJoinHubCommunity();
  const hubs = data?.data?.hubs ?? [];

  const handleJoin = async (id: string) => {
    if (!user) {
      router.push('/login?redirect=/communities');
      return;
    }
    setJoiningId(id);
    try {
      const res = await join.mutateAsync(id);
      const payload = unwrapApiData<{ pending?: boolean; conversationId?: string; hub?: { conversationId?: string } }>(res as unknown);
      if (payload?.pending) {
        toast.success(t('comm.requestSent'));
        return;
      }
      const cid = payload?.conversationId ?? payload?.hub?.conversationId;
      if (cid) router.push(`/chat/${cid}`);
    } catch {
      toast.error(t('comm.joinFailed'));
    } finally {
      setJoiningId(null);
    }
  };

  const create = () => (user ? setCreateOpen(true) : router.push('/login?redirect=/communities'));

  return (
    <>
      <AppBrowseLayout
        header={
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <BrowseSearchField className="min-w-0 flex-1" value={search} onChange={setSearch} placeholder={t('comm.search')} />
              <Button size="md" onClick={create} leftIcon={<Plus size={18} aria-hidden />}>
                {t('comm.create')}
              </Button>
            </div>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1" role="group" aria-label={t('comm.filter')}>
              {FILTERS.map((f) => (
                <FilterChip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)} icon={f.icon}>
                  {t(`comm.f.${f.id}`)}
                </FilterChip>
              ))}
            </div>
          </div>
        }
      >
        {!mounted || isLoading ? (
          <RowsSkeleton />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} homeHref={null} />
        ) : hubs.length === 0 ? (
          needle ? (
            <EmptyState icon="🔎" title={t('comm.noMatch')} description={t('comm.noMatchBody')} />
          ) : filter === 'joined' ? (
            <EmptyState icon="🏘️" title={t('comm.noneJoined')} description={t('comm.noneJoinedBody')} action={{ label: t('comm.seeAll'), onClick: () => setFilter('all') }} />
          ) : (
            <EmptyState icon="🏘️" title={t('comm.none')} description={t('comm.noneBody')} action={{ label: t('comm.createLong'), onClick: create }} />
          )
        ) : (
          <ul className={LIST_CLASS}>
            {hubs.map((c) => (
              <CommunityRow key={c.id} community={c} onJoin={handleJoin} joinPending={joiningId === c.id} />
            ))}
          </ul>
        )}
      </AppBrowseLayout>

      <CreateCommunityModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
