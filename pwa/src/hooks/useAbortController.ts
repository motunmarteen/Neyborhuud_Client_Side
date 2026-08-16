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

import { useEffect, useRef, useState } from "react";

export function useAbortController(deps: unknown[] = []) {
  // Lazy initializer avoids creating a controller during every render pass —
  // it only runs once, on first mount — so the very first controller
  // returned is already stable without waiting for an effect to run.
  const [controller, setController] = useState<AbortController>(
    () => new AbortController(),
  );
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Skip the first effect run: the lazy initializer above already created
    // the controller for this mount, so recreating it here too would abort
    // it before any caller had a chance to use its signal.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const next = new AbortController();
    setController((prev) => {
      prev.abort();
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    // Abort on unmount.
    return () => {
      controller.abort();
    };
  }, [controller]);

  return controller;
}
