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

// ── Phase 2 attachment/sharing suite ──────────────────────────────────────

describe('chatService.sendMessage — Phase 2 live location', () => {
  beforeEach(() => {
    postMock.mockClear();
  });

  it('passes isLive + durationMinutes through in locationSnapshot/meta', async () => {
    await chatService.sendMessage({
      conversationId: 'conv-1',
      content: '📍 live',
      type: 'location',
      locationSnapshot: { latitude: 6.5, longitude: 3.3, isLive: true, durationMinutes: 60 },
      meta: { durationMinutes: 60 },
    });
    expect(postMock).toHaveBeenCalledWith(
      '/chat/send',
      expect.objectContaining({
        type: 'location',
        locationSnapshot: expect.objectContaining({ isLive: true, durationMinutes: 60 }),
      }),
    );
  });
});

describe('chatService.votePoll', () => {
  beforeEach(() => {
    postMock.mockClear();
  });

  it('posts a single optionIndex to the vote endpoint', async () => {
    await chatService.votePoll('msg-1', { optionIndex: 2 });
    expect(postMock).toHaveBeenCalledWith('/chat/messages/msg-1/vote', { optionIndex: 2 });
  });

  it('posts optionIndexes for multiple-choice polls', async () => {
    await chatService.votePoll('msg-1', { optionIndexes: [0, 2] });
    expect(postMock).toHaveBeenCalledWith('/chat/messages/msg-1/vote', { optionIndexes: [0, 2] });
  });
});

describe('chatService group calling (Phase 3)', () => {
  beforeEach(() => {
    postMock.mockClear();
    getMock.mockClear();
  });

  it('startCall posts callType to the community-call start endpoint', async () => {
    await chatService.startCall('conv-1', 'video');
    expect(postMock).toHaveBeenCalledWith('/chat/conversations/conv-1/calls', { callType: 'video' });
  });

  it('startCall defaults callType to voice', async () => {
    await chatService.startCall('conv-1');
    expect(postMock).toHaveBeenCalledWith('/chat/conversations/conv-1/calls', { callType: 'voice' });
  });

  it('endCall posts to the per-session end endpoint', async () => {
    await chatService.endCall('conv-1', 'session-1');
    expect(postMock).toHaveBeenCalledWith('/chat/conversations/conv-1/calls/session-1/end');
  });

  it('getActiveCall reads the active-session endpoint', async () => {
    await chatService.getActiveCall('conv-1');
    expect(getMock).toHaveBeenCalledWith('/chat/conversations/conv-1/calls/active');
  });

  it('getGroupCallHistory reads the paginated history endpoint with page/limit query params', async () => {
    await chatService.getGroupCallHistory('conv-1', 2, 10);
    expect(getMock).toHaveBeenCalledWith('/chat/conversations/conv-1/calls/history?page=2&limit=10');
  });

  it('getGroupCallHistory defaults to page 1, limit 20', async () => {
    await chatService.getGroupCallHistory('conv-1');
    expect(getMock).toHaveBeenCalledWith('/chat/conversations/conv-1/calls/history?page=1&limit=20');
  });
});

describe('chatService live location updates', () => {
  beforeEach(() => {
    postMock.mockClear();
  });

  it('updateLiveLocation posts to the per-message location endpoint', async () => {
    await chatService.updateLiveLocation('msg-1', { latitude: 6.5, longitude: 3.3, address: 'Ikeja' });
    expect(postMock).toHaveBeenCalledWith('/chat/messages/msg-1/location', {
      latitude: 6.5,
      longitude: 3.3,
      address: 'Ikeja',
    });
  });

  it('stopLiveLocation posts to the stop endpoint with no body', async () => {
    await chatService.stopLiveLocation('msg-1');
    expect(postMock).toHaveBeenCalledWith('/chat/messages/msg-1/location/stop');
  });
});
