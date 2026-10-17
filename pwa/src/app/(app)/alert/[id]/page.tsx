import type { Metadata } from 'next';
import { Suspense } from 'react';
import PageClient from './PageClient';
import { capStaticParams } from '@/lib/staticExportParams';
import { ageWords, areaName, fetchPublicAlert, statusWords } from '@/lib/publicAlert';

// Static-export support: emit one placeholder shell; the client reads the id at runtime.
export const dynamicParams = true;
export function generateStaticParams() {
  return capStaticParams('id');
}

/**
 * The WhatsApp / social preview says how the alert stands right now (owner 2026-10-17,
 * "share safely"): unconfirmed, confirmed, disputed or ended.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    if (!/^[0-9a-f]{24}$/i.test(id)) return { title: 'Safety alert' };
    const a = await fetchPublicAlert(id, { forPreview: true });
    if (!a) return { title: 'Safety alert' };
    if (a.state === 'ended') {
      return { title: 'This alert has ended', description: 'This safety alert is no longer active.' };
    }
    const s = statusWords(a);
    const title = `${s.badge}: ${a.title} · ${areaName(a.area)}`;
    const description = `${s.line} · reported ${ageWords(a.createdAt)}. See it live on NeyborHuud.`;
    return { title, description, openGraph: { title, description }, twitter: { title, description } };
  } catch {
    return { title: 'Safety alert' };
  }
}

// PageClient reads ?ref= (useSearchParams). Without a Suspense boundary Next.js gives up on
// this pre-built page at request time (NEXT_STATIC_GEN_BAILOUT, a 500 in production only).
export default function Page() {
  return (
    <Suspense>
      <PageClient />
    </Suspense>
  );
}
