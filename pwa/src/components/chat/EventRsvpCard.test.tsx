import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ChatMessage } from '@/types/api';

const setRsvp = vi.fn();
const getMyRsvp = vi.fn();
const socketHandlers: Record<string, (data: unknown) => void> = {};

vi.mock('@/services/events.service', () => ({
  eventsService: {
    setRsvp: (...args: unknown[]) => setRsvp(...args),
    getMyRsvp: (...args: unknown[]) => getMyRsvp(...args),
  },
}));

vi.mock('@/lib/socket', () => ({
  default: {
    on: (event: string, cb: (data: unknown) => void) => {
      socketHandlers[event] = cb;
    },
    off: (event: string) => {
      delete socketHandlers[event];
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { EventRsvpCard } from './EventRsvpCard';

const EVENT_ID = '507f1f77bcf86cd799439011';
const ACTOR_ID = '507f1f77bcf86cd799439022';
const VIEWER_ID = '507f1f77bcf86cd799439033';

function makeMsg(overrides: Record<string, unknown> = {}): ChatMessage {
  return {
    id: 'm1',
    conversationId: 'c1',
    senderId: '000000000000000000000000',
    content: 'Ada Obi is going 🎉',
    type: 'system',
    createdAt: new Date().toISOString(),
    meta: {
      rsvpAction: 'going',
      eventId: EVENT_ID,
      eventTitle: 'Street Party',
      eventVenue: 'Main Square',
      actorId: ACTOR_ID,
      actorName: 'Ada Obi',
      goingCount: 3,
      maybeCount: 1,
      ...(overrides.meta as Record<string, unknown>),
    },
    ...overrides,
  } as ChatMessage;
}

describe('EventRsvpCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setRsvp.mockResolvedValue({ data: { counts: { goingCount: 4, maybeCount: 1 } } });
    getMyRsvp.mockResolvedValue({ data: { status: null } });
    Object.keys(socketHandlers).forEach((k) => delete socketHandlers[k]);
  });

  afterEach(() => cleanup());

  it('renders the snapshotted event details without fetching the event', () => {
    render(<EventRsvpCard msg={makeMsg()} currentUserId={ACTOR_ID} />);

    expect(screen.getByText('Street Party')).toBeInTheDocument();
    expect(screen.getByText('Main Square')).toBeInTheDocument();
    expect(screen.getByText('3 going · 1 maybe')).toBeInTheDocument();
  });

  it('offers all three RSVP choices', () => {
    render(<EventRsvpCard msg={makeMsg()} currentUserId={VIEWER_ID} />);

    expect(screen.getByRole('button', { name: /Going/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Maybe/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Can't Go/ })).toBeInTheDocument();
  });

  it('submits the chosen status and updates the live count', async () => {
    render(<EventRsvpCard msg={makeMsg()} currentUserId={VIEWER_ID} />);

    fireEvent.click(screen.getByRole('button', { name: /Going/ }));

    await waitFor(() => expect(setRsvp).toHaveBeenCalledWith(EVENT_ID, 'going'));
    await waitFor(() => expect(screen.getByText('4 going · 1 maybe')).toBeInTheDocument());
  });

  it('stays interactive after answering, so an RSVP can be changed', async () => {
    render(<EventRsvpCard msg={makeMsg()} currentUserId={VIEWER_ID} />);

    fireEvent.click(screen.getByRole('button', { name: /Going/ }));
    await waitFor(() => expect(setRsvp).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Going/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );

    // Unlike the one-way deal cards, an RSVP is changeable — the buttons must
    // NOT latch disabled after the first successful answer.
    setRsvp.mockResolvedValue({ data: { counts: { goingCount: 3, maybeCount: 2 } } });
    fireEvent.click(screen.getByRole('button', { name: /Maybe/ }));

    await waitFor(() => expect(setRsvp).toHaveBeenCalledWith(EVENT_ID, 'maybe'));
    expect(setRsvp).toHaveBeenCalledTimes(2);
  });

  it('applies a live count broadcast for its own event only', async () => {
    render(<EventRsvpCard msg={makeMsg()} currentUserId={VIEWER_ID} />);

    socketHandlers['event:rsvp_update']?.({
      eventId: 'some-other-event',
      goingCount: 99,
      maybeCount: 99,
    });
    await waitFor(() => expect(screen.getByText('3 going · 1 maybe')).toBeInTheDocument());

    socketHandlers['event:rsvp_update']?.({
      eventId: EVENT_ID,
      goingCount: 7,
      maybeCount: 2,
    });
    await waitFor(() => expect(screen.getByText('7 going · 2 maybe')).toBeInTheDocument());
  });

  it('pre-selects the announcer own choice without an extra fetch', () => {
    render(<EventRsvpCard msg={makeMsg()} currentUserId={ACTOR_ID} />);

    expect(screen.getByRole('button', { name: /Going/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(getMyRsvp).not.toHaveBeenCalled();
  });

  it('looks up its own saved answer for a viewer who is not the announcer', async () => {
    getMyRsvp.mockResolvedValue({ data: { status: 'maybe' } });
    render(<EventRsvpCard msg={makeMsg()} currentUserId={VIEWER_ID} />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Maybe/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
  });
});
