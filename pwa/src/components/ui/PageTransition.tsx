'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

const SKIP_PATHS = new Set(['/feed', '/']);

function shouldSkipTransition(pathname: string) {
  if (SKIP_PATHS.has(pathname)) return true;
  if (pathname === '/chat' || pathname.startsWith('/chat/')) return true;
  return false;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const skip = shouldSkipTransition(pathname);

    if (skip) {
        return <>{children}</>;
    }

    // NOTE: deliberately NOT `initial={{ opacity: 0 }}`.
    //
    // Server-rendered markup carried `opacity:0` inline, so page content stayed
    // invisible until framer-motion hydrated and animated it in. On a slow
    // connection (or a slow device) that's a visible blank-page window on every
    // route except the SKIP_PATHS ones — the DOM is fully rendered underneath
    // the whole time, with no error to explain the blankness.
    //
    // `initial={false}` makes content visible immediately and leaves the fade as
    // a pure enhancement, so however long hydration takes, the page is never
    // hidden waiting for JS.
    return (
        <motion.div
            key={pathname}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="min-h-0"
        >
            {children}
        </motion.div>
    );
}
