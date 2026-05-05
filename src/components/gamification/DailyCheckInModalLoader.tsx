"use client";

import dynamic from "next/dynamic";

const DailyCheckInModal = dynamic(
  () => import("@/components/gamification/DailyCheckInModal"),
  { ssr: false }
);

export default function DailyCheckInModalLoader() {
  return <DailyCheckInModal />;
}
