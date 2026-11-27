'use client';

/**
 * "Can my phone ring for an SOS?" (owner 2026-11-27). Push is our free alert channel, so a guardian
 * without notifications on would never hear about an SOS with the app closed. Shown on SOS > Circle.
 * iPhones only get web notifications once NeyborHuud is added to the Home Screen (iOS 16.4+).
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function SosAlertsReadiness({ className = '' }: { className?: string }) {
  const { permission, isSubscribed, isRegistering, requestPermissionAndSubscribe } = usePushNotifications();
  const [iosNeedsHome, setIosNeedsHome] = useState(false);

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIosNeedsHome(ios && !standalone);
  }, []);

  const card = `rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)] ${className}`;

  if (isSubscribed && permission === 'granted') {
    return (
      <p className={`${card} text-[14px] font-bold text-brand-green-dark`}>
        🔔 SOS alerts are on. Your phone rings if someone you protect presses SOS.
      </p>
    );
  }

  return (
    <div className={`${card} flex flex-col gap-3`}>
      <div>
        <h3 className="font-heading text-base font-extrabold text-navy">Let your phone ring for an SOS</h3>
        <p className="mt-1 text-[14px] leading-relaxed text-muted">
          Turn on notifications so you hear about an SOS even when NeyborHuud is closed. It&apos;s free, no SMS needed.
        </p>
      </div>
      {iosNeedsHome ? (
        <p className="rounded-2xl bg-amber-soft p-3 text-[13px] font-semibold text-navy">
          On iPhone: tap Share, then &quot;Add to Home Screen&quot;. Open NeyborHuud from the new icon and turn alerts on there.
        </p>
      ) : permission === 'denied' ? (
        <p className="rounded-2xl bg-amber-soft p-3 text-[13px] font-semibold text-navy">
          Notifications are blocked. Open your browser&apos;s site settings for NeyborHuud and allow notifications.
        </p>
      ) : permission === 'unsupported' ? (
        <p className="rounded-2xl bg-background p-3 text-[13px] text-muted">This browser can&apos;t show notifications. Try Chrome.</p>
      ) : (
        <Button fullWidth loading={isRegistering} onClick={() => void requestPermissionAndSubscribe()}>
          Turn on SOS alerts
        </Button>
      )}
    </div>
  );
}
