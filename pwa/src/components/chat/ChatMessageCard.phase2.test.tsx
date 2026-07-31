import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ChatMessage } from '@/types/api';

// ── Mocks for heavy/unrelated dependencies ──────────────────────────────────
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt ?? ''} src={props.src} />;
  },
}));

vi.mock('@/components/ui/InteractiveMap', () => ({
  InteractiveMap: () => <div data-testid="mock-map" />,
}));

vi.mock('@/components/chat/MessageReactions', () => ({
  MessageReactions: () => null,
}));

vi.mock('@/components/chat/MessageActionSheet', () => ({
  MessageActionSheet: () => null,
}));

vi.mock('@/components/chat/OfferCard', () => ({ OfferCard: () => null }));
vi.mock('@/components/chat/DealStatusCard', () => ({ DealStatusCard: () => null }));

const votePollMock = vi.fn().mockResolvedValue({ data: {} });
const stopLiveLocationMock = vi.fn().mockResolvedValue({ data: {} });
vi.mock('@/services/chat.service', () => ({
  chatService: {
    votePoll: (...args: unknown[]) => votePollMock(...args),
    stopLiveLocation: (...args: unknown[]) => stopLiveLocationMock(...args),
  },
}));

const socketHandlers: Record<string, ((data: unknown) => void)[]> = {};
vi.mock('@/lib/socket', () => ({
  default: {
    on: (event: string, cb: (data: unknown) => void) => {
      socketHandlers[event] = socketHandlers[event] || [];
      socketHandlers[event].push(cb);
    },
    off: (event: string, cb: (data: unknown) => void) => {
      socketHandlers[event] = (socketHandlers[event] || []).filter((h) => h !== cb);
    },
  },
}));

function emit(event: string, data: unknown) {
  (socketHandlers[event] || []).forEach((cb) => cb(data));
}

import ChatMessageCard from './ChatMessageCard';

function baseMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'hello',
    type: 'text',
    isEdited: false,
    isDeleted: false,
    priority: 'normal',
    status: 'sent',
    createdAt: new Date().toISOString(),
    ...overrides,
  } as ChatMessage;
}

