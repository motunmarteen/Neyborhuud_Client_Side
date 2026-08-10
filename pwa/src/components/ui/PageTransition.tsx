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
    // An entry animation that starts at opacity:0 makes page content invisible
    // until JS finishes animating it in. If that animation never runs — the
    // animation frame is throttled, framer-motion fails to hydrate, reduced-motion
    // is honoured oddly, whatever — the page renders perfectly and then stays
    // permanently blank, with no console error to explain it. That shipped, and
    // every route except the SKIP_PATHS ones was invisible in production.
    //
    // Content is now visible by default and the fade is a pure enhancement:
    // worst case the animation is skipped and the page simply appears.
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
