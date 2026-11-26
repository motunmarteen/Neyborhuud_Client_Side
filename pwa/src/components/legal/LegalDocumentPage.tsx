'use client';

import Link from 'next/link';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';

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
  const { user, mounted } = useClientAuthUser();
  // Signed in (e.g. from Settings → Help): a normal, readable app page. During sign-up the
  // page keeps the sign-up sheet it was built for.
  if (mounted && user) {
    return (
      <AppBrowseLayout>
        <article className="rounded-[22px] bg-white p-5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
          <h1 className="font-heading text-2xl font-extrabold leading-tight text-navy">{title}</h1>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">{subtitle}</p>
          {sections.map((section) => (
            <section key={section.heading} className="mt-5">
              <h2 className="font-heading text-lg font-extrabold text-navy">{section.heading}</h2>
              <div className="mt-1.5 space-y-2 text-[15px] leading-relaxed text-navy">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
          <p className="mt-6 text-[14px] text-muted">
            Questions? Write to <span className="select-all font-bold text-brand-green-dark">support@neyborhuud.com</span>
          </p>
        </article>
      </AppBrowseLayout>
    );
  }

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
          <Link href="mailto:support@neyborhuud.com" className="font-semibold text-[var(--landing-green-deep,#0E8A3E)]">
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
