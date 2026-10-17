import type { Metadata } from 'next';
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
    const a = await fetchPublicAlert(id);
    if (!a) return { title: 'Safety alert · NeyborHuud' };
    if (a.state === 'ended') {
      return { title: 'This alert has ended · NeyborHuud', description: 'This safety alert is no longer active.' };
    }
    const s = statusWords(a);
    const title = `${s.badge}: ${a.title} · ${areaName(a.area)}`;
    const description = `${s.line} · reported ${ageWords(a.createdAt)}. See it live on NeyborHuud.`;
    return { title, description, openGraph: { title, description }, twitter: { title, description } };
  } catch {
    return { title: 'Safety alert · NeyborHuud' };
  }
}

export default function Page() {
  return <PageClient />;
}
