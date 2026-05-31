'use client';

import { useMemo, useState } from 'react';

export interface CommunityGroup {
  id: string;
  name: string;
  category: string;
  description: string;
  membersCount: number;
  activityLevel: 'High' | 'Moderate' | 'Low';
  icon: string;
  joined: boolean;
}

export const MOCK_COMMUNITIES: CommunityGroup[] = [
  {
    id: 'comm-1',
    name: 'Ikotun Vigilante Network',
    category: 'Security & Safety',
    description: 'Hyperlocal security updates, night patrol synchronization, and incident reports for Ikotun.',
    membersCount: 142,
    activityLevel: 'High',
    icon: 'shield_lock',
    joined: true,
  },
  {
    id: 'comm-2',
    name: 'Lagos Landlords Association',
    category: 'Residents Group',
    description: 'Resident meetings, waste management coordination, and community improvement discussions.',
    membersCount: 88,
    activityLevel: 'Moderate',
    icon: 'home_work',
    joined: false,
  },
  {
    id: 'comm-3',
    name: 'Agege Trade & Market Syndicate',
    category: 'Local Trade',
    description: 'Market rates, local logistics coordination, and merchant trade discussions in Agege.',
    membersCount: 312,
    activityLevel: 'High',
    icon: 'storefront',
    joined: false,
  },
  {
    id: 'comm-4',
    name: 'Local LGA Sports Club',
    category: 'Sports & Leisure',
    description: 'Weekend football matches, local run clubs, and fitness challenges for youth.',
    membersCount: 55,
    activityLevel: 'Low',
    icon: 'sports_soccer',
    joined: false,
  },
  {
    id: 'comm-5',
    name: 'NeyborHuud Helping Hand',
    category: 'Volunteer',
    description: 'Disaster response assistance, food drives, and emergency local relief coordination.',
    membersCount: 204,
    activityLevel: 'High',
    icon: 'handshake',
    joined: true,
  },
];

const INITIAL_JOINED: Record<string, boolean> = {
  'comm-1': true,
  'comm-5': true,
};

function filterCommunities(list: CommunityGroup[], search: string) {
  if (!search.trim()) return list;
  const q = search.toLowerCase();
  return list.filter(
    (c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
  );
}

type CommunitiesBrowserProps = {
  search?: string;
  showSectionLabel?: boolean;
  className?: string;
};

export function CommunitiesBrowser({
  search = '',
  showSectionLabel = true,
  className = '',
}: CommunitiesBrowserProps) {
  const [joinedCommunities, setJoinedCommunities] = useState(INITIAL_JOINED);

  const communities = useMemo(
    () => filterCommunities(MOCK_COMMUNITIES, search),
    [search],
  );

  if (communities.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`.trim()}>
        <div className="mod-inset flex h-16 w-16 items-center justify-center rounded-full mb-4">
          <span className="material-symbols-outlined text-[32px] text-primary fill-1">groups</span>
        </div>
        <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--neu-text)' }}>
          No communities found
        </h3>
        <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--neu-text-muted)' }}>
          Try a different search term or browse all hyperlocal hubs below.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`.trim()}>
      {showSectionLabel && (
        <p
          className="text-xs font-bold uppercase tracking-widest px-1"
          style={{ color: 'var(--neu-text-muted)' }}
        >
          Hyperlocal Hubs
        </p>
      )}
      <div className="flex flex-col gap-3">
        {communities.map((c) => {
          const joined = joinedCommunities[c.id] ?? c.joined;
          return (
            <div key={c.id} className="mod-card flex flex-col gap-3 rounded-2xl p-4 transition-all hover:ring-1 hover:ring-primary/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary">
                    <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm" style={{ color: 'var(--neu-text)' }}>
                      {c.name}
                    </p>
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
                      style={{ color: 'var(--neu-text-muted)' }}
                    >
                      {c.category}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setJoinedCommunities((p) => ({ ...p, [c.id]: !joined }))}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    joined ? 'mod-chip' : 'mod-chip mod-chip-active text-primary'
                  }`}
                  style={joined ? { color: 'var(--neu-text-muted)' } : undefined}
                >
                  {joined ? 'Joined' : 'Join'}
                </button>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
                {c.description}
              </p>

              <div
                className="flex items-center gap-4 border-t pt-1.5 text-[10px] font-bold"
                style={{ borderColor: 'var(--neu-shadow-dark)', color: 'var(--neu-text-muted)' }}
              >
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">group</span>
                  {c.membersCount} members
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">bolt</span>
                  Activity:{' '}
                  <span
                    className={
                      c.activityLevel === 'High'
                        ? 'text-green-600'
                        : c.activityLevel === 'Moderate'
                          ? 'text-amber-600'
                          : ''
                    }
                  >
                    {c.activityLevel}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