describe('ChatMessageCard — Phase 2 rich cards', () => {
  beforeEach(() => {
    votePollMock.mockClear();
    stopLiveLocationMock.mockClear();
    Object.keys(socketHandlers).forEach((k) => delete socketHandlers[k]);
  });
  afterEach(() => {
    cleanup();
  });

  it('renders a poll with live vote percentages and casts a single-choice vote on tap', async () => {
    const msg = baseMessage({
      type: 'poll',
      meta: {
        question: 'Pizza or burgers?',
        options: ['Pizza', 'Burgers'],
        allowMultiple: false,
        votes: { '0': { count: 1, userIds: ['someone-else'] } },
      },
    });

    render(<ChatMessageCard msg={msg} mine={false} currentUserId="me" />);

    expect(screen.getByText('Pizza or burgers?')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument(); // 1/1 votes so far

    fireEvent.click(screen.getByText('Burgers'));

    await waitFor(() => {
      expect(votePollMock).toHaveBeenCalledWith('msg-1', { optionIndex: 1 });
    });
  });

  it('updates poll results live when a poll:vote socket event arrives', async () => {
    const msg = baseMessage({
      type: 'poll',
      meta: { question: 'Q', options: ['A', 'B'], votes: {} },
    });
    render(<ChatMessageCard msg={msg} mine={false} currentUserId="me" />);

    expect(screen.getByText('0 votes')).toBeInTheDocument();

    emit('poll:vote', { messageId: 'msg-1', results: { '0': { count: 3, userIds: ['a', 'b', 'c'] } } });

    await waitFor(() => {
      expect(screen.getByText('3 votes')).toBeInTheDocument();
    });
  });

  it('ignores poll:vote events for a different message', async () => {
    const msg = baseMessage({
      type: 'poll',
      meta: { question: 'Q', options: ['A', 'B'], votes: {} },
    });
    render(<ChatMessageCard msg={msg} mine={false} currentUserId="me" />);

    emit('poll:vote', { messageId: 'some-other-message', results: { '0': { count: 5, userIds: [] } } });

    // Should remain at 0 — the event was for a different message
    expect(screen.getByText('0 votes')).toBeInTheDocument();
  });

  it('sends optionIndexes (array) for a multiple-choice poll vote', async () => {
    const msg = baseMessage({
      type: 'poll',
      meta: { question: 'Pick toppings', options: ['Cheese', 'Pepperoni'], allowMultiple: true, votes: {} },
    });
    render(<ChatMessageCard msg={msg} mine={false} currentUserId="me" />);

    fireEvent.click(screen.getByText('Cheese'));
    await waitFor(() => {
      expect(votePollMock).toHaveBeenCalledWith('msg-1', { optionIndexes: [0] });
    });
  });

  it('renders a contact_share card with name/username and links to the profile', () => {
    const msg = baseMessage({
      type: 'contact_share',
      meta: { userId: 'u1', name: 'Jane Doe', username: 'janedoe', avatarUrl: null },
    });
    render(<ChatMessageCard msg={msg} mine={false} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('@janedoe')).toBeInTheDocument();
    const link = screen.getByText('Jane Doe').closest('a');
    expect(link).toHaveAttribute('href', '/profile/janedoe');
  });

  it('renders a product_share card with formatted price and links to the product page', () => {
    const msg = baseMessage({
      type: 'product_share',
      meta: { productId: 'p1', title: 'iPhone 13', price: 50000000, currency: 'NGN', thumbnail: null },
    });
    render(<ChatMessageCard msg={msg} mine={false} />);
    expect(screen.getByText('iPhone 13')).toBeInTheDocument();
    const link = screen.getByText('iPhone 13').closest('a');
    expect(link).toHaveAttribute('href', '/marketplace/p1');
  });

  it('renders an event_share card linking to the event page', () => {
    const msg = baseMessage({
      type: 'event_share',
      meta: { eventId: 'e1', title: 'Block Party', startDate: '2026-08-01T18:00:00.000Z' },
    });
    render(<ChatMessageCard msg={msg} mine={false} />);
    expect(screen.getByText('Block Party').closest('a')).toHaveAttribute('href', '/events/e1');
  });

  it('renders a job_share card linking to the job page', () => {
    const msg = baseMessage({
      type: 'job_share',
      meta: { jobId: 'j1', title: 'Security Guard', workMode: 'on-site' },
    });
    render(<ChatMessageCard msg={msg} mine={false} />);
    expect(screen.getByText('Security Guard').closest('a')).toHaveAttribute('href', '/jobs/j1');
  });

  it('renders a post_share card with a best-effort feed deep link', () => {
    const msg = baseMessage({
      type: 'post_share',
      meta: { postId: 'post1', snippet: 'Community cleanup this weekend', authorName: 'Ada Obi' },
    });
    render(<ChatMessageCard msg={msg} mine={false} />);
    expect(screen.getByText('Community cleanup this weekend').closest('a')).toHaveAttribute(
      'href',
      '/feed?highlight=post1',
    );
  });

  it('renders a trip_share card with origin/destination/status', () => {
    const msg = baseMessage({
      type: 'trip_share',
      meta: { tripId: 't1', status: 'active', origin: 'Home', destination: 'Work' },
    });
    render(<ChatMessageCard msg={msg} mine={false} />);
    expect(screen.getByText('Home → Work')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders an emergency_share card with type/severity', () => {
    const msg = baseMessage({
      type: 'emergency_share',
      meta: { emergencyId: 'em1', type: 'accident', severity: 'high', status: 'active' },
    });
    render(<ChatMessageCard msg={msg} mine={false} />);
    expect(screen.getByText('accident')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('renders a document bubble with filename, extension badge, and formatted size', () => {
    const msg = baseMessage({
      type: 'document',
      content: 'report.pdf',
      mediaUrl: 'https://cdn/report.pdf',
      fileName: 'report.pdf',
      fileSize: 2_400_000,
    });
    render(<ChatMessageCard msg={msg} mine={false} />);
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText(/PDF/)).toBeInTheDocument();
    expect(screen.getByText(/2\.3 MB/)).toBeInTheDocument();
  });

  it('renders a live location card with a LIVE badge and a Stop Sharing button for the sender', () => {
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const msg = baseMessage({
      type: 'location',
      senderId: 'me',
      locationSnapshot: { latitude: 6.5, longitude: 3.3, isLive: true, expiresAt: futureExpiry },
    });
    render(<ChatMessageCard msg={msg} mine currentUserId="me" />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    const stopBtn = screen.getByText('Stop Sharing');
    fireEvent.click(stopBtn);
  });

  it('does not show a Stop Sharing button for a live location shared by someone else', () => {
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const msg = baseMessage({
      type: 'location',
      senderId: 'other-user',
      locationSnapshot: { latitude: 6.5, longitude: 3.3, isLive: true, expiresAt: futureExpiry },
    });
    render(<ChatMessageCard msg={msg} mine={false} currentUserId="me" />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.queryByText('Stop Sharing')).not.toBeInTheDocument();
  });

  it('shows "Sharing ended" instead of LIVE once a live location share has expired', () => {
    const pastExpiry = new Date(Date.now() - 60 * 1000).toISOString();
    const msg = baseMessage({
      type: 'location',
      senderId: 'me',
      locationSnapshot: { latitude: 6.5, longitude: 3.3, isLive: true, expiresAt: pastExpiry },
    });
    render(<ChatMessageCard msg={msg} mine currentUserId="me" />);
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
    expect(screen.getByText('Sharing ended')).toBeInTheDocument();
  });

  it('renders a plain static location card (not live) with a map preview and Open in Maps link', () => {
    const msg = baseMessage({
      type: 'location',
      locationSnapshot: { latitude: 6.5, longitude: 3.3, address: 'Ikeja' },
    });
    render(<ChatMessageCard msg={msg} mine={false} />);
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
    expect(screen.getByText('Open in Maps →')).toBeInTheDocument();
  });

  // The server auto-creates this card during an SOS (ChatService.postLocationUpdate).
  // It must render as a real live card, visually distinct from a casual share so a
  // guardian scanning the thread can't confuse the two.
  it('renders an SOS-auto-shared location as an urgent "Emergency Live Location" card', () => {
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const msg = baseMessage({
      type: 'location',
      senderId: 'victim',
      priority: 'emergency',
      locationSnapshot: { latitude: 6.5, longitude: 3.3, isLive: true, expiresAt: futureExpiry },
      meta: { incidentLive: true, emergencyId: 'emg-1' },
    });
    render(<ChatMessageCard msg={msg} mine={false} currentUserId="guardian" />);
    expect(screen.getByText('Emergency Live Location')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
  });

  it('updates the incident card in place from a message:location_update socket event', async () => {
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const msg = baseMessage({
      type: 'location',
      senderId: 'victim',
      locationSnapshot: { latitude: 6.5, longitude: 3.3, isLive: true, expiresAt: futureExpiry },
      meta: { incidentLive: true, emergencyId: 'emg-1' },
    });
    render(<ChatMessageCard msg={msg} mine={false} currentUserId="guardian" />);
    expect(screen.getByText('6.50000, 3.30000')).toBeInTheDocument();

    emit('message:location_update', {
      messageId: 'msg-1',
      locationSnapshot: { latitude: 7.1, longitude: 3.9, isLive: true, expiresAt: futureExpiry },
    });

    await waitFor(() => {
      expect(screen.getByText('7.10000, 3.90000')).toBeInTheDocument();
    });
  });

  it('shows "Sharing stopped" on the incident card when the SOS resolves', async () => {
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const msg = baseMessage({
      type: 'location',
      senderId: 'victim',
      locationSnapshot: { latitude: 6.5, longitude: 3.3, isLive: true, expiresAt: futureExpiry },
      meta: { incidentLive: true, emergencyId: 'emg-1' },
    });
    render(<ChatMessageCard msg={msg} mine={false} currentUserId="guardian" />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();

    emit('message:location_stopped', { messageId: 'msg-1' });

    await waitFor(() => {
      expect(screen.getByText('Sharing stopped')).toBeInTheDocument();
    });
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });
});
