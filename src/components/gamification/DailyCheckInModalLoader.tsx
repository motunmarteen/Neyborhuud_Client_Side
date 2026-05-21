"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const DailyCheckInModal = dynamic(
  () => import("@/components/gamification/DailyCheckInModal"),
  { ssr: false }
);

export default function DailyCheckInModalLoader() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const isAuthRoute = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/welcome",
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isAuthRoute || !isAuthenticated) return null;

  return <DailyCheckInModal />;
}
