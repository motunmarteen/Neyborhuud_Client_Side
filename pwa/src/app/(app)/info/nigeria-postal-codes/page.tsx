'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';

type PostalRow = { state: string; postalHead: string; notes?: string };

type PostalApi = {
  disclaimer?: string;
  states?: PostalRow[];
  dataSourceWards?: string;
};

export default function NigeriaPostalInfoPage() {
  const [data, setData] = useState<PostalApi | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const base = getApiUrl();
    fetch(`${base}/geo/nigeria-postal-reference`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.success && j?.data) setData(j.data as PostalApi);
        else setErr('Could not load reference from the API.');
      })
      .catch(() => setErr('Network error loading reference.'));
  }, []);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden neu-base">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 py-10 pb-16">
        <Link
          href="/signup"
          className="text-xs font-bold uppercase tracking-widest text-brand-blue mb-6 inline-block"
        >
          ← Back
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight mb-3" style={{ color: 'var(--neu-text)' }}>
          Nigeria: states & postal code heads
        </h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--neu-text-secondary)' }}>
          NeyborHuud uses structured location data to help you pick the right ward or area inside your
          LGA. Below are typical <strong>state postal head</strong> codes (the start of each state&apos;s
          postcode range). Your exact postcode depends on your city and LGA — use NIPOST or a local post
          office for precision.
        </p>

        <div className="neu-socket rounded-2xl p-4 mb-8 text-sm space-y-3" style={{ color: 'var(--neu-text)' }}>
          <p className="font-semibold">Important</p>
          <ul className="list-disc pl-5 space-y-2" style={{ color: 'var(--neu-text-secondary)' }}>
            <li>
              <strong style={{ color: 'var(--neu-text)' }}>+234</strong> is Nigeria&apos;s{' '}
              <strong>international dialling code</strong>, not a ZIP or postal code.
            </li>
            <li>
              <strong style={{ color: 'var(--neu-text)' }}>23401</strong> is a{' '}
              <strong>United States ZIP code</strong> (e.g. Keller, Virginia). Do not use it as a Nigerian
              postcode.
            </li>
            <li>
              To find your postcode: choose your state, then city/LGA on the official NIPOST or postal
              service tools — similar to clicking through state → city → LGA on a parcel tracking or postal
              lookup site.
            </li>
          </ul>
        </div>

        {data?.disclaimer && (
          <p className="text-xs mb-4 leading-relaxed p-3 rounded-xl bg-black/[0.03]" style={{ color: 'var(--neu-text-secondary)' }}>
            {data.disclaimer}
          </p>
        )}

        {err && (
          <p className="text-sm text-brand-red mb-4">{err}</p>
        )}

        {data?.states && (
          <div className="overflow-x-auto neu-card-sm rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="text-left py-3 px-3 font-semibold" style={{ color: 'var(--neu-text)' }}>#</th>
                  <th className="text-left py-3 px-3 font-semibold" style={{ color: 'var(--neu-text)' }}>State</th>
                  <th className="text-left py-3 px-3 font-semibold" style={{ color: 'var(--neu-text)' }}>Postal head</th>
                  <th className="text-left py-3 px-3 font-semibold" style={{ color: 'var(--neu-text)' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.states.map((row, i) => (
                  <tr key={row.state} className="border-b border-black/5">
                    <td className="py-2 px-3" style={{ color: 'var(--neu-text-muted)' }}>{i + 1}</td>
                    <td className="py-2 px-3 font-medium" style={{ color: 'var(--neu-text)' }}>{row.state}</td>
                    <td className="py-2 px-3 font-mono text-xs" style={{ color: 'var(--neu-text)' }}>{row.postalHead}</td>
                    <td className="py-2 px-3 text-xs" style={{ color: 'var(--neu-text-secondary)' }}>{row.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data?.dataSourceWards && (
          <p className="text-xs mt-6 leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
            {data.dataSourceWards}
          </p>
        )}
      </div>
        </div>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
