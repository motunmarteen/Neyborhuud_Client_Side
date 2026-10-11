'use client';

import { useEffect, useState } from 'react';

/**
 * True once `src` has really loaded. SVG <image> does not reliably report load
 * errors to React, so avatars check the photo here first and show the initial
 * until it loads (and keep the initial if it never does).
 */
export function useImageOk(src: string | null | undefined): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(false);
    if (!src) return;
    let alive = true;
    const img = new window.Image();
    img.onload = () => alive && setOk(true);
    img.onerror = () => alive && setOk(false);
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return ok;
}
