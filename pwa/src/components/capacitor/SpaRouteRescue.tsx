'use client';

/**
 * SpaRouteRescue — fixes dynamic routes in the Capacitor static export.
 *
 * Capacitor's Android WebView serves the ROOT index.html (the landing page
 * shell) for ANY extensionless path it has no file for — verified against
 * Capacitor's WebViewLocalServer.java. So opening or hard-navigating to
 * /profile/jane, /events/<id>, /chat/<id>, etc. boots the *landing* shell at
 * the wrong route, and the user appears to "bounce to /".
 *
 * On native boot, if the current URL is a route the landing shell didn't render
 * (i.e. the rendered route and the address bar disagree), we ask the Next App
 * Router to navigate to the real URL. The router then loads that route's chunks
 * and renders the correct page client-side. Dynamic pages read their real param
 * via resolveDynamicParam() (window.location), since the generated shell's
 * useParams() would otherwise return the "__id" placeholder.
 *
 * Web/PWA build: isNativePlatform() is false -> this renders nothing and does
 * nothing (a real server serves the right route directly).
 */

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isNativePlatform } from '@/lib/platform';

export default function SpaRouteRescue() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isNativePlatform() || typeof window === 'undefined') return;

    const actual = window.location.pathname.replace(/\/+$/, '') || '/';
    const rendered = (pathname || '/').replace(/\/+$/, '') || '/';

    // If the App Router already matched the real URL, nothing to do.
    if (actual === rendered) return;

    // The shell booted at the wrong route (almost always '/'): navigate to the
    // real URL so the correct route renders. Include any query/hash.
    const target = actual + window.location.search + window.location.hash;
    router.replace(target);
    // We intentionally run this only once on mount; subsequent in-app navigation
    // is handled normally by the router.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
