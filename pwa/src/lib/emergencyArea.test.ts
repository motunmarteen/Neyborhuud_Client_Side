import { describe, expect, it } from 'vitest';
import { isInMyArea } from './emergencyArea';

describe('emergency toast only in my area', () => {
  const ikeja = { location: { lga: 'Ikeja', state: 'Lagos' } };
  it('same LGA rings', () => {
    expect(isInMyArea({ lga: 'Ikeja LGA', state: 'Lagos State' }, ikeja)).toBe(true);
  });
  it('another LGA in the same state does not', () => {
    expect(isInMyArea({ lga: 'Surulere', state: 'Lagos' }, ikeja)).toBe(false);
  });
  it('same LGA name in another state does not', () => {
    expect(isInMyArea({ lga: 'Ikeja', state: 'Ogun' }, ikeja)).toBe(false);
  });
  it('another state does not', () => {
    expect(isInMyArea({ lga: 'Kano Municipal', state: 'Kano' }, ikeja)).toBe(false);
  });
  it('state-only post rings people in that state', () => {
    expect(isInMyArea({ state: 'Lagos' }, ikeja)).toBe(true);
    expect(isInMyArea({ state: 'Kano' }, ikeja)).toBe(false);
  });
  it('unknown area or signed out never rings', () => {
    expect(isInMyArea({}, ikeja)).toBe(false);
    expect(isInMyArea({ lga: 'Ikeja' }, null)).toBe(false);
    expect(isInMyArea({ lga: 'Ikeja' }, { lga: 'Ikeja' })).toBe(true);
  });
});
