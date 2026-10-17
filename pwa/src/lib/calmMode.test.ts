import { afterEach, describe, expect, it } from 'vitest';
import { slowNetworkOn } from './calmMode';

const setNet = (effectiveType?: string) =>
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: effectiveType ? { effectiveType, addEventListener() {} } : undefined,
  });

afterEach(() => {
  setNet();
  localStorage.clear();
});

describe('low-data mode on slow networks (M-15)', () => {
  it('turns on by itself on 2G', () => {
    setNet('2g');
    expect(slowNetworkOn()).toBe(true);
    setNet('slow-2g');
    expect(slowNetworkOn()).toBe(true);
  });

  it('stays off on 3G, 4G and when the browser does not say', () => {
    setNet('3g');
    expect(slowNetworkOn()).toBe(false);
    setNet('4g');
    expect(slowNetworkOn()).toBe(false);
    setNet();
    expect(slowNetworkOn()).toBe(false);
  });

  it('respects someone who chose Live view on purpose', () => {
    setNet('2g');
    localStorage.setItem('neyborhuud_save_data', '0');
    expect(slowNetworkOn()).toBe(false);
  });
});
