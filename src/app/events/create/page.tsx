"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateEventForm from "@/components/events/CreateEventForm";
import { useAuth } from "@/hooks/useAuth";
import { GlassFormPage } from "@/components/ui/GlassFormPage";

export default function CreateEventPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

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
