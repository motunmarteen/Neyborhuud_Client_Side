"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateEventForm from "@/components/events/CreateEventForm";
import { useAuth } from "@/hooks/useAuth";
import { useStarted } from "@/hooks/useStarted";
import { GlassFormPage } from "@/components/ui/GlassFormPage";

export default function CreateEventPage() {
  const { user, isLoading } = useAuth();
  const started = useStarted();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  // Who you are is known only on the phone: wait, so the first draw matches the pre-built page.
  if (!started || isLoading || !user) return null;

  return (
      <GlassFormPage
        title="Create event"
        subtitle="Share what’s happening in your neighborhood."
        onClose={() => router.back()}
      >
        <CreateEventForm />
      </GlassFormPage>
  );
}
