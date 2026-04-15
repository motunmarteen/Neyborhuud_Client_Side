/**
 * Hook for fetching departments from the backend.
 */

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async (): Promise<Department[]> => {
      try {
        const res = await apiClient.get<any>('/departments');
        const data = res?.data;
        // Backend may return { departments: [...] } or array directly
        return Array.isArray(data) ? data : data?.departments ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}
