'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { safetyService, type UserStatus } from '@/services/safety.service';

function statusDot(status: string) {
  if (status === 'safe' || status === 'arrived') return 'bg-primary';
  if (status === 'unsafe' || status === 'need_attention') return 'bg-brand-red';
  return 'bg-status-warning';
}

export function SosGuardiansFeed() {
  const [feed, setFeed] = useState<UserStatus[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void safetyService
      .getGuardiansFeed()
      .then((res) => {
        if (!cancelled) setFeed(res?.data?.feed ?? []);
      })
      .catch(() => {
        if (!cancelled) setFeed([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (feed === null) {
    return <div className="animate-pulse mod-card h-28 rounded-2xl" />;
  }

  return (
    <section className="space-y-3">
      <SentinelSectionHeader
        title="Your circle"
        subtitle="Live status from people you protect or who protect you."
        action={
          <Link href="/safety/manage#status" className="text-xs font-semibold text-primary no-underline hover:underline">
            Open feed
          </Link>
        }
      />

      {feed.length === 0 ? (
        <BrowseEmptyState
          icon="groups"
          title="No circle updates yet"
          description="Add trusted contacts on the Prepare tab so they appear here when they share status."
          action={
            <Link
              href="/safety/manage#guardians"
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white no-underline"
            >
              Add guardians
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {feed.slice(0, 6).map((s, idx) => (
            <li
              key={`${s.userId ?? idx}-${s.lastUpdatedAt ?? idx}`}
              className="mod-card flex items-center gap-3 rounded-2xl p-3"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDot(String(s.currentStatus))}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold capitalize" style={{ color: 'var(--neu-text)' }}>
                  {String(s.currentStatus).replace(/_/g, ' ')}
                </p>
                {s.customMessage ? (
                  <p className="truncate text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                    {s.customMessage}
                  </p>
                ) : null}
              </div>
              {s.lastUpdatedAt ? (
                <span className="shrink-0 text-[10px] tabular-nums" style={{ color: 'var(--neu-text-muted)' }}>
                  {new Date(s.lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
