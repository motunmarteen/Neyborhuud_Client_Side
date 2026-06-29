'use client';

import type { ReactNode } from 'react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { LocalHuudHubHeader } from '@/components/local-huud/LocalHuudHubHeader';
import type { LocalHuudHubId } from '@/lib/local-huud-hub';

type LocalHuudSubpageShellProps = {
  hubId: LocalHuudHubId;
  children: ReactNode;
  maxWidth?: '680' | '920';
  /** Optional extra toolbar (filters, actions) below section nav. */
  toolbar?: ReactNode;
  hideSectionNav?: boolean;
};

/**
 * Standard shell for Local Huud detail, create, and management subpages.
 * Matches Huud Economy sub-routes: full browse chrome + section navigation.
 */
export function LocalHuudSubpageShell({
  hubId,
  children,
  maxWidth = '680',
  toolbar,
  hideSectionNav = false,
}: LocalHuudSubpageShellProps) {
  return (
    <AppBrowseLayout
      maxWidth={maxWidth}
      header={
        <LocalHuudHubHeader hubId={hubId} toolbar={toolbar} hideSectionNav={hideSectionNav} />
      }
    >
      {children}
    </AppBrowseLayout>
  );
}
