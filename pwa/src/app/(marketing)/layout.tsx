import type { ReactNode } from 'react';
import '../landing.css';

/** Auth and onboarding routes — no app browse chrome. Scoped to landing styles. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="landing-page-wrapper">
      {children}
    </div>
  );
}
