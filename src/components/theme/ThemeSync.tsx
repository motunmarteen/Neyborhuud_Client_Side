'use client';

import { useEffect } from 'react';

/**
 * Syncs `html.dark` with the OS colour-scheme preference so CSS tokens
 * (`:root` / `.dark`) and Tailwind `dark:` utilities stay aligned.
 */
export function ThemeSync() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = (matches: boolean) => {
      document.documentElement.classList.toggle('dark', matches);
      document.documentElement.style.colorScheme = matches ? 'dark' : 'light';
    };

    apply(media.matches);

    const onChange = (event: MediaQueryListEvent) => apply(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return null;
}
