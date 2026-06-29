"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";
import CreateServiceForm from "@/components/services/CreateServiceForm";
import { useAuth } from "@/hooks/useAuth";

export default function CreateServicePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <LocalHuudSubpageShell hubId="services">
      <div className="mod-card rounded-2xl p-4">
        <CreateServiceForm />
      </div>
    </LocalHuudSubpageShell>
  );
}
