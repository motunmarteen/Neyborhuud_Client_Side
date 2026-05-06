"use client";

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { paymentsService } from "@/services/payments.service";

// ── Initiate Payment ────────────────────────────────────────────────────────

export function useInitiatePayment() {
  return useMutation({
    mutationFn: (payload: {
      type:
        | "listing_boost"
        | "premium_subscription"
        | "event_ticket"
        | "marketplace_purchase"
        | "service_payment";
      amount: number;
      currency?: string;
      metadata?: Record<string, any>;
    }) =>
      paymentsService.initiatePayment(
        payload.type,
        payload.amount,
        payload.currency ?? "NGN",
        payload.metadata,
      ),
    onSuccess: (data) => {
      const paymentUrl =
        (data as any)?.data?.paymentUrl ?? (data as any)?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    },
  });
}

// ── Verify Payment ──────────────────────────────────────────────────────────
// disabled until a reference is provided (e.g. from URL ?reference=)

export function useVerifyPayment(reference: string | null) {
  return useQuery({
    queryKey: ["payments", "verify", reference],
    queryFn: async () => {
      const res = await paymentsService.verifyPayment(reference!);
      return (res as any)?.data ?? res;
    },
    enabled: !!reference,
    retry: false,
    staleTime: 0,
  });
}

// ── Payment History ─────────────────────────────────────────────────────────

export function usePaymentHistory() {
  return useInfiniteQuery({
    queryKey: ["payments", "history"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await paymentsService.getPaymentHistory(
        pageParam as number,
        20,
      );
      const raw = (res as any)?.data ?? res;
      return {
        payments: Array.isArray(raw?.payments)
          ? raw.payments
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [],
        total: raw?.total ?? 0,
        page: raw?.page ?? (pageParam as number),
        totalPages: raw?.totalPages ?? 1,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 60_000,
    retry: false,
  });
}
