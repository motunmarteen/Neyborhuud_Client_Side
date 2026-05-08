/**
 * Payments Service — HuudCoin Economy
 *
 * No fiat payments.  All platform features are powered by HuudCoins
 * earned through activity.  Real-money P2P trades happen off-platform.
 */

import apiClient from "@/lib/api-client";
import { Payment, PaginatedResponse } from "@/types/api";

export const paymentsService = {
  /**
   * Initiate a HuudCoin spend for a platform feature.
   * Returns { reference, status, coinsSpent, newBalance, description } — NO paymentUrl.
   */
  async initiatePayment(
    type:
      | "listing_boost"
      | "job_boost"
      | "service_boost"
      | "event_boost"
      | "tip_user"
      | "event_ticket"
      | "marketplace_pledge"
      | "service_payment",
    amount: number,
    currency = "HuudCoins",
    metadata?: Record<string, any>,
  ) {
    return await apiClient.post<{
      reference: string;
      status: string;
      coinsSpent: number;
      newBalance: number;
      description: string;
    }>("/payments/initiate", { type, amount, currency, metadata });
  },

  /**
   * Send a tip in HuudCoins to another user.
   */
  async tipUser(recipientId: string, amount: number) {
    return await apiClient.post<{ reference: string; coinsSpent: number; status: string }>(
      `/payments/tip/${recipientId}`,
      { amount },
    );
  },

  /**
   * Verify a HuudCoin payment by its reference string.
   */
  async verifyPayment(reference: string) {
    return await apiClient.get<Payment>(`/payments/verify/${reference}`);
  },

  /**
   * Get paginated spend history.
   */
  async getPaymentHistory(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Payment>>("/payments/history", {
      params: { page, limit },
    });
  },

  /**
   * Get a single payment record by id.
   */
  async getPayment(paymentId: string) {
    return await apiClient.get<Payment>(`/payments/${paymentId}`);
  },

  /**
   * Request a coin refund for a payment.
   */
  async requestRefund(paymentId: string, reason: string) {
    return await apiClient.post(`/payments/${paymentId}/refund`, { reason });
  },

  /**
   * Aggregate spend stats.
   */
  async getPaymentStats() {
    return await apiClient.get("/payments/stats");
  },

  /**
   * Get current HuudCoin balance + tier progress.
   */
  async getBalance() {
    return await apiClient.get<{
      balance: number;
      trustScore: number;
      nextTier: { name: string; required: number; remaining: number } | null;
      tierThresholds: Record<string, number>;
      boostCosts: Record<string, Record<number, number>>;
    }>("/payments/balance");
  },
};

