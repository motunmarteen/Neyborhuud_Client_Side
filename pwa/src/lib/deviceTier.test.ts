import { afterEach, describe, expect, it } from 'vitest';
import { isLowEndDevice } from './deviceTier';

const set = (memory?: number, cores?: number) => {
  Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: memory });
  Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: cores });
};

afterEach(() => set(undefined, 8));

describe('isLowEndDevice (M-16)', () => {
  it('treats 2 GB or less, or 4 cores or fewer, as a cheap phone', () => {
    set(2, 8);
    expect(isLowEndDevice()).toBe(true);
    set(4, 4);
    expect(isLowEndDevice()).toBe(true);
  });
  it('leaves better phones and iPhones (which report nothing) on the full map', () => {
    set(4, 8);
    expect(isLowEndDevice()).toBe(false);
    set(undefined, undefined);
    expect(isLowEndDevice()).toBe(false);
  });
});
