'use client';

/**
 * Join NeyborHuud on the live map (owner 2026-10-18: "short sheet, email for now"; mockup
 * "Join your neighbours"). Replaces the old /signup page, which had its own flat map.
 *
 *   1. Your street: move the map so the pin sits on your home (only you see the exact spot).
 *   2. You: first name, email, password; your @name is made for you (you can change it);
 *      the invite code from the link is kept.
 * The account opens straight away. The email code comes later (welcome quest), so nobody is
 * stuck if an email is slow. "Continue with Google" shows only once Google sign-in keys exist.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type * as maplibregl from 'maplibre-gl';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useEmailValidation, useUsernameValidation } from '@/hooks/useEmailValidation';
import { evaluatePasswordPolicy } from '@/lib/passwordPolicy';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { LEGAL_LINKS } from '@/components/legal/LegalDocumentPage';
import { GoogleJoinButton, googleSignInEnabled } from '@/components/auth/GoogleJoinButton';
import type { AreaWelcome } from '@/hooks/useAreaWelcome';

/** From this zoom the map shows streets clearly enough to pick a home. */
const HOME_ZOOM = 15;

type Props = {
  map: maplibregl.Map | null;
  area: AreaWelcome | null;
  refCode: string | null;
  onLocate: () => void;
  locating: boolean;
  onClose: () => void;
};

function suggestName(first: string): string {
  const base = first.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'neighbour';
  return `${base.length < 3 ? `${base}nh` : base}${Math.floor(100 + Math.random() * 900)}`;
}

const INPUT =
  'min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] font-semibold text-navy outline-none placeholder:text-faint focus:border-primary';

