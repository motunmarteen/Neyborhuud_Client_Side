import LocalNewsLegacyRedirectClient from './PageClient';
import { capStaticParams } from '@/lib/staticExportParams';

export const dynamicParams = true;
export function generateStaticParams() {
  return capStaticParams('id');
}

/** Legacy URLs — redirect old gossip detail paths to Huud Gist threads. */
export default function LegacyLocalNewsDetailPage() {
  return <LocalNewsLegacyRedirectClient />;
}
