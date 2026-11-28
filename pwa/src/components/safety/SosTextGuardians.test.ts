import { describe, expect, it } from 'vitest';
import { intlPhone, smsHref, sosTextBody } from './SosTextGuardians';

describe('Text my guardians (free SMS from your own phone)', () => {
  it('turns Nigerian numbers into +234 form', () => {
    expect(intlPhone('0803 123 4567')).toBe('+2348031234567');
    expect(intlPhone('+2348031234567')).toBe('+2348031234567');
    expect(intlPhone('2349031234567')).toBe('+2349031234567');
    expect(intlPhone('12')).toBeNull();
  });

  it('builds the SMS link Android and iPhone each understand', () => {
    const phones = ['+2348031234567', '+2349031234567'];
    expect(smsHref(phones, 'Help me', 'Mozilla/5.0 (Linux; Android 13)')).toBe('sms:+2348031234567,+2349031234567?body=Help%20me');
    expect(smsHref(phones, 'Help me', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe(
      'sms:/open?addresses=+2348031234567,+2349031234567&body=Help%20me',
    );
  });

  it('opens a blank message when no guardian has a number', () => {
    expect(smsHref([], 'Help me', 'Mozilla/5.0 (Linux; Android 13)')).toBe('sms:?body=Help%20me');
    expect(smsHref([], 'Help me', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe('sms:&body=Help%20me');
  });

  it('puts the map link and 112 in the message', () => {
    const body = sosTextBody(6.538912, 3.384421);
    expect(body).toContain('https://maps.google.com/?q=6.53891,3.38442');
    expect(body).toContain('call 112');
    expect(sosTextBody()).not.toContain('maps.google.com');
  });
});
