import ProfileClientBoundary from './ProfileClientBoundary';
import { capStaticParams } from '@/lib/staticExportParams';

export const dynamicParams = true;
export function generateStaticParams() {
  return capStaticParams('username');
}

export default function Page() {
  // Client-only render — the profile view fetches everything client-side and
  // must not be server-rendered on Vercel (see ProfileClientBoundary). This
  // eliminates the environment-specific SSR 500 on /profile/[username].
  return <ProfileClientBoundary />;
}
