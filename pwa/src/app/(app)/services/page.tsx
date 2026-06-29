"use client";

import { useState } from "react";
import { AppBrowseLayout } from "@/components/layout/AppBrowseLayout";
import { LocalHuudHubHeader } from "@/components/local-huud/LocalHuudHubHeader";
import { ServicesBrowse, ServicesToolbar } from "@/components/work/ServicesBrowse";

export default function ServicesPage() {
  const [category, setCategory] = useState("All");
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <LocalHuudHubHeader
          hubId="services"
          toolbar={
            <ServicesToolbar
              category={category}
              minRating={minRating}
              onCategory={setCategory}
              onMinRating={setMinRating}
            />
          }
        />
      }
    >
      <ServicesBrowse category={category} minRating={minRating} />
    </AppBrowseLayout>
  );
}
