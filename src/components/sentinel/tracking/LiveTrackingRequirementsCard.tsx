'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { SafetyEligibilityIssue } from '@/lib/safetyEligibility';
import {
  getSafetyProfileGaps,
  resolveUserFirstName,
  resolveUserLastName,
  resolveUserPhone,
} from '@/lib/userProfileFields';

type LiveTrackingRequirementsCardProps = {
  issues: SafetyEligibilityIssue[];
};

const GAP_LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  phone: 'Phone number',
};

export function LiveTrackingRequirementsCard({ issues }: LiveTrackingRequirementsCardProps) {
  const queryClient = useQueryClient();
  const { user, isFetching } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const profileGaps = getSafetyProfileGaps(user);
  const profileIssue = issues.find((i) => i.id === 'profile');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await queryClient.refetchQueries({ queryKey: ['currentUser'] });
    } finally {
      setRefreshing(false);
    }
  };

  if (issues.length === 0) return null;

  return (
    <div className="mod-card space-y-3 rounded-2xl border border-amber-400/40 bg-amber-50/90 p-4 dark:bg-amber-950/25">
      <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Before you can start live tracking</p>
      <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
        The server requires a verified account and complete profile for this high-risk feature (same rule as posting
        FYI). SOS does not require verification, but live tracking does.
      </p>
      {profileIssue && profileGaps.length > 0 ? (
        <p className="text-[11px] font-semibold text-amber-900/90 dark:text-amber-100/90">
          Still needed: {profileGaps.map((g) => GAP_LABELS[g] ?? g).join(' · ')}
        </p>
      ) : null}
      {profileIssue ? (
        <p className="text-[10px] leading-relaxed text-amber-800/90 dark:text-amber-200/90">
          On file: {resolveUserFirstName(user) || '—'} {resolveUserLastName(user) || '—'}
          {resolveUserPhone(user) ? ` · ${resolveUserPhone(user)}` : ' · no phone on account'}
          {isFetching || refreshing ? ' · checking server…' : ''}
        </p>
      ) : null}
      {profileIssue ? (
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing || isFetching}
          className="text-xs font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-50"
        >
          {refreshing || isFetching ? 'Refreshing…' : 'Refresh profile status'}
        </button>
      ) : null}
      <ul className="space-y-2">
        {issues.map((issue) => (
          <li key={issue.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-amber-900 dark:text-amber-100">{issue.message}</span>
            <Link
              href={issue.href}
              className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white no-underline"
            >
              {issue.actionLabel}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
