'use client';

import Link from 'next/link';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';

type LegalSection = {
  heading: string;
  body: string[];
};

type LegalDocumentPageProps = {
  title: string;
  subtitle: string;
  sections: LegalSection[];
  backHref?: string;
  backLabel?: string;
};

export function LegalDocumentPage({
  title,
  subtitle,
  sections,
  backHref = '/signup',
  backLabel = 'Back to signup',
}: LegalDocumentPageProps) {
  return (
    <AuthFlowPage
      ariaLabel={title}
      stageKey={`legal-${title}`}
      stepLabel={title}
      backHref={backHref}
      backLabel={backLabel}
    >
      <div className="auth-signup-sheet-fields flex max-h-[52dvh] flex-col gap-4 overflow-y-auto pr-0.5">
        <div>
          <h1 className="text-lg font-black tracking-tight text-brand-black">{title}</h1>
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
            {subtitle}
          </p>
        </div>
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-sm font-bold text-brand-black">{section.heading}</h2>
            <div className="mt-1.5 space-y-2 text-[11px] leading-relaxed text-[var(--neu-text-muted)]">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        <p className="text-[10px] font-medium text-[var(--neu-text-muted)]">
          Questions? Contact{' '}
          <Link href="mailto:support@neyborhuud.com" className="font-semibold text-[var(--landing-green-deep,#006f35)]">
            support@neyborhuud.com
          </Link>
        </p>
      </div>
    </AuthFlowPage>
  );
}

export const LEGAL_LINKS = {
  communityRules: '/info/community-rules',
  termsOfService: '/info/terms-of-service',
  privacyPolicy: '/info/privacy-policy',
} as const;
