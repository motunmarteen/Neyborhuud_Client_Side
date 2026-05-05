/**
 * Services Hook
 * Manages service listings, bookings, and reviews with React Query
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { servicesService } from "@/services/services.service";
import { getErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { useAwardCoins } from "@/hooks/useGamification";

export interface ServicesFilter {
  category?: string;
  subcategory?: string;
  minRating?: number;
}

/** Paginated list of services with optional filters */
export function useServices(filter?: ServicesFilter) {
  return useInfiniteQuery({
    queryKey: ["services", "list", filter],
    queryFn: ({ pageParam = 1 }) =>
      servicesService.getServices(pageParam as number, 20, filter),
    getNextPageParam: (lastPage) => {
      const pagination =
        (lastPage as any).pagination || (lastPage as any)?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 60000,
  });
}

/** Single service detail */
export function useService(serviceId: string | null) {
  return useQuery({
    queryKey: ["services", "detail", serviceId],
    queryFn: () => servicesService.getService(serviceId!),
    enabled: !!serviceId,
    staleTime: 30000,
  });
}

/** Service reviews */
export function useServiceReviews(serviceId: string | null) {
  return useInfiniteQuery({
    queryKey: ["services", "reviews", serviceId],
    queryFn: ({ pageParam = 1 }) =>
      servicesService.getReviews(serviceId!, pageParam as number, 20),
    getNextPageParam: (lastPage) => {
      const pagination =
        (lastPage as any).pagination || (lastPage as any)?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!serviceId,
  });
}

/** Current user's bookings */
export function useMyBookings() {
  return useInfiniteQuery({
    queryKey: ["services", "my-bookings"],
    queryFn: ({ pageParam = 1 }) =>
      servicesService.getMyBookings(pageParam as number, 20),
    getNextPageParam: (lastPage) => {
      const pagination =
        (lastPage as any).pagination || (lastPage as any)?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

/** Book a service */
export function useBookService() {
  const queryClient = useQueryClient();
  const awardCoins = useAwardCoins();

  return useMutation({
    mutationFn: ({
      serviceId,
      date,
      notes,
    }: {
      serviceId: string;
      date: string;
      notes?: string;
    }) => servicesService.bookService(serviceId, date, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", "my-bookings"] });
      awardCoins("service_booked");
      toast.success("Booking submitted! Awaiting confirmation.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to book service");
    },
  });
}

/** Cancel a booking */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      servicesService.cancelBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", "my-bookings"] });
      toast.success("Booking cancelled.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to cancel booking");
    },
  });
}

/** Rate a service */
export function useRateService() {
  const queryClient = useQueryClient();
  const awardCoins = useAwardCoins();

  return useMutation({
    mutationFn: ({
      serviceId,
      rating,
      review,
    }: {
      serviceId: string;
      rating: number;
      review?: string;
    }) => servicesService.rateService(serviceId, rating, review),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["services", "detail", variables.serviceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["services", "reviews", variables.serviceId],
      });
      awardCoins("service_rated");
      toast.success("Review submitted!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to submit review");
    },
  });
}

/** Favorite / unfavorite a service */
export function useFavoriteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      serviceId,
      favorited,
    }: {
      serviceId: string;
      favorited: boolean;
    }) =>
      favorited
        ? servicesService.unfavoriteService(serviceId)
        : servicesService.favoriteService(serviceId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["services", "detail", variables.serviceId],
      });
      queryClient.invalidateQueries({ queryKey: ["services", "list"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to update favourite");
    },
  });
}
