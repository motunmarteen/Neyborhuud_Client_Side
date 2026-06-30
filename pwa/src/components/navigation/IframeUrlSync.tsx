"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function IframeUrlSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      try {
        const searchStr = searchParams?.toString();
        const currentPath = pathname + (searchStr ? `?${searchStr}` : "");
        const parentPath = window.parent.location.pathname + window.parent.location.search;
        
        if (currentPath !== parentPath) {
          window.parent.history.replaceState(null, "", currentPath);
        }
      } catch (err) {
        console.error("[IframeUrlSync] Failed to sync URL to parent:", err);
      }
    }
  }, [pathname, searchParams]);

  return null;
}
