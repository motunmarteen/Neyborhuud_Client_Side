"use client";

/**
 * usePayments — HuudCoin spend hooks
 *
 * All platform transactions are denominated in HuudCoins.
 * There is no fiat gateway.  Transactions are instant (no redirect).
 */

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { paymentsService } from "@/services/payments.service";

// ── Initiate a HuudCoin spend ───────────────────────────────────────────

export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      type:
        | "listing_boost"
        | "job_boost"
        | "service_boost"
        | "event_boost"
        | "tip_user"
        | "event_ticket"
        | "marketplace_pledge"
        | "service_payment";
      amount: number;
      currency?: string;
      metadata?: Record<string, any>;
    }) =>
      paymentsService.initiatePayment(
        payload.type as any,
        payload.amount,
        payload.currency ?? "HuudCoins",
        payload.metadata,
      ),
    onSuccess: (data) => {
      const result = (data as any)?.data ?? data;

      // If a legacy paymentUrl somehow exists, redirect (future-proofing only)
      const paymentUrl = result?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      // Instant HuudCoin transaction — show coin deduction toast
      const coins: number = result?.coinsSpent ?? result?.coins;
      const newBalance: number = result?.newBalance;
      if (coins) {
        toast.success(
          `🪙 ${coins} HuudCoins deducted${newBalance !== undefined ? ` • Balance: ${newBalance}` : ""}`,
        );
      } else {
        toast.success("Transaction complete!");
      }

      // Refresh wallet balance & gamification stats everywhere
      queryClient.invalidateQueries({ queryKey: ["gamification", "wallet"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["payments", "history"] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Transaction failed";
      toast.error(msg);
    },
  });
}

// ── Send a tip to another user ──────────────────────────────────────────

export function useTipUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipientId, amount }: { recipientId: string; amount: number }) =>
      paymentsService.tipUser(recipientId, amount),
    onSuccess: (data, variables) => {
      const result = (data as any)?.data ?? data;
      toast.success(`🎁 ${variables.amount} HuudCoins sent!`);
      queryClient.invalidateQueries({ queryKey: ["gamification", "wallet"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "stats"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? "Tip failed");
    },
  });
}

// ── Verify a payment reference (used by success page) ──────────────────
// disabled until a reference is provided

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

// ── Payment history (infinite) ──────────────────────────────────────────

export function usePaymentHistory() {
  return useInfiniteQuery({
    queryKey: ["payments", "history"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await paymentsService.getPaymentHistory(pageParam as number, 20);
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

// ── Payment stats ───────────────────────────────────────────────────────

export function usePaymentStats() {
  return useQuery({
    queryKey: ["payments", "stats"],
    queryFn: async () => {
      const res = await paymentsService.getPaymentStats();
      return (res as any)?.data ?? res;
    },
    staleTime: 60_000,
  });
}

// ── HuudCoin balance + tier progress ──────────────────────────────────

export function usePaymentBalance() {
  return useQuery({
    queryKey: ["payments", "balance"],
    queryFn: async () => {
      const res = await paymentsService.getBalance();
      return (res as any)?.data ?? res;
    },
    staleTime: 30_000,
  });
}

