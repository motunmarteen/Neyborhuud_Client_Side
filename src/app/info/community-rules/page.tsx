'use client';

import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';

export default function CommunityRulesPage() {
  return (
    <LegalDocumentPage
      title="Community Rules"
      subtitle="How we keep every Huud safe, respectful, and useful."
      sections={[
        {
          heading: 'Be a good neybor',
          body: [
            'Treat people in your Huud the way you would want to be treated on your own street.',
            'Share accurate local information. Do not post rumours as facts, and correct yourself when you learn something new.',
          ],
        },
        {
          heading: 'Safety first',
          body: [
            'Use SOS and emergency tools only for genuine safety situations.',
            'Do not impersonate officials, emergency services, or other members.',
          ],
        },
        {
          heading: 'Respect & privacy',
          body: [
            'Do not share another person’s private details without consent.',
            'Harassment, hate speech, and threats are not tolerated.',
          ],
        },
        {
          heading: 'Commerce & listings',
          body: [
            'Marketplace and service listings must be honest about price, condition, and availability.',
            'Scams, spam, and misleading promotions may lead to account restrictions.',
          ],
        },
      ]}
    />
  );
}
