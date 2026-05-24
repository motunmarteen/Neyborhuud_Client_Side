'use client';

import { useEffect, type ReactNode } from 'react';

type ProfileAuthShellProps = {
  children: ReactNode;
};

/**
 * Applies the same `data-auth` surface as signup/login map flows
 * (#060908 backdrop, landing/auth tokens).
 */
export function ProfileAuthShell({ children }: ProfileAuthShellProps) {
  useEffect(() => {
    document.documentElement.setAttribute('data-auth', 'profile-map');
    return () => {
      if (document.documentElement.getAttribute('data-auth') === 'profile-map') {
        document.documentElement.removeAttribute('data-auth');
      }
    };
  }, []);

  return <div className="profile-auth-shell">{children}</div>;
}

type ProfileAuthSheetProps = {
  children: ReactNode;
  /** Seamless white sheet continuation below the first sheet block */
  continueSheet?: boolean;
};

export function ProfileAuthSheet({ children, continueSheet = false }: ProfileAuthSheetProps) {
  return (
    <div
      className={`auth-signup-bottom-sheet profile-auth-sheet ${
        continueSheet ? 'profile-auth-sheet--continue' : 'profile-auth-sheet--inline'
      }`}
    >
      {!continueSheet && <div className="auth-signup-bottom-sheet__shine" aria-hidden />}
      <div className="auth-signup-bottom-sheet__body">
        <div className="auth-signup-sheet-fields flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

export function ProfileAuthSectionTitle({ children }: { children: ReactNode }) {
  return <p className="auth-flow-hero-card__eyebrow mb-0">{children}</p>;
}
