import LocalNewsLegacyRedirectClient from './PageClient';
import { capStaticParams } from '@/lib/staticExportParams';

export const dynamicParams = true;
export function generateStaticParams() {
  return capStaticParams('id');
}

/** Legacy URLs (old Huud Gist threads, removed 2026-10-15) open the news list. */
export default function LegacyLocalNewsDetailPage() {
  return <LocalNewsLegacyRedirectClient />;
}
