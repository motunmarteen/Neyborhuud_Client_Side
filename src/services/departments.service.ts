/**
 * Department Service
 * Handles all department-related API calls
 */

import apiClient from "@/lib/api-client";
import {
  Department,
  DepartmentServicesResponse,
  HuudCoinReward,
} from "@/types/api";

export const departmentService = {
  /**
   * Get all departments
   */
  async getDepartments(includeInactive = false): Promise<Department[]> {
    const res = await apiClient.get<any>("/departments", {
      params: includeInactive ? { includeInactive: "true" } : {},
    });
    const data = res?.data;
    return data?.departments ?? (Array.isArray(data) ? data : []);
  },

  /**
   * Get a single department by ID, slug, or alias
   */
  async getDepartment(identifier: string): Promise<Department> {
    const res = await apiClient.get<any>(`/departments/${identifier}`);
    return res?.data?.department ?? res?.data;
  },

  /**
   * Get recommended services for a department
   */
  async getDepartmentServices(
    identifier: string,
    page = 1,
    limit = 20,
  ): Promise<DepartmentServicesResponse> {
    const res = await apiClient.get<any>(
      `/departments/${identifier}/services`,
      { params: { page, limit } },
    );
    return res?.data ?? { services: [], pagination: { page, limit, total: 0, pages: 0 } };
  },

  /**
   * Get HuudCoin rewards for a department
   */
  async getDepartmentRewards(identifier: string): Promise<HuudCoinReward[]> {
    const res = await apiClient.get<any>(
      `/departments/${identifier}/rewards`,
    );
    return res?.data?.rewards ?? [];
  },

  /**
   * Get HuudCoin reward for a specific action within a department
   */
  async getDepartmentRewardForAction(
    identifier: string,
    action: string,
  ): Promise<HuudCoinReward | null> {
    const res = await apiClient.get<any>(
      `/departments/${identifier}/rewards/${action}`,
    );
    return res?.data?.reward ?? null;
  },

  /**
   * Create a new department (admin only)
   */
  async createDepartment(payload: Partial<Department>): Promise<Department> {
    const res = await apiClient.post<any>("/departments", payload);
    return res?.data?.department ?? res?.data;
  },

  /**
   * Update a department (admin only)
   */
  async updateDepartment(
    identifier: string,
    updates: Partial<Department>,
  ): Promise<Department> {
    const res = await apiClient.put<any>(
      `/departments/${identifier}`,
      updates,
    );
    return res?.data?.department ?? res?.data;
  },

  /**
   * Deactivate a department (admin only)
   */
  async deleteDepartment(identifier: string): Promise<Department> {
    const res = await apiClient.delete<any>(`/departments/${identifier}`);
    return res?.data?.department ?? res?.data;
  },
};
