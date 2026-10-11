'use client';

import { toast } from 'sonner';
import { nhToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => nhToast.thanks({ title: 'Well done! Your report don reach 23 neighbours', sub: 'Flood · they fit confirm am now', coins: 15 })}>
        Thank-you with HuudCredit
      </Button>
      <Button size="sm" variant="soft" onClick={() => nhToast.thanks({ emoji: '✅', title: 'Thank you! Neighbours go know say e true', sub: 'Your confirmation helps the alert reach more people.' })}>
        Thank-you, no coins
      </Button>
      <Button size="sm" variant="secondary" onClick={() => toast.success('Saved')}>
        Message
      </Button>
      <Button size="sm" variant="secondary" onClick={() => nhToast.error('Not sent', 'Check your network and try again.')}>
        Error
      </Button>
      <Button size="sm" variant="secondary" onClick={() => nhToast.warning('Low network', 'Photos will upload when you are back online.')}>
        Warning
      </Button>
      <Button size="sm" variant="secondary" onClick={() => toast.info('Poll closes Friday', { action: { label: 'Vote', onClick: () => {} } })}>
        With a button
      </Button>
    </div>
  );
}
