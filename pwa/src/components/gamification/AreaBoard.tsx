'use client';

/**
 * This week's ⭐ Impact leaderboards (Phase 7, G-09): my area, areas against each other, and
 * the people I follow. Impact only comes from outcomes neighbours confirm, so it can't be
 * bought or farmed with likes. Resets every Monday (Nigeria time). Also shows last week's
 * 👑 Area Champion of my area.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { AreaChampion } from '@/hooks/useAreaChampions';

type Row = { rank: number; userId: string; name: string; username?: string; avatarUrl?: string; emoji: string; levelName: string; impact: number; isMe: boolean };
type AreaRow = { rank: number; lga: string; state: string; impact: number; people: number; isMine: boolean };
type BoardData = {
  board: 'area' | 'areas' | 'friends';
  week: string;
  area: { lga: string; state: string } | null;
  rows?: Row[];
  areas?: AreaRow[];
  me?: { rank: number | null; impact: number };
  champion: AreaChampion | null;
};

const TABS = [
  { key: 'area', label: 'My area' },
  { key: 'areas', label: 'Areas' },
  { key: 'friends', label: 'Following' },
] as const;
type Tab = (typeof TABS)[number]['key'];

function useBoard(board: Tab) {
  return useQuery({
    queryKey: ['gamification', 'area-board', board],
    queryFn: async () => {
      const res = await apiClient.get<BoardData>('/gamification/area-board', { params: { board } });
      return ((res as { data?: BoardData })?.data ?? res) as BoardData;
    },
    staleTime: 60_000,
    retry: false,
  });
}

function weekWords(week: string): string {
  const d = new Date(`${week}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? 'this week' : `week of ${d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`;
}

function Medal({ rank }: { rank: number }) {
  const m = ['🥇', '🥈', '🥉'][rank - 1];
  return (
    <span className="w-7 shrink-0 text-center font-heading text-sm font-black text-muted">
      {m ? <span aria-label={`Number ${rank}`}>{m}</span> : rank}
    </span>
  );
}

export function AreaBoard() {
  const [tab, setTab] = useState<Tab>('area');
  const { data, isLoading, isError, refetch } = useBoard(tab);
  const champ = data?.champion ?? null;

  return (
    <section aria-labelledby="board-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="board-heading" className="font-heading text-lg font-extrabold text-navy">
          This week&apos;s helpers
        </h2>
        {data?.week ? <span className="text-xs font-semibold text-muted">{weekWords(data.week)}</span> : null}
      </div>

      {champ ? (
        <div className="flex items-center gap-3 rounded-[22px] bg-[#FFF6DB] p-4">
          <span aria-hidden className="text-3xl">
            👑
          </span>
          <p className="min-w-0 flex-1 text-sm text-navy">
            <span className="font-bold">{champ.isMe ? 'You are' : `${champ.name} is`} {champ.lga}&apos;s Area Champion</span> this week, with ⭐{' '}
            {champ.impact} Impact last week.{champ.isMe ? ' Your crown is on the map.' : ''}
          </p>
        </div>
      ) : null}

      <div role="tablist" aria-label="Leaderboards" className="flex gap-1 rounded-full bg-white p-1 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`min-h-10 flex-1 rounded-full text-sm font-bold transition-colors ${tab === t.key ? 'bg-navy text-white' : 'text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="overflow-hidden rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
        {isLoading ? (
          <p className="p-4 text-sm font-semibold text-muted">Loading…</p>
        ) : isError || !data ? (
          <div className="flex items-center justify-between gap-2 p-4">
            <p className="text-sm font-semibold text-muted">Could not load the board.</p>
            <button type="button" onClick={() => void refetch()} className="min-h-10 rounded-full border border-line px-4 text-sm font-bold text-navy">
              Try again
            </button>
          </div>
        ) : tab === 'areas' ? (
          (data.areas ?? []).length ? (
            <ol className="divide-y divide-line">
              {(data.areas ?? []).map((a) => (
                <li key={`${a.state}|${a.lga}`} className={`flex items-center gap-3 px-4 py-3 ${a.isMine ? 'bg-green-soft' : ''}`}>
                  <Medal rank={a.rank} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-bold text-navy">
                      {a.lga}
                      {a.isMine ? ' (your area)' : ''}
                    </span>
                    <span className="text-xs font-semibold text-muted">
                      {a.state} · {a.people} {a.people === 1 ? 'helper' : 'helpers'}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-black text-brand-green-dark">⭐ {a.impact.toLocaleString('en-NG')}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="p-4 text-sm text-navy">No area has Impact yet this week. Help a neighbour and put your area on the board.</p>
          )
        ) : tab === 'area' && !data.area ? (
          <p className="p-4 text-sm text-navy">
            Set your home area to see your area&apos;s board.{' '}
            <Link href="/settings" className="font-bold text-primary">
              Settings
            </Link>
          </p>
        ) : (data.rows ?? []).length ? (
          <>
            <ol className="divide-y divide-line">
              {(data.rows ?? []).map((r) => (
                <li key={r.userId} className={`flex items-center gap-3 px-4 py-3 ${r.isMe ? 'bg-green-soft' : ''}`}>
                  <Medal rank={r.rank} />
                  <span aria-hidden className="text-lg">
                    {r.emoji}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    {r.username && !r.isMe ? (
                      <Link href={`/profile/${encodeURIComponent(r.username)}`} className="truncate text-sm font-bold text-navy">
                        {r.name}
                      </Link>
                    ) : (
                      <span className="truncate text-sm font-bold text-navy">{r.isMe ? `${r.name} (you)` : r.name}</span>
                    )}
                    <span className="text-xs font-semibold text-muted">{r.levelName}</span>
                  </span>
                  <span className="shrink-0 text-sm font-black text-brand-green-dark">⭐ {r.impact.toLocaleString('en-NG')}</span>
                </li>
              ))}
            </ol>
            {data.me && data.me.rank == null ? (
              <p className="border-t border-line px-4 py-3 text-xs font-semibold text-muted">You are not on the board yet this week.</p>
            ) : null}
          </>
        ) : (
          <p className="p-4 text-sm text-navy">
            {tab === 'friends'
              ? 'Nobody you follow has Impact yet this week.'
              : `Nobody in ${data.area?.lga ?? 'your area'} has Impact yet this week. Be the first: confirm a report or help a neighbour.`}
          </p>
        )}
      </div>
      <p className="px-1 text-xs font-semibold text-muted">
        Starts again every Monday. Each Monday the top verified helper in each area (at least ⭐ 25) becomes Area Champion and gets a
        👑 on the map.
      </p>
    </section>
  );
}
