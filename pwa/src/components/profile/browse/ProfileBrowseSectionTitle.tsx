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
    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">{children}</p>
  );
}
