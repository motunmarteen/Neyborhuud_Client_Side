"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";
import CreateJobForm from "@/components/jobs/CreateJobForm";
import { useAuth } from "@/hooks/useAuth";

export default function CreateJobPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <LocalHuudSubpageShell hubId="jobs">
      <div className="mod-card rounded-2xl p-4">
        <CreateJobForm />
      </div>
    </LocalHuudSubpageShell>
  );
}
