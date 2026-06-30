"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function IframeUrlSync() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      try {
        const currentPath = window.location.pathname + window.location.search;
        const parentPath = window.parent.location.pathname + window.parent.location.search;
        
        if (currentPath !== parentPath) {
          window.parent.history.replaceState(null, "", currentPath);
        }
      } catch (err) {
        console.error("[IframeUrlSync] Failed to sync URL to parent:", err);
      }
    }
  }, [pathname]);

  return null;
}
