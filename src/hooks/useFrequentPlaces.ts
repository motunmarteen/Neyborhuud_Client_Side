"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { locationService } from "@/services/location.service";
import { getErrorMessage } from "@/lib/error-handler";

export function useMyPlaces() {
  return useQuery({
    queryKey: ["myPlaces"],
    queryFn: () => locationService.getMyPlaces(),
    staleTime: 60_000,
  });
}

export function useAddFrequentPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: locationService.addFrequentPlace,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myPlaces"] });
      toast.success("Place saved — we'll use this for local context, not as your home.");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRemoveFrequentPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: locationService.removeFrequentPlace,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myPlaces"] });
      toast.success("Place removed");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useConfirmHomeRefinement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => locationService.confirmHomeRefinement(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myPlaces"] });
      toast.success("Home address updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDismissHomeHint() {
  return useMutation({
    mutationFn: () => locationService.dismissHomeHint(),
  });
}
