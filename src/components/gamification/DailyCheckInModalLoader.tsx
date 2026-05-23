"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isAccountSetupIncomplete, isOnboardingOrAuthRoute } from "@/lib/appShellGates";

const DailyCheckInModal = dynamic(
  () => import("@/components/gamification/DailyCheckInModal"),
  { ssr: false }
);

export default function DailyCheckInModalLoader() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;
  if (isOnboardingOrAuthRoute(pathname)) return null;
  if (isAccountSetupIncomplete()) return null;

  return <DailyCheckInModal />;
}
