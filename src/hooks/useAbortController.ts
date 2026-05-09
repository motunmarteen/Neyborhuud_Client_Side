/**
 * useAbortController
 *
 * Returns a stable AbortController that is automatically aborted when the
 * component unmounts (or when `deps` change).  Pass `controller.signal` to
 * any apiClient call to cancel the in-flight request automatically.
 *
 * Usage — classic component fetch:
 *   const { signal } = useAbortController();
 *   useEffect(() => {
 *     apiClient.get("/feed", { signal }).then(setData).catch(() => {});
 *   }, [signal]);
 *
 * Usage — TanStack Query (preferred):
 *   TanStack Query v5 passes `signal` to every queryFn automatically:
 *   queryFn: ({ signal }) => apiClient.get("/feed", { signal })
 *   No hook needed in that case.
 */

"use client";

import { useEffect, useRef } from "react";

export function useAbortController(deps: unknown[] = []) {
  const controllerRef = useRef<AbortController | null>(null);

  // Create a fresh controller on mount and whenever deps change
  if (!controllerRef.current) {
    controllerRef.current = new AbortController();
  }

  useEffect(() => {
    // If deps changed and a controller already exists, abort the previous one
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    return () => {
      // Abort on unmount
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return controllerRef.current!;
}
