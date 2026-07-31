import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import type { ChatMessage } from '@/types/api';

const confirmPayment = vi.fn().mockResolvedValue({ data: {} });
const confirmReceipt = vi.fn().mockResolvedValue({ data: {} });
const markShipped = vi.fn().mockResolvedValue({ data: {} });
const confirmDelivery = vi.fn().mockResolvedValue({ data: {} });
const getOrderPayoutDetails = vi
  .fn()
  .mockResolvedValue({ data: { hasPayoutDetails: false, payoutDetails: null } });

vi.mock('@/services/marketplace.service', () => ({
  marketplaceService: {
    confirmPayment: (...a: unknown[]) => confirmPayment(...a),
    confirmReceipt: (...a: unknown[]) => confirmReceipt(...a),
    markShipped: (...a: unknown[]) => markShipped(...a),
    confirmDelivery: (...a: unknown[]) => confirmDelivery(...a),
    getOrderPayoutDetails: (...a: unknown[]) => getOrderPayoutDetails(...a),
  },
}));

vi.mock('@/services/chat.service', () => ({
  chatService: { uploadChatMedia: vi.fn().mockResolvedValue({ data: { url: 'u' } }) },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { DealStatusCard } from './DealStatusCard';

const BUYER = 'buyer-1';
const SELLER = 'seller-1';

function dealMessage(meta: Record<string, unknown>): ChatMessage {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'system',
    content: 'Deal update',
    type: 'system',
    createdAt: new Date().toISOString(),
    meta: { orderId: 'order-1', buyerId: BUYER, sellerId: SELLER, ...meta },
  } as unknown as ChatMessage;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('DealStatusCard — role-aware actions along the order chain', () => {
  it('shows the buyer the pay action and the inlined bank details on "accepted"', () => {
    render(
      <DealStatusCard
        msg={dealMessage({
          dealAction: 'accepted',
          amount: 500_000,
          payoutDetails: {
            bankName: 'GTBank',
            accountNumber: '0123456789',
            accountName: 'Ada Obi',
          },
        })}
        currentUserId={BUYER}
      />,
    );

    expect(screen.getByText(/GTBank · 0123456789/)).toBeTruthy();
    expect(screen.getByText(/I've Paid/)).toBeTruthy();
    // Inlined details mean no separate round trip.
    expect(getOrderPayoutDetails).not.toHaveBeenCalled();
  });

  it('renders a live countdown for the buyer on "accepted"', () => {
    render(
      <DealStatusCard
        msg={dealMessage({
          dealAction: 'accepted',
          paymentWindowExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })}
        currentUserId={BUYER}
      />,
    );
    expect(screen.getByText('Pay within')).toBeTruthy();
    expect(screen.getByText(/^0[45]:\d{2}$/)).toBeTruthy();
  });

  it('shows an explicit expired state once the window has passed, never a negative timer', () => {
    render(
      <DealStatusCard
        msg={dealMessage({
          dealAction: 'accepted',
          paymentWindowExpiresAt: new Date(Date.now() - 60_000).toISOString(),
        })}
        currentUserId={BUYER}
      />,
    );
    expect(screen.getByText('Payment window closed')).toBeTruthy();
    expect(screen.getByText('Expired')).toBeTruthy();
  });

  it('gives the SELLER no pay button on "accepted"', () => {
    render(
      <DealStatusCard msg={dealMessage({ dealAction: 'accepted' })} currentUserId={SELLER} />,
    );
    expect(screen.queryByText(/I've Paid/)).toBeNull();
  });

  it('offers the seller "Confirm Payment Received" on "paid"', async () => {
    render(<DealStatusCard msg={dealMessage({ dealAction: 'paid' })} currentUserId={SELLER} />);
    const btn = screen.getByText('Confirm Payment Received');
    fireEvent.click(btn);
    await waitFor(() => expect(confirmReceipt).toHaveBeenCalledWith('order-1'));
  });

  it('offers the seller "Mark as Sent" on "paid_confirmed" and sends the tracking number', async () => {
    render(
      <DealStatusCard msg={dealMessage({ dealAction: 'paid_confirmed' })} currentUserId={SELLER} />,
    );
    fireEvent.click(screen.getByText('Mark as Sent'));

    const input = screen.getByPlaceholderText('Tracking number (optional)');
    fireEvent.change(input, { target: { value: 'NG-4471' } });
    fireEvent.click(screen.getByText('Confirm Sent'));

    await waitFor(() =>
      expect(markShipped).toHaveBeenCalledWith('order-1', { trackingNumber: 'NG-4471' }),
    );
  });

  it('gives the BUYER no shipping action on "paid_confirmed"', () => {
    render(
      <DealStatusCard msg={dealMessage({ dealAction: 'paid_confirmed' })} currentUserId={BUYER} />,
    );
    expect(screen.queryByText('Mark as Sent')).toBeNull();
  });

  it('offers the buyer "Confirm Delivery Received" on "shipped" and shows tracking', async () => {
    render(
      <DealStatusCard
        msg={dealMessage({ dealAction: 'shipped', trackingNumber: 'NG-4471' })}
        currentUserId={BUYER}
      />,
    );
    expect(screen.getByText('NG-4471')).toBeTruthy();

    fireEvent.click(screen.getByText('Confirm Delivery Received'));
    await waitFor(() => expect(confirmDelivery).toHaveBeenCalledWith('order-1'));
  });

  it('gives the SELLER no delivery-confirmation action on "shipped"', () => {
    render(
      <DealStatusCard msg={dealMessage({ dealAction: 'shipped' })} currentUserId={SELLER} />,
    );
    expect(screen.queryByText('Confirm Delivery Received')).toBeNull();
  });

  it('shows no action buttons at all once the deal is completed', () => {
    render(
      <DealStatusCard
        msg={dealMessage({ dealAction: 'completed', reward: 10 })}
        currentUserId={BUYER}
      />,
    );
    expect(screen.queryByText(/I've Paid/)).toBeNull();
    expect(screen.queryByText('Confirm Delivery Received')).toBeNull();
    expect(screen.getByText(/\+10 HuudCoins each/)).toBeTruthy();
  });

  it('explains an auto-cancellation caused by the payment window expiring', () => {
    render(
      <DealStatusCard
        msg={dealMessage({ dealAction: 'cancelled', cancelReason: 'payment_window_expired' })}
        currentUserId={BUYER}
      />,
    );
    expect(screen.getByText(/wasn't confirmed in time/i)).toBeTruthy();
  });

  it('disables the card optimistically after an action succeeds', async () => {
    render(<DealStatusCard msg={dealMessage({ dealAction: 'paid' })} currentUserId={SELLER} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Confirm Payment Received'));
    });
    await waitFor(() => expect(screen.queryByText('Confirm Payment Received')).toBeNull());
  });

  it('falls back to fetching payout details for legacy "started" cards', async () => {
    render(<DealStatusCard msg={dealMessage({ dealAction: 'started' })} currentUserId={BUYER} />);
    await waitFor(() => expect(getOrderPayoutDetails).toHaveBeenCalledWith('order-1'));
  });
});
