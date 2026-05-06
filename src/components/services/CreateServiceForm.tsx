"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCreateService } from "@/hooks/useServices";

const CATEGORIES = [
  "Cleaning",
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Tutoring",
  "Catering",
  "Photography",
  "Beauty",
  "Laundry",
  "Security",
  "Other",
] as const;

const SUBCATEGORIES: Record<string, string[]> = {
  Cleaning: ["Home Cleaning", "Office Cleaning", "Carpet Cleaning", "Window Cleaning", "Post-Construction"],
  Plumbing: ["Leak Repair", "Pipe Installation", "Drain Cleaning", "Water Heater", "General Plumbing"],
  Electrical: ["Wiring", "Lighting", "Fault Finding", "Generator Service", "Solar Installation"],
  Carpentry: ["Furniture Making", "Door/Window Frames", "Repairs", "Interior Finishing"],
  Painting: ["Interior", "Exterior", "Texture Painting", "Graffiti/Murals"],
  Tutoring: ["Primary School", "Secondary School", "University", "JAMB/WAEC Prep", "Languages"],
  Catering: ["Events Catering", "Daily Meal Delivery", "Small Chops", "Wedding", "Corporate"],
  Photography: ["Portrait", "Events", "Product", "Real Estate", "Videography"],
  Beauty: ["Hair Styling", "Makeup", "Nails", "Barbing", "Spa/Massage"],
  Laundry: ["Wash & Fold", "Dry Cleaning", "Ironing", "Pick-up & Delivery"],
  Security: ["Guard Service", "CCTV Installation", "Access Control"],
  Other: [],
};

const PRICING_TYPES = [
  { value: "fixed", label: "Fixed Price" },
  { value: "hourly", label: "Per Hour" },
  { value: "custom", label: "Custom / Negotiable" },
] as const;

const CURRENCIES = ["NGN", "USD", "GBP", "EUR"];

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CreateServiceForm() {
  const router = useRouter();
  const createService = useCreateService();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Cleaning" as (typeof CATEGORIES)[number],
    subcategory: "",
    pricingType: "fixed" as "fixed" | "hourly" | "custom",
    pricingAmount: "",
    pricingCurrency: "NGN",
    hoursText: "9am – 5pm",
  });

  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
  ]);

  // Image previews (base64 data URLs for display; real upload would use a media endpoint)
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length + imageFiles.length > 6) {
      return;
    }
    const newFiles = files.slice(0, 6 - imageFiles.length);
    setImageFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be selected again after removal
    e.target.value = "";
  }

  function removeImage(idx: number) {
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (selectedDays.length === 0) {
      return;
    }

    const payload: Parameters<typeof createService.mutate>[0] = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.toLowerCase(),
      subcategory: form.subcategory || undefined,
      pricing: {
        type: form.pricingType,
        currency: form.pricingCurrency,
        ...(form.pricingType !== "custom" && form.pricingAmount
          ? { amount: Number(form.pricingAmount) }
          : {}),
      },
      availability: {
        days: selectedDays,
        hours: form.hoursText.trim(),
      },
      // Images would be uploaded to a media endpoint first; omit if none
      ...(imagePreviews.length > 0 ? { images: imagePreviews } : {}),
    };

    createService.mutate(payload, {
      onSuccess: () => router.push("/services"),
    });
  }

  const subcategoryOptions = SUBCATEGORIES[form.category] ?? [];

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* ── Basic Info ── */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-lg font-bold text-white">Service Details</h2>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Service Title <span className="text-red-400">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            placeholder="e.g. Professional Home Cleaning"
            className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            required
            rows={5}
            placeholder="Describe what you offer, your experience, tools you use, and what makes you stand out..."
            className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Category + Subcategory */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              aria-label="Category"
              value={form.category}
              onChange={(e) => {
                set("category", e.target.value as (typeof CATEGORIES)[number]);
                set("subcategory", "");
              }}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Subcategory{" "}
              <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <select
              aria-label="Subcategory"
              value={form.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
              disabled={subcategoryOptions.length === 0}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-40"
            >
              <option value="">— Select —</option>
              {subcategoryOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Pricing ── */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Pricing</h2>

        {/* Pricing Type */}
        <div className="flex gap-2">
          {PRICING_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => set("pricingType", value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                form.pricingType === value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Amount + Currency (hidden for custom) */}
        {form.pricingType !== "custom" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Amount{" "}
                {form.pricingType === "hourly" && (
                  <span className="text-gray-500 font-normal">/ hour</span>
                )}
              </label>
              <input
                type="number"
                value={form.pricingAmount}
                onChange={(e) => set("pricingAmount", e.target.value)}
                placeholder="e.g. 5000"
                min={0}
                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Currency
              </label>
              <select
                aria-label="Currency"
                value={form.pricingCurrency}
                onChange={(e) => set("pricingCurrency", e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {form.pricingType === "custom" && (
          <p className="text-sm text-gray-400 bg-gray-800/50 rounded-xl px-4 py-3">
            Clients will contact you to negotiate a price.
          </p>
        )}
      </div>

      {/* ── Availability ── */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Availability</h2>

        {/* Days */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Working Days <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {ALL_DAYS.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-green-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {selectedDays.length === 0 && (
            <p className="text-xs text-red-400 mt-1.5">
              Select at least one day.
            </p>
          )}
        </div>

        {/* Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Working Hours
          </label>
          <input
            value={form.hoursText}
            onChange={(e) => set("hoursText", e.target.value)}
            placeholder="e.g. 8am – 6pm, or Flexible"
            className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Images ── */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Photos{" "}
            <span className="text-gray-500 font-normal text-sm">(optional, max 6)</span>
          </h2>
          {imagePreviews.length < 6 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
              Add Photos
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          aria-label="Upload service photos"
          className="hidden"
          onChange={handleImageChange}
        />

        {imagePreviews.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[16px] text-white">close</span>
                </button>
              </div>
            ))}
            {imagePreviews.length < 6 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-500 hover:border-gray-400 hover:text-gray-400 transition-colors"
              >
                <span className="material-symbols-outlined text-[28px]">add</span>
                <span className="text-xs">Add</span>
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 rounded-xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-400 hover:text-gray-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[36px]">add_photo_alternate</span>
            <span className="text-sm">Tap to add photos of your work</span>
          </button>
        )}
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={
          createService.isPending ||
          !form.title.trim() ||
          !form.description.trim() ||
          selectedDays.length === 0
        }
        className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
      >
        {createService.isPending ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Listing service…
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            List My Service
          </>
        )}
      </button>
    </form>
  );
}