export function JoinSheet({ map, area, refCode, onLocate, locating, onClose }: Props) {
  const qc = useQueryClient();
  const [step, setStep] = useState<'street' | 'you'>('street');
  const [home, setHome] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(() => map?.getZoom() ?? 0);
  const [first, setFirst] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [username, setUsername] = useState('');
  const [editName, setEditName] = useState(false);
  const [invite, setInvite] = useState(refCode ?? '');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const emailCheck = useEmailValidation({ debounceMs: 600, checkAvailability: true });
  const nameCheck = useUsernameValidation({ debounceMs: 500, checkAvailability: true });

  useEffect(() => {
    if (!map) return;
    const on = () => setZoom(map.getZoom());
    on();
    map.on('zoomend', on);
    return () => {
      map.off('zoomend', on);
    };
  }, [map]);

  // The sheet covers the bottom of the screen, so the map's centre (where the home pin is
  // read from) moves up into the part you can see, and the pin is drawn there.
  const sheetRef = useRef<HTMLElement | null>(null);
  const [pinAt, setPinAt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!map || step !== 'street') return;
    const place = () => {
      const p = map.project(map.getCenter());
      const r = map.getContainer().getBoundingClientRect();
      setPinAt({ x: r.left + p.x, y: r.top + p.y });
    };
    const pad = () => {
      const sheetTop = sheetRef.current?.getBoundingClientRect().top ?? window.innerHeight * 0.55;
      const r = map.getContainer().getBoundingClientRect();
      // Keep the pin below the top chrome and the sky band, above the sheet.
      map.setPadding({ top: 230, bottom: Math.max(0, r.bottom - sheetTop + 24), left: 0, right: 0 });
      place();
    };
    pad();
    map.on('move', place);
    window.addEventListener('resize', pad);
    return () => {
      map.off('move', place);
      window.removeEventListener('resize', pad);
      map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
    };
  }, [map, step]);

  useEffect(() => {
    emailCheck.validate(email);
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  // Make an @name from the first name (until they edit it themselves).
  useEffect(() => {
    if (!editName && first.trim().length >= 2) setUsername(suggestName(first));
  }, [first, editName]);
  useEffect(() => {
    nameCheck.validate(username);
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps
  // A taken suggestion gets new digits automatically.
  useEffect(() => {
    if (!editName && nameCheck.status === 'taken' && first.trim().length >= 2) setUsername(suggestName(first));
  }, [nameCheck.status, editName, first]);

  const areaName = area?.neighbourhood && area.lga ? `${area.neighbourhood}, ${area.lga}` : area?.lga ?? null;
  const policy = useMemo(() => evaluatePasswordPolicy(password, { email, username }), [password, email, username]);
  const nameOk = nameCheck.status === 'valid';
  const emailOk = emailCheck.status === 'valid';
  const ready = first.trim().length >= 2 && emailOk && nameOk && policy.ok && agree && !busy;

  const hint = (() => {
    if (first.trim().length < 2) return 'Tell us your first name';
    if (emailCheck.status === 'taken') return 'That email already has an account. Log in instead.';
    if (!emailOk) return emailCheck.status === 'checking' ? 'Checking your email…' : 'Enter your email';
    if (!nameOk) return nameCheck.status === 'checking' ? 'Checking your @name…' : nameCheck.errorMessage ?? 'Pick another @name';
    if (!policy.ok) return policy.message ?? 'Make a stronger password';
    if (!agree) return 'Agree to the rules to join';
    return null;
  })();

  const pickStreet = () => {
    if (!map) return;
    const c = map.getCenter();
    setHome({ lat: c.lat, lng: c.lng });
    setStep('you');
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || !home) return;
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        firstName: first.trim(),
        agreeToTerms: true,
        agreeToPrivacy: true,
        consentMarketing: false,
        consentAnalytics: false,
        consentThirdParty: false,
        location: {
          latitude: home.lat,
          longitude: home.lng,
          ...(area?.lga ? { lga: area.lga } : {}),
          ...(area?.state ? { state: area.state } : {}),
          ...(area?.neighbourhood ? { neighborhood: area.neighbourhood } : {}),
          resolutionSource: 'map_pin',
        },
      };
      if (invite.trim()) payload.referralCode = invite.trim();
      const res = await authService.register(payload as unknown as import('@/types/api').RegisterPayload);
      if (!res.success) throw new Error(res.message || 'Could not create your account');
      await qc.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(`Welcome to ${area?.lga ?? 'your Huud'}, ${first.trim()}! 🎉`);
      onClose();
    } catch (err) {
      const e2 = err as { message?: string; response?: { data?: { message?: string } } };
      toast.error(e2.response?.data?.message || e2.message || 'Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Drawn on the page body: the sheet card is animated with a transform, which would pin a
  // "fixed" element to the card instead of the screen.
  const pinPortal =
    step === 'street' && typeof document !== 'undefined'
      ? createPortal(
        <div
          className="pointer-events-none fixed z-20 -translate-x-1/2 -translate-y-full"
          style={pinAt ? { left: pinAt.x, top: pinAt.y } : { left: '50%', top: '35%' }}
          aria-hidden="true"
        >
          <div className="flex flex-col items-center">
            <span className="mb-1 rounded-full bg-navy px-3 py-1 text-xs font-extrabold text-white shadow-lg">My home</span>
            <svg width="34" height="44" viewBox="0 0 24 31" className="drop-shadow-[0_6px_10px_rgba(29,36,51,0.35)]">
              <path d="M12 30s10-9.3 10-17A10 10 0 0 0 2 13c0 7.7 10 17 10 17z" fill="#00B82E" stroke="#fff" strokeWidth="2" />
              <circle cx="12" cy="12.5" r="3.6" fill="#fff" />
            </svg>
          </div>
        </div>,
          document.body,
        )
      : null;

  if (step === 'street') {
    return (
      <>
        {pinPortal}
        <section ref={sheetRef} aria-labelledby="join-street-h" className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-green-dark">Join free · step 1 of 2</p>
              <h2 id="join-street-h" className="font-heading text-xl font-black text-navy">
                Where&apos;s your home?
              </h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-background text-navy">
              ✕
            </button>
          </div>
          <p className="text-sm text-navy">
            Move the map until the pin sits on your street. Only you see this exact spot; neighbours only see your area.
          </p>
          <p className="rounded-2xl bg-green-soft px-4 py-2 text-sm font-bold text-navy" aria-live="polite">
            📍 {zoom < HOME_ZOOM ? 'Zoom in to your street (or tap “Use my location”)' : areaName ?? 'Finding the area…'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onLocate}
              disabled={locating}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-[15px] font-bold text-navy disabled:opacity-60"
            >
              <span aria-hidden className="material-symbols-outlined text-[20px]">
                my_location
              </span>
              {locating ? 'Finding you…' : 'Use my location'}
            </button>
            <button
              type="button"
              onClick={pickStreet}
              disabled={!map || zoom < HOME_ZOOM}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-primary px-4 text-[15px] font-bold text-white disabled:opacity-50"
            >
              This is my street
            </button>
          </div>
          <p className="text-center text-sm font-semibold text-muted">
            Already a member?{' '}
            <Link href="/login" className="font-bold text-brand-green-dark">
              Log in
            </Link>
          </p>
        </section>
      </>
    );
  }

  return (
    <form onSubmit={join} aria-labelledby="join-you-h" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-green-dark">Join free · step 2 of 2</p>
          <h2 id="join-you-h" className="font-heading text-xl font-black text-navy">
            Join your neighbours{areaName ? ` in ${area?.lga}` : ''}
          </h2>
        </div>
        <button type="button" onClick={() => setStep('street')} className="min-h-10 rounded-full bg-background px-3 text-sm font-bold text-navy">
          ← Street
        </button>
      </div>

      {googleSignInEnabled() ? (
        <>
          <GoogleJoinButton home={home} area={area} invite={invite} onDone={onClose} />
          <p className="text-center text-xs font-bold text-muted">or with email</p>
        </>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold text-navy">First name</span>
        <input className={INPUT} value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" maxLength={40} placeholder="Ada" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold text-navy">Email</span>
        <input className={INPUT} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
      </label>
      <div className="flex flex-col gap-1">
        <label htmlFor="join-pw" className="text-sm font-bold text-navy">
          Password
        </label>
        <div className="relative">
          <input
            id="join-pw"
            className={`${INPUT} pr-20`}
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="12 or more characters"
          />
          <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 rounded-full px-3 text-xs font-bold text-muted">
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>
        {password ? <PasswordStrengthMeter password={password} email={email} username={username} /> : null}
      </div>

      {username ? (
        editName ? (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold text-navy">Your @name</span>
            <input
              className={INPUT}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              maxLength={30}
              autoCapitalize="none"
            />
          </label>
        ) : (
          <p className="text-sm text-navy">
            Your @name: <b>@{username}</b>{' '}
            <button type="button" onClick={() => setEditName(true)} className="font-bold text-brand-green-dark underline">
              change
            </button>
          </p>
        )
      ) : null}

      <details open={!!invite} className="text-sm">
        <summary className="cursor-pointer font-bold text-navy">Invite code {invite ? `· ${invite}` : '(optional)'}</summary>
        <input className={`${INPUT} mt-2`} value={invite} onChange={(e) => setInvite(e.target.value.trim())} placeholder="A friend's @name" autoCapitalize="none" />
        <p className="mt-1 text-xs font-semibold text-muted">You both get 50 HuudCredit once you help a neighbour or finish a deal.</p>
      </details>

      <label className="flex items-start gap-3 text-sm text-navy">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#00B82E]" />
        <span>
          I agree to the{' '}
          <Link href={LEGAL_LINKS.communityRules} className="font-bold underline">
            community rules
          </Link>
          ,{' '}
          <Link href={LEGAL_LINKS.termsOfService} className="font-bold underline">
            terms
          </Link>{' '}
          and{' '}
          <Link href={LEGAL_LINKS.privacyPolicy} className="font-bold underline">
            privacy policy
          </Link>
          .
        </span>
      </label>

      <button type="submit" disabled={!ready} className="min-h-12 rounded-full bg-primary text-[15px] font-bold text-white disabled:opacity-50">
        {busy ? 'Joining…' : 'Join free'}
      </button>
      {hint ? (
        <p className="text-center text-xs font-bold text-muted" aria-live="polite">
          {hint}
        </p>
      ) : null}
    </form>
  );
}
