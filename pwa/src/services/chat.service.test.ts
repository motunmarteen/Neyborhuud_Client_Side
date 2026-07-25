import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * chat.service.ts pagination/report/delete-for-me changes (audit finding
 * #23/#24/#26 pagination mismatch, #9/#16 report message, #18/#26 delete-for-me).
 * Verifies the request PARAMS the service builds match what the backend
 * actually reads (before/offset — never `page`), and that the new
 * reportMessage/deleteMessage(deleteForEveryone) calls hit the right
 * endpoints with the right bodies.
 */

const getMock = vi.fn().mockResolvedValue({ data: {} });
const postMock = vi.fn().mockResolvedValue({ data: {} });
const deleteMock = vi.fn().mockResolvedValue({ data: {} });

vi.mock('@/lib/api-client', () => ({
  default: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

vi.mock('@/lib/idempotency', () => ({
  newIdempotencyKey: () => 'test-idempotency-key',
}));

import { chatService } from './chat.service';

describe('chatService pagination params', () => {
  beforeEach(() => {
    getMock.mockClear();
    postMock.mockClear();
    deleteMock.mockClear();
  });

  it('getConversations sends `limit` and, when provided, `before` — never `page`', async () => {
    await chatService.getConversations({ limit: 20, before: '2026-01-01T00:00:00.000Z' });
    expect(getMock).toHaveBeenCalledWith(
      '/chat/conversations',
      { params: { limit: 20, before: '2026-01-01T00:00:00.000Z' } },
    );
    const [, config] = getMock.mock.calls[0];
    expect((config as { params: Record<string, unknown> }).params).not.toHaveProperty('page');
  });

  it('getConversations omits `before` entirely when not provided (first page)', async () => {
    await chatService.getConversations();
    expect(getMock).toHaveBeenCalledWith('/chat/conversations', { params: { limit: 20 } });
  });

  it('getMessages sends `limit` and `before` — never `page`', async () => {
    await chatService.getMessages('conv-1', { limit: 50, before: '2026-01-01T00:00:00.000Z' });
    expect(getMock).toHaveBeenCalledWith(
      '/chat/messages/conv-1',
      { params: { limit: 50, before: '2026-01-01T00:00:00.000Z' } },
    );
  });

  it('getMessages defaults to limit 50 with no `before` on first load', async () => {
    await chatService.getMessages('conv-1');
    expect(getMock).toHaveBeenCalledWith('/chat/messages/conv-1', { params: { limit: 50 } });
  });
});

describe('chatService.deleteMessage (delete-for-me, audit finding #18/#26)', () => {
  beforeEach(() => {
    deleteMock.mockClear();
  });

  it('defaults to deleteForEveryone: false (personal "delete for me")', async () => {
    await chatService.deleteMessage('msg-1');
    expect(deleteMock).toHaveBeenCalledWith('/chat/messages/msg-1', {
      data: { deleteForEveryone: false },
    });
  });

  it('passes deleteForEveryone: true when explicitly requested', async () => {
    await chatService.deleteMessage('msg-1', true);
    expect(deleteMock).toHaveBeenCalledWith('/chat/messages/msg-1', {
      data: { deleteForEveryone: true },
    });
  });
});

describe('chatService.reportMessage (audit finding #9/#16)', () => {
  beforeEach(() => {
    postMock.mockClear();
  });

  it('posts reason and description to the message-report endpoint', async () => {
    await chatService.reportMessage('msg-1', 'harassment', 'threatening language');
    expect(postMock).toHaveBeenCalledWith('/chat/messages/msg-1/report', {
      reason: 'harassment',
      description: 'threatening language',
    });
  });
});

describe('chatService.sendMessage replyTo (audit finding #6)', () => {
  beforeEach(() => {
    postMock.mockClear();
  });

  it('includes replyTo in the request body when provided', async () => {
    await chatService.sendMessage({ conversationId: 'conv-1', content: 'hi', replyTo: 'msg-0' });
    expect(postMock).toHaveBeenCalledWith(
      '/chat/send',
      expect.objectContaining({ conversationId: 'conv-1', content: 'hi', replyTo: 'msg-0' }),
    );
  });
});
