/**
 * Hooks for departments: list, detail, services, and rewards.
 */

import { useQuery } from "@tanstack/react-query";
import { departmentService } from "@/services/departments.service";
import type {
  Department,
  DepartmentServicesResponse,
  HuudCoinReward,
} from "@/types/api";

/**
 * Fetch all active departments (cached 5 min).
 */
export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => departmentService.getDepartments(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single department by ID, slug, or alias.
 */
export function useDepartment(identifier: string | undefined) {
  return useQuery<Department>({
    queryKey: ["department", identifier],
    queryFn: () => departmentService.getDepartment(identifier!),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch recommended services for a department.
 */
export function useDepartmentServices(
  identifier: string | undefined,
  page = 1,
  limit = 20,
) {
  return useQuery<DepartmentServicesResponse>({
    queryKey: ["departmentServices", identifier, page, limit],
    queryFn: () =>
      departmentService.getDepartmentServices(identifier!, page, limit),
    enabled: !!identifier,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch HuudCoin reward config for a department.
 */
export function useDepartmentRewards(identifier: string | undefined) {
  return useQuery<HuudCoinReward[]>({
    queryKey: ["departmentRewards", identifier],
    queryFn: () => departmentService.getDepartmentRewards(identifier!),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });
}
