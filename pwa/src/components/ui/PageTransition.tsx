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

    return (
        <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="min-h-0"
        >
            {children}
        </motion.div>
    );
}
