"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppBrowseLayout } from "@/components/layout/AppBrowseLayout";
import { useMyPlaces, useRemoveFrequentPlace } from "@/hooks/useFrequentPlaces";
import { AddFrequentPlaceSheet } from "@/components/location/AddFrequentPlaceSheet";
import { kindMeta } from "@/lib/frequentPlaces";

export default function MyPlacesPage() {
  const router = useRouter();
  const { data, isLoading, refetch } = useMyPlaces();
  const remove = useRemoveFrequentPlace();
  const [adding, setAdding] = useState(false);

  const home = data?.home;
  const places = data?.frequentPlaces ?? [];

  return (
    <AppBrowseLayout
      header={
        <div className="sticky top-0 z-50 border-b border-charcoal/5 bg-white/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-lg items-center gap-4 px-6 py-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-xl neumorphic"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-charcoal">My places</h1>
              <p className="text-xs text-charcoal/50">Home + frequent spots for local context</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-lg space-y-5 py-6">
        <section className="neumorphic rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">home</span>
            <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/50">Home</h2>
          </div>
          {isLoading ? (
            <div className="h-12 animate-pulse rounded-xl bg-charcoal/5" />
          ) : (
            <>
              <p className="font-semibold text-charcoal">
                {home?.formattedAddress ?? home?.lga ?? "Not set yet"}
              </p>
              <p className="mt-1 text-xs text-charcoal/50">
                {[home?.neighborhood, home?.lga, home?.state].filter(Boolean).join(" · ") ||
                  "Your Huud home address"}
              </p>
              <Link
                href="/verify-location"
                className="mt-3 inline-flex text-xs font-semibold text-brand-blue"
              >
                Update home manually →
              </Link>
            </>
          )}
        </section>

        <section className="neumorphic rounded-2xl p-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-blue">explore</span>
              <h2 className="text-sm font-black uppercase tracking-widest text-charcoal/50">
                Frequent places
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"
            >
              + Add
            </button>
          </div>
          <p className="mb-4 text-xs text-charcoal/50">
            Work, chill spots, gym, and more. These tell the platform what&apos;s happening around you without changing home.
          </p>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-charcoal/5" />
              ))}
            </div>
          ) : places.length === 0 ? (
            <div className="rounded-xl border border-dashed border-charcoal/15 py-8 text-center">
              <p className="text-sm text-charcoal/60">No frequent places yet</p>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-2 text-sm font-semibold text-primary"
              >
                Save your first place
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {places.map((p) => {
                const meta = kindMeta(p.kind);
                return (
                  <li
                    key={p.id}
                    className="flex items-start gap-3 rounded-xl border border-black/[0.06] bg-white/80 p-3"
                  >
                    <span className="material-symbols-outlined mt-0.5 text-primary">{meta.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-charcoal">{p.label}</p>
                      <p className="truncate text-xs text-charcoal/50">
                        {p.formattedAddress ?? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-charcoal/40">{meta.label}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove.mutate(p.id)}
                      disabled={remove.isPending}
                      className="shrink-0 rounded-lg p-2 text-white/30 hover:bg-status-danger/10 hover:text-status-danger"
                      aria-label={`Remove ${p.label}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Link
          href="/settings/location"
          className="block text-center text-xs text-charcoal/50 underline"
        >
          Content radius settings
        </Link>
      </div>

      {adding && (
        <AddFrequentPlaceSheet
          onClose={() => setAdding(false)}
          onSaved={() => void refetch()}
        />
      )}
    </AppBrowseLayout>
  );
}
