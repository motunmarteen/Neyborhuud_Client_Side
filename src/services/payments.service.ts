/**
 * Payments Service
 * Handles payment initialization and verification
 */

import apiClient from "@/lib/api-client";
import { Payment, PaginatedResponse } from "@/types/api";

export const paymentsService = {
  /**
   * Initiate a payment
   */
  async initiatePayment(
    type:
      | "listing_boost"
      | "premium_subscription"
      | "event_ticket"
      | "marketplace_purchase"
      | "service_payment",
    amount: number,
    currency = "NGN",
    metadata?: Record<string, any>,
  ) {
    return await apiClient.post<{ paymentUrl: string; reference: string }>(
      "/payments/initiate",
      {
        type,
        amount,
        currency,
        metadata,
      },
    );
  },

  /**
   * Verify a payment
   */
  async verifyPayment(reference: string) {
    return await apiClient.get<Payment>(`/payments/verify/${reference}`);
  },

  /**
   * Get payment history
   */
  async getPaymentHistory(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Payment>>(
      "/payments/history",
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Get payment details
   */
  async getPayment(paymentId: string) {
    return await apiClient.get<Payment>(`/payments/${paymentId}`);
  },

  /**
   * Request refund
   */
  async requestRefund(paymentId: string, reason: string) {
    return await apiClient.post(`/payments/${paymentId}/refund`, { reason });
  },

  /**
   * Get payment statistics
   */
  async getPaymentStats() {
    return await apiClient.get("/payments/stats");
  },
};
