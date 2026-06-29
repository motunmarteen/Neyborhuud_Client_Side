import PageClient from './PageClient';
import { capStaticParams } from '@/lib/staticExportParams';

// Static-export support: emit one placeholder shell; the client component
// resolves the real "conversationId" param at runtime via useParams(). See
// src/lib/staticExportParams.ts.
export const dynamicParams = true;
export function generateStaticParams() {
  return capStaticParams('conversationId');
}

export default function Page() {
  return <PageClient />;
}
