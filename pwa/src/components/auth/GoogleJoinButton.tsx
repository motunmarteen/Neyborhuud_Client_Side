'use client';

/**
 * "Continue with Google" for the join sheet. Hidden until NEXT_PUBLIC_GOOGLE_CLIENT_ID is set
 * (and the server has GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). Uses Google's own sign-in
 * button: Google gives the browser a signed token, the server checks it and opens a session.
 * The invite code is applied straight after.
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import type { AreaWelcome } from '@/hooks/useAreaWelcome';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export function googleSignInEnabled(): boolean {
  return CLIENT_ID.length > 10;
}

type GoogleId = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: string }) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};

function loadGoogle(): Promise<GoogleId> {
  const w = window as unknown as { google?: GoogleId };
  if (w.google?.accounts?.id) return Promise.resolve(w.google);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => (w.google ? resolve(w.google) : reject(new Error('Google sign-in did not load')));
    s.onerror = () => reject(new Error('Google sign-in did not load'));
    document.head.appendChild(s);
  });
}

export function GoogleJoinButton({ invite, onDone }: { home: { lat: number; lng: number } | null; area: AreaWelcome | null; invite: string; onDone: () => void }) {
  const box = useRef<HTMLDivElement | null>(null);
  const qc = useQueryClient();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!googleSignInEnabled() || !box.current) return;
    let alive = true;
    loadGoogle()
      .then((g) => {
        if (!alive || !box.current) return;
        g.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            if (!credential) return;
            try {
              const ok = await authService.socialWithIdToken('google', credential);
              if (!ok) throw new Error('Google sign-in failed');
              if (invite) {
                await apiClient.post('/gamification/referral/redeem', { referralCode: invite }).catch(() => undefined);
              }
              await qc.invalidateQueries({ queryKey: ['currentUser'] });
              toast.success('Welcome to NeyborHuud! 🎉 Set your home area from your welcome quest.');
              onDone();
            } catch (e) {
              toast.error((e as Error).message || 'Google sign-in failed');
            }
          },
        });
        g.accounts.id.renderButton(box.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 320 });
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [invite, onDone, qc]);

  if (!googleSignInEnabled() || failed) return null;
  return <div ref={box} className="flex min-h-11 justify-center" />;
}
