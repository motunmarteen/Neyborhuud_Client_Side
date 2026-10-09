import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '@/types/api';
import {
  canDeleteForEveryone,
  canEditMessage,
  canForwardMessage,
  DELETE_FOR_EVERYONE_WINDOW_MS,
  EDIT_WINDOW_MS,
  forwardLabel,
  maxForwardTargets,
} from './chatMessageRules';

function msg(over: Partial<ChatMessage> = {}, ageMs = 60_000): ChatMessage {
  return {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'u1',
    type: 'text',
    content: 'hello',
    isEdited: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - ageMs).toISOString(),
    ...over,
  } as ChatMessage;
}

describe('canEditMessage', () => {
  it('allows my own recent text message', () => {
    expect(canEditMessage(msg(), true)).toBe(true);
  });
  it.each([
    ['someone else', msg(), false],
    ['too old', msg({}, EDIT_WINDOW_MS + 1000), true],
    ['not text', msg({ type: 'image' }), true],
    ['deleted', msg({ isDeleted: true }), true],
    ['encrypted', msg({ e2ee: true }), true],
    ['forwarded', msg({ isForwarded: true }), true],
    ['still sending', msg({ id: 'temp-123' }), true],
  ])('refuses when %s', (_label, m, mine) => {
    expect(canEditMessage(m, mine)).toBe(false);
  });
});

describe('canDeleteForEveryone', () => {
  it('lets the sender delete within 48 hours', () => {
    expect(canDeleteForEveryone(msg(), true)).toBe(true);
    expect(canDeleteForEveryone(msg({}, DELETE_FOR_EVERYONE_WINDOW_MS + 1000), true)).toBe(false);
  });
  it('lets moderators delete anyone’s message, at any age', () => {
    expect(canDeleteForEveryone(msg({}, DELETE_FOR_EVERYONE_WINDOW_MS * 3), false, true)).toBe(true);
    expect(canDeleteForEveryone(msg(), false, false)).toBe(false);
  });
  it.each(['sos', 'system', 'tracking', 'poll', 'trip_share'])('never offers it for protected %s messages', (type) => {
    expect(canDeleteForEveryone(msg({ type: type as ChatMessage['type'] }), true, true)).toBe(false);
  });
});

describe('forwarding', () => {
  it('allows ordinary content and refuses safety/e2ee/deleted messages', () => {
    expect(canForwardMessage(msg())).toBe(true);
    expect(canForwardMessage(msg({ type: 'image' }))).toBe(true);
    expect(canForwardMessage(msg({ type: 'sos' }))).toBe(false);
    expect(canForwardMessage(msg({ e2ee: true }))).toBe(false);
    expect(canForwardMessage(msg({ isDeleted: true }))).toBe(false);
  });
  it('limits frequently forwarded messages to one chat at a time', () => {
    expect(maxForwardTargets(msg())).toBe(5);
    expect(maxForwardTargets(msg({ isForwarded: true, forwardCount: 4 }))).toBe(5);
    expect(maxForwardTargets(msg({ isForwarded: true, forwardCount: 5 }))).toBe(1);
  });
  it('labels forwarded messages', () => {
    expect(forwardLabel(msg())).toBeNull();
    expect(forwardLabel(msg({ isForwarded: true, forwardCount: 1 }))).toBe('Forwarded');
    expect(forwardLabel(msg({ isForwarded: true, forwardCount: 7 }))).toBe('Forwarded many times');
  });
});
