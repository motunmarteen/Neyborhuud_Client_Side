import { describe, expect, it } from 'vitest';
import { translate } from './i18n';

const dict = {
  'x.hello': 'Hello {name}',
  'x.guardians_one': '{count} guardian',
  'x.guardians_other': '{count} guardians',
};

describe('translate', () => {
  it('fills values', () => {
    expect(translate(dict, 'x.hello', { name: 'Ada' })).toBe('Hello Ada');
  });
  it('picks singular or plural from count, with Nigerian number formatting', () => {
    expect(translate(dict, 'x.guardians', { count: 1 })).toBe('1 guardian');
    expect(translate(dict, 'x.guardians', { count: 1200 })).toBe('1,200 guardians');
  });
  it('falls back to English, then to the key', () => {
    expect(translate({}, 'feed.retry')).toBe('Try again');
    expect(translate({}, 'nope.missing')).toBe('nope.missing');
  });
});
