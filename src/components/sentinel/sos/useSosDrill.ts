'use client';

import { useEffect, useState } from 'react';

/** Client-only SOS countdown practice — never hits the backend. */
export function useSosDrill() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, seconds]);

  const start = (count = 5) => {
    setSeconds(count);
    setRunning(true);
  };

  const stop = () => {
    setRunning(false);
    setSeconds(0);
  };

  return { running, seconds, start, stop };
}
