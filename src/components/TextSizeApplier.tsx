'use client';

import { useEffect } from 'react';

const SIZE_CLASS: Record<string, string> = {
  small: 'text-size-sm',
  medium: '',
  large: 'text-size-lg',
};

export default function TextSizeApplier() {
  useEffect(() => {
    const stored = localStorage.getItem('neyborhuud_user');
    if (!stored) return;
    try {
      const user = JSON.parse(stored);
      const size: string = user?.settings?.accessibility?.textSize ?? 'medium';
      const cls = SIZE_CLASS[size] ?? '';

      // Remove any existing size class, then add the new one
      document.body.classList.remove('text-size-sm', 'text-size-lg');
      if (cls) document.body.classList.add(cls);
    } catch { /* ignore */ }
  }, []);

  return null;
}
