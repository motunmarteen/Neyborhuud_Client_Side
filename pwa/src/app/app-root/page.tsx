"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { resolvePostAuthRoute } from "@/lib/authSession";

export default function AppRootPage() {
  const router = useRouter();

  useEffect(() => {
    if (apiClient.isAuthenticated()) {
      router.replace(resolvePostAuthRoute());
    } else {
      router.replace("/login");
    }
  }, [router]);

  // Render a minimal base base background matching the PWA dark base
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060908" }} />
  );
}
