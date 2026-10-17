/**
 * Low-end phones (M-16, target: a ₦60,000 Android). Browsers report memory (rounded down,
 * so a 3 GB phone says 2) and processor cores; 2 GB or less, or 4 cores or fewer, gets the
 * lighter map: fewer 3D buildings and figures, lower drawing resolution. iPhones report
 * neither, and count as not low-end.
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;
  return (typeof memory === 'number' && memory <= 2) || (typeof cores === 'number' && cores > 0 && cores <= 4);
}
