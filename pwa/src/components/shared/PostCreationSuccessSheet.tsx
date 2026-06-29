'use client';

import Link from 'next/link';

type ContentType = 'job' | 'event' | 'marketplace' | 'service';

interface CrossPromo {
  icon: string;
  label: string;
  description: string;
  href: string;
}

const CROSS_PROMOS: Record<ContentType, CrossPromo[]> = {
  job: [
    { icon: 'campaign', label: 'Share to feed', description: 'Let neighbours know about this opening', href: '/feed' },
    { icon: 'event', label: 'Host a hiring event', description: 'Meet candidates in person', href: '/events/create' },
    { icon: 'rocket_launch', label: 'Boost this job', description: 'Reach more people with HuudCoins', href: '/huud-economy/wallet?tab=spends' },
  ],
  event: [
    { icon: 'campaign', label: 'Share to feed', description: 'Spread the word in your Huud', href: '/feed' },
    { icon: 'work', label: 'Need help running it?', description: 'Post a job for event staff', href: '/jobs/create' },
    { icon: 'rocket_launch', label: 'Boost this event', description: 'Get more RSVPs with HuudCoins', href: '/huud-economy/wallet?tab=spends' },
  ],
  marketplace: [
    { icon: 'campaign', label: 'Share to feed', description: 'Show off your listing', href: '/feed' },
    { icon: 'storefront', label: 'List another item', description: 'Keep your shop active', href: '/marketplace/create' },
    { icon: 'rocket_launch', label: 'Boost this listing', description: 'More eyeballs with HuudCoins', href: '/huud-economy/wallet?tab=spends' },
  ],
  service: [
    { icon: 'campaign', label: 'Share to feed', description: 'Let your Huud know you\'re available', href: '/feed' },
    { icon: 'work', label: 'Looking for talent?', description: 'Post a job too', href: '/jobs/create' },
    { icon: 'rocket_launch', label: 'Boost your service', description: 'Stand out with HuudCoins', href: '/huud-economy/wallet?tab=spends' },
  ],
};

const TYPE_LABELS: Record<ContentType, string> = {
  job: 'Job posted!',
  event: 'Event created!',
  marketplace: 'Listing live!',
  service: 'Service listed!',
};

interface Props {
  type: ContentType;
  onDismiss: () => void;
}

export function PostCreationSuccessSheet({ type, onDismiss }: Props) {
  const promos = CROSS_PROMOS[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-md neu-base rounded-t-3xl px-5 pb-8 pt-4 animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-primary/20" />

        {/* Success header */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-[28px]" aria-hidden="true">check</span>
          </div>
          <div className="text-center">
            <p className="text-lg font-extrabold neu-text">{TYPE_LABELS[type]}</p>
            <p className="text-sm neu-text-muted mt-0.5">What would you like to do next?</p>
          </div>
        </div>

        {/* Cross-promo options */}
        <div className="flex flex-col gap-2 mb-4">
          {promos.map((promo) => (
            <Link
              key={promo.href}
              href={promo.href}
              onClick={onDismiss}
              className="neu-input rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">{promo.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold neu-text">{promo.label}</p>
                <p className="text-xs neu-text-muted truncate">{promo.description}</p>
              </div>
              <span className="material-symbols-outlined text-[16px] neu-text-muted shrink-0" aria-hidden="true">chevron_right</span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full rounded-2xl py-3 text-sm font-bold neu-text-muted mod-chip active:scale-[0.98] transition-transform"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
