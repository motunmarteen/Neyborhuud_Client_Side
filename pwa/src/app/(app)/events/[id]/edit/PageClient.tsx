"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from 'sonner';
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";
import { useEvent, useUpdateEvent } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { CreateEventPayload } from "@/types/api";

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

function toLocalDatetime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useEvent(id);
  const updateEvent = useUpdateEvent(id);

  const event = (data as any)?.data ?? data;

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
  const [hydrated, setHydrated] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pre-fill form once event loads
  useEffect(() => {
    if (event && !hydrated) {
      setTitle(event.title ?? "");
      setDescription(event.description ?? "");
      setType(event.type ?? "community");
      setStartDate(toLocalDatetime(event.startDate));
      setEndDate(event.endDate ? toLocalDatetime(event.endDate) : "");
      setVenue(event.venue ?? "");
      setCapacity(event.capacity ? String(event.capacity) : "");
      setIsFree(event.isFree ?? true);
      setTicketPrice(event.ticketPrice ? String(event.ticketPrice) : "");
      setVisibility(event.visibility ?? "public");
      setTags(event.tags ?? []);
      setCoverPreview(event.coverImage ?? null);
      setHydrated(true);
    }
  }, [event, hydrated]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) setTags((prev) => [...prev, t]);
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
    const payload: Partial<CreateEventPayload> = {};
    if (title.trim()) payload.title = title.trim();
    if (description.trim()) payload.description = description.trim();
    payload.type = type;
    if (startDate) payload.startDate = new Date(startDate).toISOString();
    if (endDate) payload.endDate = new Date(endDate).toISOString();
    if (venue.trim()) payload.venue = venue.trim();
    if (capacity) payload.capacity = parseInt(capacity, 10);
    payload.isFree = isFree;
    if (!isFree && ticketPrice) payload.ticketPrice = parseFloat(ticketPrice);
    payload.visibility = visibility;
    if (tags.length > 0) payload.tags = tags;
    if (coverFile) payload.coverImage = coverFile;

    updateEvent.mutate(payload);
  }

  if (authLoading || !user) return null;

  if (isLoading) {
    return (
      <LocalHuudSubpageShell hubId="events">
        <div className="mod-card rounded-2xl p-4 animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-xl" style={{ background: "var(--neu-shadow-dark)" }} />
          ))}
        </div>
      </LocalHuudSubpageShell>
    );
  }

  if (event && user.id !== event.organizerId) {
    return (
      <LocalHuudSubpageShell hubId="events">
        <div className="mod-card rounded-2xl p-6 text-center">
          <span className="material-symbols-outlined text-brand-red text-5xl">lock</span>
          <p className="mt-4" style={{ color: "var(--neu-text-muted)" }}>You can only edit events you organized.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 mod-chip rounded-xl font-semibold transition-colors"
            style={{ color: "var(--neu-text)" }}
          >
            Go Back
          </button>
        </div>
      </LocalHuudSubpageShell>
    );
  }

  return (
    <LocalHuudSubpageShell hubId="events">
      <div className="mod-card rounded-2xl p-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Cover image */}
            <div>
              <label className="block text-sm text-[var(--neu-text-muted)] mb-2">Cover Image</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`relative h-48 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-colors ${
                  coverPreview ? "border-transparent" : "border-black/[0.08] hover:border-black/[0.08]"
                }`}
              >
                {coverPreview ? (
                  <img src={coverPreview} className="w-full h-full object-cover" alt="cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--neu-text-muted)] gap-2">
                    <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                    <span className="text-sm">Upload cover image (max 10MB)</span>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm text-[var(--neu-text-muted)] mb-1.5">Event Title *</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-brand-black border border-black/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-[var(--neu-text-muted)] focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-[var(--neu-text-muted)] mb-1.5">Description *</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-brand-black border border-black/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-[var(--neu-text-muted)] focus:outline-none focus:border-brand-blue transition-colors resize-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm text-[var(--neu-text-muted)] mb-1.5">Event Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as typeof EVENT_TYPES[number])}
                className="w-full bg-brand-black border border-black/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue transition-colors"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--neu-text-muted)] mb-1.5">Start Date & Time *</label>
                <input
                  required
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-brand-black border border-black/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--neu-text-muted)] mb-1.5">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-brand-black border border-black/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm text-[var(--neu-text-muted)] mb-1.5">Venue</label>
              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Community Centre, Lagos Island"
                className="w-full bg-brand-black border border-black/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-[var(--neu-text-muted)] focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm text-[var(--neu-text-muted)] mb-1.5">Capacity (optional)</label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Leave blank for unlimited"
                className="w-full bg-brand-black border border-black/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-[var(--neu-text-muted)] focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>

            {/* Free toggle + price */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[var(--neu-text-muted)]">Free Event</span>
                <button
                  type="button"
                  onClick={() => setIsFree((v) => !v)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    isFree ? "bg-brand-green-dark" : "bg-brand-black"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                      isFree ? "left-6" : "left-0.5"
                    }`}
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
                  className="w-full bg-brand-black border border-black/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-[var(--neu-text-muted)] focus:outline-none focus:border-brand-blue transition-colors"
                />
              )}
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm text-[var(--neu-text-muted)] mb-1.5">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as typeof VISIBILITY_OPTIONS[number])}
                className="w-full bg-brand-black border border-black/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue transition-colors"
              >
                <option value="public">Public</option>
                <option value="neighborhood">Neighborhood Only</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm text-[var(--neu-text-muted)] mb-1.5">Tags (optional)</label>
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
                  className="flex-1 bg-brand-black border border-black/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-[var(--neu-text-muted)] focus:outline-none focus:border-brand-blue transition-colors"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-3 bg-brand-black hover:bg-brand-surface rounded-xl text-white transition-colors"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1 bg-brand-black text-[var(--neu-text-muted)] rounded-full px-3 py-1 text-sm"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="text-[var(--neu-text-muted)] hover:text-brand-red transition-colors ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={updateEvent.isPending}
              className="w-full py-3.5 bg-brand-blue hover:bg-brand-blue disabled:opacity-50 rounded-xl font-bold text-white transition-colors"
            >
              {updateEvent.isPending ? "Saving…" : "Save Changes"}
            </button>
          </form>
      </div>
    </LocalHuudSubpageShell>
  );
}
