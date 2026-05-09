"use client";

import { useState, useRef } from "react";
import { useCreateEvent } from "@/hooks/useEvents";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from 'sonner';
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

export default function CreateEventForm() {
  const { location } = useGeolocation();
  const createEvent = useCreateEvent();

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
      ticketPrice: !isFree && ticketPrice ? parseFloat(ticketPrice) : undefined,
      visibility,
      tags: tags.length > 0 ? tags : undefined,
    };

    createEvent.mutate({ payload, onProgress: setUploadProgress });
  }

  const isUploading = createEvent.isPending && uploadProgress > 0 && uploadProgress < 100;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Cover image */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Cover Image (optional)</label>
        <div
          onClick={() => fileRef.current?.click()}
          className={`relative h-48 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-colors ${
            coverPreview ? "border-transparent" : "border-gray-700 hover:border-gray-500"
          }`}
        >
          {coverPreview ? (
            <img src={coverPreview} className="w-full h-full object-cover" alt="cover preview" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
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
        {isUploading && (
          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Event Title *</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Community Clean-up Drive"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Description *</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell people what this event is about..."
          rows={4}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Event Type *</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof EVENT_TYPES[number])}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors capitalize"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Start Date & Time *</label>
          <input
            required
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">End Date & Time *</label>
          <input
            required
            type="datetime-local"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Venue */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Venue</label>
        <input
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. Community Centre, Lagos Island"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Capacity */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Capacity (optional)</label>
        <input
          type="number"
          min="1"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="Leave blank for unlimited"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Free toggle + price */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Free Event</span>
          <button
            type="button"
            onClick={() => setIsFree((v) => !v)}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              isFree ? "bg-green-600" : "bg-gray-700"
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
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        )}
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Visibility</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as typeof VISIBILITY_OPTIONS[number])}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="public">Public</option>
          <option value="neighborhood">Neighborhood Only</option>
          <option value="private">Private</option>
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Tags (optional)</label>
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
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white transition-colors"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 bg-gray-800 text-gray-300 rounded-full px-3 py-1 text-sm"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="text-gray-500 hover:text-red-400 transition-colors ml-0.5"
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
        disabled={createEvent.isPending}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-bold text-white transition-colors"
      >
        {createEvent.isPending ? "Creating…" : "Create Event"}
      </button>
    </form>
  );
}
