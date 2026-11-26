'use client';

import type { ReactNode } from 'react';

export function ProfileBrowseSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>
      {children}
    </h2>
  );
}

export function ProfileBrowseEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] font-bold text-primary">{children}</p>
  );
}
