import { describe, expect, it } from 'vitest';
import { placeFeedAds } from './feedAds';

const never = () => false;

describe('placeFeedAds', () => {
  it('puts the first ad after the 3rd item, then every 6', () => {
    const slots = placeFeedAds(20, ['a', 'b', 'c', 'd'], never);
    expect([...slots.entries()]).toEqual([
      [2, 'a'],
      [8, 'b'],
      [14, 'c'],
    ]);
  });

  it('shows each ad once and stops when ads run out', () => {
    expect(placeFeedAds(40, ['a'], never).size).toBe(1);
    expect(placeFeedAds(40, [], never).size).toBe(0);
  });

  it('never puts an ad right before or after a safety post', () => {
    const sensitive = new Set([2, 3, 9]);
    const slots = placeFeedAds(20, ['a', 'b'], (i) => sensitive.has(i));
    for (const i of slots.keys()) {
      expect(sensitive.has(i)).toBe(false);
      expect(sensitive.has(i + 1)).toBe(false);
    }
    expect([...slots.keys()]).toEqual([4, 10]);
  });

  it('does not place an ad as the last loaded item', () => {
    expect(placeFeedAds(3, ['a'], never).size).toBe(0);
    expect(placeFeedAds(4, ['a'], never).get(2)).toBe('a');
  });
});
