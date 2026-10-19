'use client';

/**
 * Sentinel: every safety feature in one place (owner 2026-10-19: Sentinel is the safety
 * umbrella; the assistant and search moved to Ask Huud, /ask). SOS hold, guardians, trips,
 * check-ins, zones and the rest come from SentinelHub; a link asks Ask Huud about your area.
 * Old links with ?q= (searches) go to Ask Huud.
 */

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { useAuth } from '@/hooks/useAuth';
import { useHuudDisplayName, HUUD_NAME_FALLBACK } from '@/hooks/useHuudDisplayName';
import { SentinelHub } from '@/components/sentinel/SentinelHub';
import SosCountdownOverlay from '@/components/safety/SosCountdownOverlay';
import { useSos } from '@/hooks/useSos';
import { useTranslation } from '@/lib/i18n';

export default function SentinelPage() {
  return (
    <Suspense>
      <SentinelScreen />
    </Suspense>
  );
}

function SentinelScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const sos = useSos();
  const huudName = useHuudDisplayName(user);
  const area = huudName && huudName !== HUUD_NAME_FALLBACK ? huudName : null;

  // Searches and questions now live in Ask Huud.
  useEffect(() => {
    const q = params.get('q');
    if (q) router.replace(`/ask?q=${encodeURIComponent(q)}`);
    else if (params.get('focus') === '1') router.replace('/ask?focus=1');
  }, [params, router]);

  const safetyQ = area ? t('sentinel.askSafeArea', { area }) : t('sentinel.askSafe');

  return (
    <>
      <SosCountdownOverlay
        phase={sos.phase}
        secondsRemaining={sos.secondsRemaining}
        visibilityMode={sos.activeSos?.visibilityMode ?? 'normal'}
        onCancel={() => void sos.cancelSos('User cancelled countdown')}
      />
      <AppBrowseLayout className="!px-0">
        <div className="flex flex-col gap-4 px-4 pb-6 pt-1">
          <SentinelHub user={user} areaName={area} />
          <Link
            href={`/ask?q=${encodeURIComponent(safetyQ)}`}
            className="flex min-h-14 items-center gap-3 rounded-[22px] bg-white px-4 py-3 shadow-[0_2px_10px_rgba(29,36,51,0.06)] hover:bg-[#F6F8FB]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-soft text-brand-green-dark" aria-hidden>
              <Sparkles size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-extrabold text-navy">{t('sentinel.askHuudTitle')}</span>
              <span className="block truncate text-[13px] text-muted">{safetyQ}</span>
            </span>
          </Link>
        </div>
      </AppBrowseLayout>
    </>
  );
}
