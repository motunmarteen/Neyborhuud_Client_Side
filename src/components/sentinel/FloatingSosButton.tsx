'use client';

import React, { useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSos } from '@/hooks/useSos';
import { useNeighborhoodEmergency } from '@/hooks/useNeighborhoodEmergency';
import { useSentinelBottomSheet } from '@/contexts/SentinelBottomSheetContext';
import { AppNavIcon } from '@/components/navigation/AppNavIcon';
import { useScrollHideBottomNav } from '@/hooks/useScrollHideBottomNav';

export function FloatingSosButton() {
  const router = useRouter();
  const pathname = usePathname();
  const sos = useSos();
  const hasNeighborhoodEmergency = useNeighborhoodEmergency();
  const { openSheet } = useSentinelBottomSheet();
  const scrollHidden = useScrollHideBottomNav();

  if (pathname.startsWith('/chat/')) {
    return null;
  }

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const sosActive = pathname.startsWith('/sos') || pathname.startsWith('/safety') || sos.phase !== 'idle';

  const startSosPress = () => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      void sos.triggerSos({ silent: true });
    }, 600);
  };

  const cancelSosPress = (e: React.SyntheticEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (longPressFired.current) {
      e.preventDefault();
      e.stopPropagation();
      longPressFired.current = false;
      return;
    }
    if (e.type === 'pointerup' || e.type === 'touchend' || e.type === 'mouseup') {
      router.push('/sos');
    }
  };

  return (
    <div 
      className={`fixed right-4 z-[40] w-14 h-14`} 
      style={{ 
        bottom: scrollHidden ? '1.5rem' : '4.5rem',
        transition: 'bottom 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      <div className="relative app-bottomnav__sos-glass app-bottomnav__glass app-bottomnav__glass--disc">
        <span
          className={`app-bottomnav__sos-ring ${(sos.phase !== 'idle' || hasNeighborhoodEmergency) ? 'app-bottomnav__sos-ring--live' : 'app-bottomnav__sos-ring--idle'}`}
          aria-hidden
        />
        <button
          type="button"
          onPointerDown={startSosPress}
          onPointerUp={cancelSosPress}
          onPointerLeave={() => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
          }}
          onContextMenu={(e) => e.preventDefault()}
          className={`text-red-500 app-bottomnav__sos-btn${sosActive ? ' app-bottomnav__sos-btn--active' : ''}`}
          aria-current={sosActive ? 'page' : undefined}
          aria-label="SOS — tap to open command center, long-press for silent SOS"
        >
          <AppNavIcon name="sos" />
        </button>
      </div>
    </div>
  );
}
