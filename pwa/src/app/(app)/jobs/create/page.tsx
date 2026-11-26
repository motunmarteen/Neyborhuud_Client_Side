"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";
import CreateJobForm from "@/components/jobs/CreateJobForm";
import { useAuth } from "@/hooks/useAuth";
import { useStarted } from "@/hooks/useStarted";

export default function CreateJobPage() {
  const { user, isLoading } = useAuth();
  const started = useStarted();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  // Who you are is known only on the phone: wait, so the first draw matches the pre-built page.
  if (!started || isLoading || !user) return null;

  return (
    <LocalHuudSubpageShell hubId="jobs" hideSectionNav>
      <CreateJobForm />
    </LocalHuudSubpageShell>
  );
}
