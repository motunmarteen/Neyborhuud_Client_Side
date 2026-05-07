/**
 * Events Hook
 * Manages events, attendance, and creation with React Query
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { eventsService } from "@/services/events.service";
import { getErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAwardCoins } from "@/hooks/useGamification";

export interface EventsFilter {
  type?: string;
  date?: string;
  status?: string;
}

/** Paginated list of events with optional filters */
export function useEvents(filter?: EventsFilter) {
  return useInfiniteQuery({
    queryKey: ["events", "list", filter],
    queryFn: ({ pageParam = 1 }) =>
      eventsService.getEvents(pageParam as number, 20, filter),
    getNextPageParam: (lastPage) => {
      const pagination = (lastPage as any)?.data?.pagination ?? (lastPage as any)?.pagination;
      if (!pagination) return undefined;
      const { page, pages } = pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 60000,
  });
}

/** Events organized by a specific user (for profile pages) */
export function useUserEvents(userId: string | null, limit = 6) {
  return useQuery({
    queryKey: ["events", "user", userId, limit],
    queryFn: async () => {
      const res = await eventsService.getEvents(1, limit, { organizerId: userId! });
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      const items = data?.content ?? data?.events ?? data?.data ?? data ?? [];
      return Array.isArray(items) ? items : [];
    },
    enabled: !!userId,
    staleTime: 60000,
    retry: false,
  });
}

/** Single event by id */
export function useEvent(eventId: string | null) {
  return useQuery({
    queryKey: ["events", "detail", eventId],
    queryFn: () => eventsService.getEvent(eventId!),
    enabled: !!eventId,
    staleTime: 30000,
  });
}

/** Events the current user is attending */
export function useMyEvents() {
  return useInfiniteQuery({
    queryKey: ["events", "my-events"],
    queryFn: ({ pageParam = 1 }) =>
      eventsService.getMyEvents(pageParam as number, 20),
    getNextPageParam: (lastPage) => {
      const pagination = (lastPage as any)?.data?.pagination ?? (lastPage as any)?.pagination;
      if (!pagination) return undefined;
      const { page, pages } = pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

/** Events the current user organized */
export function useMyOrganizedEvents() {
  return useInfiniteQuery({
    queryKey: ["events", "organized"],
    queryFn: ({ pageParam = 1 }) =>
      eventsService.getMyOrganizedEvents(pageParam as number, 20),
    getNextPageParam: (lastPage) => {
      const pagination = (lastPage as any)?.data?.pagination ?? (lastPage as any)?.pagination;
      if (!pagination) return undefined;
      const { page, pages } = pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

/** Attendees list for an event */
export function useEventAttendees(eventId: string | null) {
  return useQuery({
    queryKey: ["events", "attendees", eventId],
    queryFn: () => eventsService.getAttendees(eventId!, 1, 50),
    enabled: !!eventId,
    staleTime: 30000,
  });
}

/** RSVP to an event or un-RSVP */
export function useAttendEvent() {
  const queryClient = useQueryClient();
  const awardCoins = useAwardCoins();

  return useMutation({
    mutationFn: ({ eventId, attending }: { eventId: string; attending: boolean }) =>
      attending
        ? eventsService.unattendEvent(eventId)
        : eventsService.attendEvent(eventId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["events", "detail", variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: ["events", "list"] });
      queryClient.invalidateQueries({ queryKey: ["events", "my-events"] });
      if (!variables.attending) awardCoins("event_attended");
      toast.success(variables.attending ? "RSVP removed" : "You're going!");
    },
    onError: (error, variables) => {
      const msg = getErrorMessage(error);
      // 409 – already attending (treat as no-op / silently refresh)
      if (msg?.toLowerCase().includes("already")) {
        queryClient.invalidateQueries({
          queryKey: ["events", "detail", variables.eventId],
        });
        return;
      }
      // 400 – at full capacity
      if (msg?.toLowerCase().includes("capacity") || msg?.toLowerCase().includes("full")) {
        toast.error("This event is at full capacity.");
        return;
      }
      toast.error(msg || "Failed to update RSVP");
    },
  });
}

/** Create a new event */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const awardCoins = useAwardCoins();

  return useMutation({
    mutationFn: ({
      payload,
      onProgress,
    }: {
      payload: Parameters<typeof eventsService.createEvent>[0];
      onProgress?: (p: number) => void;
    }) => eventsService.createEvent(payload, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", "list"] });
      queryClient.invalidateQueries({ queryKey: ["events", "organized"] });
      awardCoins("event_created");
      toast.success("Event created!");
      router.push("/events");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to create event");
    },
  });
}

/** Cancel an event — reason is required by the backend (min 5 chars) */
export function useCancelEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, reason }: { eventId: string; reason: string }) =>
      eventsService.cancelEvent(eventId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["events", "detail", variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: ["events", "organized"] });
      queryClient.invalidateQueries({ queryKey: ["events", "list"] });
      toast.success("Event cancelled.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to cancel event");
    },
  });
}

/** Delete an event */
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (eventId: string) => eventsService.deleteEvent(eventId),
    onSuccess: (_data, eventId) => {
      queryClient.removeQueries({ queryKey: ["events", "detail", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events", "list"] });
      queryClient.invalidateQueries({ queryKey: ["events", "organized"] });
      toast.success("Event deleted.");
      router.push("/events");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to delete event");
    },
  });
}

/** Update an existing event */
export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: Parameters<typeof eventsService.updateEvent>[1]) =>
      eventsService.updateEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", "detail", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events", "list"] });
      queryClient.invalidateQueries({ queryKey: ["events", "organized"] });
      toast.success("Event updated!");
      router.push(`/events/${eventId}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to update event");
    },
  });
}

/** Nearby events by lat/lng */
export function useNearbyEvents(
  lat: number | null,
  lng: number | null,
  radius = 10,
) {
  return useInfiniteQuery({
    queryKey: ["events", "nearby", lat, lng, radius],
    queryFn: ({ pageParam = 1 }) =>
      eventsService.getNearbyEvents(lat!, lng!, radius, pageParam as number, 20),
    getNextPageParam: (lastPage) => {
      const pagination =
        (lastPage as any).pagination || (lastPage as any)?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: lat !== null && lng !== null,
    staleTime: 60000,
  });
}

/** Share an event */
export function useShareEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventsService.shareEvent(eventId),
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["events", "detail", eventId] });
      toast.success("Event shared!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to share event");
    },
  });
}

/** Report an event */
export function useReportEvent() {
  return useMutation({
    mutationFn: ({
      eventId,
      reason,
      description,
    }: {
      eventId: string;
      reason: string;
      description?: string;
    }) => eventsService.reportEvent(eventId, reason, description),
    onSuccess: () => {
      toast.success("Event reported. Thank you.");
    },
    onError: (error) => {
      const msg = getErrorMessage(error);
      if (msg?.includes("already")) {
        toast.error("You have already reported this event.");
      } else {
        toast.error(msg || "Failed to report event");
      }
    },
  });
}

export function useBoostEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, days }: { eventId: string; days: 3 | 7 }) =>
      eventsService.boostEvent(eventId, days),
    onSuccess: (res, { days }) => {
      const data = (res as any)?.data ?? res;
      const until = data?.boostedUntil
        ? new Date(data.boostedUntil).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
        : "";
      toast.success(
        data?.extended ? `Boost extended! Featured until ${until} 🚀` : `Event boosted for ${days} days! 🚀`,
        { description: `${data?.deducted ?? "–"} HuudCoins deducted.` },
      );
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "wallet"] });
    },
    onError: (error) => toast.error(getErrorMessage(error) || "Boost failed. Please try again."),
  });
}
