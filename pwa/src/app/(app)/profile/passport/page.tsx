'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { geoService } from '@/services/geo.service';
import { HuudPassportCard } from '@/components/profile/HuudPassportCard';
import TopNav from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/feed/BottomNav';
import { toast } from 'sonner';

export default function HuudPassportPage() {
  const router = useRouter();
  const [passport, setPassport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await geoService.getHuudPassport();
        if (mounted) {
          if (res.success && res.data?.passport) {
            setPassport(res.data.passport);
          } else {
            setError(res.message || 'Address verification required to issue Huud Passport');
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || 'Could not load your Huud Passport. Please verify your address first.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleShare = () => {
    if (!passport) return;
    const text = `I am a verified resident of ${passport.communityName} on NeyborHuud! Digital Postcode: ${passport.maskedPostcode} • TrustScore: ${passport.trustScore}`;
    if (navigator.share) {
      navigator.share({
        title: 'NeyborHuud - Digital Huud Passport',
        text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Passport verification details copied to clipboard!');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 ">
      <TopNav />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 ">
              Identity Proof
            </span>
          </div>
        </div>

        {loading ? (
          <div className="my-auto flex flex-col items-center justify-center py-20 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-emerald-500/20 border-t-emerald-600" />
            <p className="mt-4 text-xs font-bold text-slate-500">
              Generating your cryptographic Huud Passport…
            </p>
          </div>
        ) : error ? (
          <div className="my-auto rounded-3xl bg-white p-8 text-center shadow-sm border border-slate-200  ">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600  ">
              <span className="material-symbols-outlined text-[32px]">shield_lock</span>
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900 ">
              Address Verification Needed
            </h2>
            <p className="mt-2 text-xs text-slate-500  leading-relaxed">
              Your Huud Passport provides portable, verifiable proof of residency powered by the NIPOST National Digital Postcode system.
            </p>
            <div className="mt-6">
              <Link
                href="/verify-location"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-500 transition shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">my_location</span>
                Verify Building Address
              </Link>
            </div>
          </div>
        ) : passport ? (
          <div className="space-y-4">
            <HuudPassportCard passport={passport} onShare={handleShare} />

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80  ">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 ">
                About Your Huud Passport
              </h4>
              <ul className="mt-2 space-y-2 text-[11px] text-slate-600 ">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0 mt-0.5">check_circle</span>
                  <span><strong>11-Character NDAPS:</strong> Verifies your physical building with Nigeria Postal Service standards.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0 mt-0.5">check_circle</span>
                  <span><strong>Privacy Protected:</strong> Public feeds only show masked coordinates (e.g. <code>FC 02 *** ** 09</code>).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0 mt-0.5">check_circle</span>
                  <span><strong>Proof Ladder:</strong> Level 1 (GPS) up to Level 5 (Estate Admin approval).</span>
                </li>
              </ul>
            </div>
          </div>
        ) : null}
      </main>
      <BottomNav />
    </div>
  );
}
