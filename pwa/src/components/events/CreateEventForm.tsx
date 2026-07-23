"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCreateEvent } from "@/hooks/useEvents";
import { useRegisteredLocation } from "@/hooks/useRegisteredLocation";
import { toast } from 'sonner';
import { CreateEventPayload } from "@/types/api";
import { glassField, glassLabel, glassMutedLabel } from "@/lib/glass-form-styles";
import { PremiumTextArea } from "@/components/ui/PremiumTextArea";
import { PostCreationSuccessSheet } from "@/components/shared/PostCreationSuccessSheet";
import { toKobo } from "@/lib/currency";

const EVENT_TYPES = [
  "community",
  "social",
  "sports",
  "cultural",
  "educational",
  "business",
  "other",
] as const;

const VISIBILITY_OPTIONS = ["public", "neighborhood", "private"] as const;

export default function CreateEventForm() {
  const router = useRouter();
  // Use the user's registered (signup) location — no live GPS prompt.
  const { location } = useRegisteredLocation();
  const createEvent = useCreateEvent();
  const [showSuccess, setShowSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<typeof EVENT_TYPES[number]>("community");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venue, setVenue] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [ticketPrice, setTicketPrice] = useState("");
  const [visibility, setVisibility] = useState<typeof VISIBILITY_OPTIONS[number]>("public");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB');
      return;
    }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !startDate || !endDate) return;

    const payload: CreateEventPayload = {
      title: title.trim(),
      description: description.trim(),
      type,
      location: location
        ? { latitude: location.latitude, longitude: location.longitude }
        : { latitude: 0, longitude: 0 },
      venue: venue.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      coverImage: coverFile ?? undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      isFree,
      // API expects integer kobo — see lib/currency.ts.
      ticketPrice: !isFree && ticketPrice ? toKobo(parseFloat(ticketPrice)) : undefined,
      visibility,
      tags: tags.length > 0 ? tags : undefined,
    };

    createEvent.mutate({ payload, onProgress: setUploadProgress }, {
      onSuccess: () => setShowSuccess(true),
    });
  }

  const isUploading = createEvent.isPending && uploadProgress > 0 && uploadProgress < 100;

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Cover image */}
      <div>
        <label className={glassMutedLabel}>Cover image (optional)</label>
        <div
          onClick={() => fileRef.current?.click()}
          className={`relative h-48 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
            coverPreview
              ? "border-transparent"
              : "border-primary/30 bg-primary/[0.06] hover:border-primary/45 dark:border-primary/25 dark:bg-primary/10"
          }`}
        >
          {coverPreview ? (
            <img src={coverPreview} className="h-full w-full object-cover" alt="Cover preview" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-brand-green-dark/70 dark:text-white/55">
              <span className="material-symbols-outlined text-4xl text-[#006F35]/60 dark:text-primary/70">add_photo_alternate</span>
              <span className="text-sm font-medium">Upload cover image (max 10MB)</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" aria-label="Upload cover image" className="hidden" onChange={handleCoverChange} />
        {isUploading && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-light)] dark:bg-white/10">
            <div className="h-full bg-gradient-to-r from-primary to-[#006F35] transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
      </div>

      <div>
        <label className={glassLabel}>
          Event title <span className="text-brand-red">*</span>
        </label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Community clean-up drive"
          className={glassField}
        />
      </div>

      <PremiumTextArea
        label="Description *"
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Tell people what this event is about…"
        rows={4}
      />

      <div>
        <label className={glassLabel}>
          Event type <span className="text-brand-red">*</span>
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as (typeof EVENT_TYPES)[number])}
          aria-label="Event type"
          className={`${glassField} capitalize`}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={glassLabel}>
            Start date &amp; time <span className="text-brand-red">*</span>
          </label>
          <input
            required
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Start date and time"
            className={glassField}
          />
        </div>
        <div>
          <label className={glassLabel}>
            End date &amp; time <span className="text-brand-red">*</span>
          </label>
          <input required type="datetime-local" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} aria-label="End date and time" className={glassField} />
        </div>
      </div>

      <div>
        <label className={glassMutedLabel}>Venue</label>
        <input
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. Community Centre, Lagos Island"
          className={glassField}
        />
      </div>

      <div>
        <label className={glassMutedLabel}>Capacity (optional)</label>
        <input
          type="number"
          min="1"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="Leave blank for unlimited"
          className={glassField}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-[var(--border-light)] bg-[var(--surface-light)]/80 px-4 py-3 dark:border-white/12 dark:bg-white/[0.05]">
          <span className="text-sm font-medium text-brand-green-dark/70 dark:text-white/65">Free event</span>
          <button
            type="button"
            role="switch"
            aria-checked={isFree ? "true" : "false"}
            aria-label="Free event"
            onClick={() => setIsFree((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${isFree ? "bg-gradient-to-r from-primary to-[#006F35]" : "bg-[#3D5A3E]/25 dark:bg-white/15"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isFree ? "translate-x-[1.375rem]" : "translate-x-0"}`}
            />
          </button>
        </div>
        {!isFree && (
          <input
            type="number"
            min="0"
            step="0.01"
            value={ticketPrice}
            onChange={(e) => setTicketPrice(e.target.value)}
            placeholder="Ticket price (₦)"
            className={glassField}
          />
        )}
      </div>

      <div>
        <label className={glassMutedLabel}>Visibility</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as (typeof VISIBILITY_OPTIONS)[number])}
          aria-label="Visibility"
          className={glassField}
        >
          <option value="public">Public</option>
          <option value="neighborhood">Neighborhood only</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div>
        <label className={glassMutedLabel}>Tags (optional)</label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag and press Enter"
            className={`${glassField} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={addTag}
            className="shrink-0 rounded-2xl border border-[var(--border-light)] bg-white px-4 py-3 text-sm font-bold text-brand-black shadow-sm transition-colors hover:bg-[var(--surface-light)] dark:border-white/15 dark:bg-white/10 dark:text-white"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 rounded-full border border-[var(--border-light)] bg-[var(--surface-light)] px-3 py-1 text-sm font-medium text-[#2E502E] dark:border-white/12 dark:bg-white/[0.06] dark:text-white/85"
              >
                #{t}
                <button type="button" onClick={() => removeTag(t)} className="ml-0.5 text-brand-green-dark/70 transition-colors hover:text-brand-red dark:text-white/50">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={createEvent.isPending}
        className="min-h-[52px] w-full rounded-full bg-gradient-to-r from-primary to-[#006F35] py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,212,49,0.35)] transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none dark:from-emerald-500 dark:to-teal-600"
      >
        {createEvent.isPending ? "Creating…" : "Create event"}
      </button>
    </form>

    {showSuccess && (
      <PostCreationSuccessSheet
        type="event"
        onDismiss={() => { setShowSuccess(false); router.push("/events"); }}
      />
    )}
    </>
  );
}
