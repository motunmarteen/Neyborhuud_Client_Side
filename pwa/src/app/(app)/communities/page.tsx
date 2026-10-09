'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Zap, ShieldCheck, Plus, LogIn, Search } from 'lucide-react';
import { toast } from '@/lib/toast';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { BrowseFilterChip } from '@/components/layout/BrowseFilterChip';
import { BrowseSearchField } from '@/components/layout/BrowseSearchField';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { CommunityRow } from '@/components/communities/CommunityRow';
import { CreateCommunityModal } from '@/components/communities/CreateCommunityModal';
import { useHubCommunitiesList, useJoinHubCommunity } from '@/hooks/useHubCommunities';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { unwrapApiData } from '@/lib/apiPayload';
import type { HubCategory } from '@/types/hubCommunity';

export const dynamic = 'force-dynamic';

type ViewTab = 'all' | 'joined' | 'discover';

type CategoryFilter = 'all' | HubCategory;

const VIEW_TABS = [
  { id: 'all', label: 'All', icon: 'groups' },
  { id: 'joined', label: 'Joined', icon: 'group' },
  { id: 'discover', label: 'Discover', icon: 'explore' },
] as const;

const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'security', label: 'Security' },
  { id: 'residents', label: 'Residents' },
  { id: 'trade', label: 'Trade' },
  { id: 'sports', label: 'Sports' },
  { id: 'volunteer', label: 'Volunteer' },
];

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'primary',
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  tone?: 'primary' | 'blue' | 'green';
}) {
  const toneClass =
    tone === 'blue'
      ? 'text-blue-600 bg-blue-50 border-blue-200'
      : tone === 'green'
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : 'text-[#00C830] bg-emerald-50 border-emerald-200';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-2xs">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${toneClass}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-extrabold tabular-nums text-slate-900">
          {value}
        </p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function CommunitiesPage() {
  const router = useRouter();
  const { user, mounted } = useClientAuthUser();
  const [search, setSearch] = useState('');
  const [viewTab, setViewTab] = useState<ViewTab>('all');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingJoinId, setPendingJoinId] = useState<string | null>(null);

  const joinedFilter =
    viewTab === 'joined' ? 'true' : viewTab === 'discover' ? 'false' : 'all';

  const { data, isLoading, isError, refetch } = useHubCommunitiesList(
    {
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      joined: joinedFilter as 'true' | 'false' | 'all',
      limit: 50,
    },
    { enabled: mounted },
  );

  const joinMutation = useJoinHubCommunity();

  const hubs = data?.data?.hubs ?? [];

  const joinedCount = useMemo(() => hubs.filter((h) => h.joined).length, [hubs]);
  const highActivityCount = useMemo(
    () => hubs.filter((h) => h.activityLevel === 'High').length,
    [hubs],
  );

  const handleJoin = async (id: string) => {
    if (!user) {
      router.push('/login?redirect=/communities');
      return;
    }
    const hub = hubs.find((h) => h.id === id);
    if (!hub || hub.joined) return;

    setPendingJoinId(id);
    try {
      const res = await joinMutation.mutateAsync(id);
      const payload = unwrapApiData<{
        pending?: boolean;
        conversationId?: string;
        hub?: { conversationId?: string };
      }>(res as unknown);
      if (payload?.pending) {
        toast.success('Join request submitted — an admin will review it');
        return;
      }
      const conversationId = payload?.conversationId ?? payload?.hub?.conversationId;
      if (conversationId) {
        router.push(`/chat/${conversationId}`);
      }
    } finally {
      setPendingJoinId(null);
    }
  };

  return (
    <>
      <AppBrowseLayout
        maxWidth="680"
        header={
          <>
            <BrowseTabStrip
              tabs={[...VIEW_TABS]}
              activeId={viewTab}
              onChange={(id) => setViewTab(id as ViewTab)}
              trailing={
                mounted && user ? (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="mod-fab flex h-9 w-9 items-center justify-center rounded-full border-0"
                    aria-label="Create community"
                  >
                    <span className="material-symbols-outlined text-[20px] text-white">add</span>
                  </button>
                ) : null
              }
            />

            <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
              {CATEGORY_FILTERS.filter((f) => f.id !== 'all').map((item) => (
                <BrowseFilterChip
                  key={item.id}
                  active={category === item.id}
                  onClick={() => setCategory(category === item.id ? 'all' : item.id)}
                >
                  {item.label}
                </BrowseFilterChip>
              ))}
            </div>

            <BrowseSearchField
              value={search}
              onChange={setSearch}
              placeholder="Search communities…"
            />
          </>
        }
      >
        <div className="space-y-5">
          {!mounted ? (
            <div className="mod-inset h-12 w-full animate-pulse rounded-xl" aria-hidden />
          ) : user ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mod-chip mod-chip-active inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create a community
            </button>
          ) : (
            <Link
              href="/login?redirect=/communities"
              className="mod-card flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold no-underline"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">login</span>
              Sign in to create or join communities
            </Link>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard icon={Users} label="Showing" value={hubs.length} />
            <StatCard icon={ShieldCheck} label="Joined here" value={joinedCount} tone="blue" />
            <StatCard icon={Zap} label="High activity" value={highActivityCount} tone="green" />
          </div>

          {isLoading ? (
            <div className="mod-card space-y-2 rounded-2xl p-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="mod-inset h-16 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <BrowseEmptyState
              icon="wifi_off"
              title="Could not load communities"
              description="Check your connection and try again."
              action={
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mod-chip mod-chip-active rounded-full px-4 py-2 text-sm font-bold text-primary"
                >
                  Retry
                </button>
              }
            />
          ) : hubs.length === 0 ? (
            <BrowseEmptyState
              icon="groups"
              title="No communities found"
              description={
                viewTab === 'joined'
                  ? 'Join or create a community to see it here.'
                  : 'Try a different search or create the first one for your Huud.'
              }
              filledIcon
              action={
                !mounted ? null : user ? (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="mod-chip mod-chip-active rounded-full px-4 py-2 text-sm font-bold text-primary"
                  >
                    Create community
                  </button>
                ) : (
                  <Link
                    href="/login?redirect=/communities"
                    className="mod-chip mod-chip-active rounded-full px-4 py-2 text-sm font-bold text-primary no-underline"
                  >
                    Sign in
                  </Link>
                )
              }
            />
          ) : (
            <div>
              <h2 className="mb-3 text-base font-bold" style={{ color: 'var(--neu-text)' }}>
                Hyperlocal hubs
              </h2>
              <div
                className="mod-card divide-y overflow-hidden rounded-2xl"
                style={{ borderColor: 'var(--neu-shadow-dark)' }}
              >
                {hubs.map((community) => (
                  <CommunityRow
                    key={community.id}
                    community={community}
                    joined={community.joined}
                    onJoin={handleJoin}
                    joinPending={pendingJoinId === community.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </AppBrowseLayout>

      <CreateCommunityModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
