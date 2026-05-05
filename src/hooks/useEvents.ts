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
      const pagination =
        (lastPage as any).pagination || (lastPage as any)?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 60000,
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
      const pagination =
        (lastPage as any).pagination || (lastPage as any)?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
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
      const pagination =
        (lastPage as any).pagination || (lastPage as any)?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
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

  return useMutation({
    mutationFn: ({ eventId, attending }: { eventId: string; attending: boolean }) =>
      attending
        ? eventsService.unattendEvent(eventId)
        : eventsService.attendEvent(eventId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["events", "detail", variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: ["events", "my-events"] });
      toast.success(variables.attending ? "RSVP removed" : "You're going!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to update RSVP");
    },
  });
}

/** Create a new event */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const router = useRouter();

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
      toast.success("Event created!");
      router.push("/events");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to create event");
    },
  });
}

/** Cancel an event */
export function useCancelEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, reason }: { eventId: string; reason?: string }) =>
      eventsService.cancelEvent(eventId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["events", "detail", variables.eventId],
      });
      queryClient.invalidateQueries({ queryKey: ["events", "organized"] });
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
