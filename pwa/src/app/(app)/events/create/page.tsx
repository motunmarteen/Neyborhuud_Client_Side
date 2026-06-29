"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateEventForm from "@/components/events/CreateEventForm";
import { useAuth } from "@/hooks/useAuth";
import { GlassFormPage } from "@/components/ui/GlassFormPage";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";

export default function CreateEventPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <LocalHuudSubpageShell hubId="events" maxWidth="920">
      <GlassFormPage
        title="Create event"
        subtitle="Share what’s happening in your neighborhood."
        onClose={() => router.back()}
      >
        <CreateEventForm />
      </GlassFormPage>
    </LocalHuudSubpageShell>
  );
}
