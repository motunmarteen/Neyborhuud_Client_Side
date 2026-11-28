import { describe, expect, it } from 'vitest';
import { guardianInviteText } from './GuardianInviteCard';

describe('guardian invite message', () => {
  it('names the person, links sign-up and says how to connect', () => {
    const t = guardianInviteText('Ada', 'ada_k');
    expect(t).toContain("It's Ada.");
    expect(t).toContain('https://app.neyborhuud.com/signup');
    expect(t).toContain('@ada_k');
    expect(t).toMatch(/SOS/);
  });
  it('still reads well without a name or username', () => {
    const t = guardianInviteText(undefined, undefined);
    expect(t.startsWith("I'd like you")).toBe(true);
    expect(t).not.toContain('@');
  });
});
