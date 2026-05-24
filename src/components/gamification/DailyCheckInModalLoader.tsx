"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isAccountSetupIncomplete, isOnboardingOrAuthRoute } from "@/lib/appShellGates";

const DailyCheckInModal = dynamic(
  () => import("@/components/gamification/DailyCheckInModal"),
  { ssr: false }
);

export default function DailyCheckInModalLoader() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Defer auth/localStorage gates until after mount so SSR HTML matches hydration.
  if (!mounted) return null;
  if (!isAuthenticated) return null;
  if (isOnboardingOrAuthRoute(pathname)) return null;
  if (isAccountSetupIncomplete()) return null;

  return <DailyCheckInModal />;
}
