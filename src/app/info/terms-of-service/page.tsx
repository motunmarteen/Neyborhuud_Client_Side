'use client';

import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';

export default function TermsOfServicePage() {
  return (
    <LegalDocumentPage
      title="Terms of Service"
      subtitle="The agreement between you and NeyborHuud when you use the platform."
      sections={[
        {
          heading: 'Your account',
          body: [
            'You must provide accurate signup information and keep your credentials secure.',
            'You are responsible for activity that happens under your account.',
          ],
        },
        {
          heading: 'Acceptable use',
          body: [
            'You may use NeyborHuud for lawful hyperlocal communication, safety awareness, and community participation.',
            'We may suspend or restrict accounts that violate Community Rules or abuse platform systems.',
          ],
        },
        {
          heading: 'Location & hyperlocal features',
          body: [
            'Some features depend on your location and assigned Huud. You agree to provide location data needed for those features to work.',
          ],
        },
        {
          heading: 'Changes',
          body: [
            'We may update these terms as the product evolves. Material changes will be communicated in-app or by email where appropriate.',
          ],
        },
      ]}
    />
  );
}
