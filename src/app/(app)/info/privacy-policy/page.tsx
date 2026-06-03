'use client';

import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      subtitle="How NeyborHuud collects, uses, and protects your personal data under NDPA / NDPR."
      sections={[
        {
          heading: 'Data we process',
          body: [
            'Account data such as name, email, username, and profile details needed to run your account.',
            'Location data when you enable map, Huud assignment, or safety features.',
            'Usage data that helps us keep the service secure and reliable.',
          ],
        },
        {
          heading: 'Why we process it',
          body: [
            'To create and manage your account, assign your Huud, and deliver hyperlocal features.',
            'To protect members, investigate abuse, and comply with applicable law.',
          ],
        },
        {
          heading: 'Your choices',
          body: [
            'Optional marketing and analytics consent can be managed during signup and in Settings.',
            'You may request export or deletion of your data subject to legal and safety retention requirements.',
          ],
        },
        {
          heading: 'Retention & security',
          body: [
            'We apply technical and organisational measures to protect personal data.',
            'We retain data only as long as needed for the purposes above or as required by law.',
          ],
        },
      ]}
    />
  );
}
