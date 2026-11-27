'use client';

/**
 * "Text my guardians" (owner 2026-11-27): free for NeyborHuud. One tap opens the phone's own SMS
 * app with every guardian filled in and a message with the map location. It uses the person's
 * airtime, works with no data, and reaches guardians who don't have the app open.
 *
 * Guardian numbers are kept on this phone (not just in memory) so it still works offline.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSos } from '@/hooks/useSos';
import { safetyService } from '@/services/safety.service';

const CACHE_KEY = 'nh_guardian_phones';
type Contact = { name: string; phone: string };

function readCache(): Contact[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(CACHE_KEY) || '[]');
    return Array.isArray(v) ? v.filter((c) => c && typeof c.phone === 'string') : [];
  } catch {
    return [];
  }
}

/** 0803… / +234… → +234… (what SMS and WhatsApp links want). */
export function intlPhone(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('234')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return /^\d{8,10}$/.test(d) ? `+234${d}` : null;
}

/** iPhone wants `sms:/open?addresses=a,b&body=`; Android takes `sms:a,b?body=`. */
export function smsHref(phones: string[], body: string, ua: string): string {
  const list = phones.join(',');
  const enc = encodeURIComponent(body);
  return /iPhone|iPad|iPod/i.test(ua) ? `sms:/open?addresses=${list}&body=${enc}` : `sms:${list}?body=${enc}`;
}

export function sosTextBody(lat?: number, lng?: number): string {
  const where = typeof lat === 'number' && typeof lng === 'number' ? ` I'm here: https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}` : '';
  const time = new Date().toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
  return `🚨 SOS: I need help now (${time}).${where} If you can't reach me, call 112. (NeyborHuud)`;
}

export function SosTextGuardians({ className = '' }: { className?: string }) {
  const sos = useSos();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [ua, setUa] = useState('');

  useEffect(() => {
    setUa(navigator.userAgent);
    setContacts(readCache());
    let cancelled = false;
    safetyService
      .getGuardians('accepted')
      .then((res) => {
        const list: Contact[] = (res.data?.guardians ?? [])
          .map((g) => (typeof g.guardianId === 'object' ? g.guardianId : null))
          .filter((g): g is NonNullable<typeof g> => !!g?.phoneNumber)
          .map((g) => ({ name: g.firstName || 'Guardian', phone: intlPhone(g.phoneNumber!) ?? '' }))
          .filter((c) => c.phone);
        if (cancelled) return;
        setContacts(list);
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(list));
        } catch {
          /* private mode */
        }
      })
      .catch(() => undefined); // offline: keep the saved numbers
    return () => {
      cancelled = true;
    };
  }, []);

  const loc = sos.activeSos?.location as { lat?: number; lng?: number } | undefined;
  const body = useMemo(() => sosTextBody(loc?.lat, loc?.lng), [loc?.lat, loc?.lng]);

  if (contacts.length === 0) return null;
  const names = contacts.map((c) => c.name).slice(0, 3).join(', ') + (contacts.length > 3 ? ` +${contacts.length - 3}` : '');

  return (
    <div className={`rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)] ${className}`}>
      <a
        href={smsHref(contacts.map((c) => c.phone), body, ua)}
        className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-navy px-4 text-white active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-[24px]" aria-hidden>sms</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-extrabold">Text my guardians</span>
          <span className="block truncate text-[12px] text-white/80">{names} · works without data</span>
        </span>
      </a>
      <div className="mt-2 flex flex-wrap gap-2">
        {contacts.slice(0, 4).map((c) => (
          <a
            key={c.phone}
            href={`https://wa.me/${c.phone.replace('+', '')}?text=${encodeURIComponent(body)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1 rounded-full bg-green-soft px-3 text-[13px] font-bold text-brand-green-dark"
          >
            WhatsApp {c.name}
          </a>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-muted">Sent from your own phone. Your guardians also get an alert from the app.</p>
    </div>
  );
}
