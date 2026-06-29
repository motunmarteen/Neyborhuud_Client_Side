"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — activity tier lives in the HuudCoins wallet hub. */
export default function PremiumRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/huud-economy/wallet?tab=tier");
  }, [router]);

  return null;
}
