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
    return <div className="animate-pulse bg-gray-50/30 h-24 border-y border-gray-100" />;
  }

  return (
    <section className="space-y-0">
      <div className="px-6 py-4">
        <SentinelSectionHeader
          title="Your circle"
          subtitle="Live status from people you protect or who protect you."
          action={
            <Link href="/safety/manage#status" className="text-xs font-semibold text-primary no-underline hover:underline">
              Open feed
            </Link>
          }
        />
      </div>

      {feed.length === 0 ? (
        <div className="bg-white py-8 border-y border-gray-100">
          <BrowseEmptyState
            className="flex flex-col items-center gap-3 bg-white px-6 py-6 text-center rounded-none shadow-none border-0"
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
        </div>
      ) : (
        <ul className="flex flex-col bg-white border-y border-gray-100">
          {feed.slice(0, 6).map((s, idx) => (
            <li
              key={`${s.userId ?? idx}-${s.lastUpdatedAt ?? idx}`}
              className="flex items-center gap-4 py-4.5 px-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors bg-white rounded-none"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDot(String(s.currentStatus))}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold capitalize text-gray-800">
                  {String(s.currentStatus).replace(/_/g, ' ')}
                </p>
                {s.customMessage ? (
                  <p className="truncate text-xs text-gray-500 mt-0.5">
                    {s.customMessage}
                  </p>
                ) : null}
              </div>
              {s.lastUpdatedAt ? (
                <span className="shrink-0 text-xs tabular-nums text-gray-400">
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
