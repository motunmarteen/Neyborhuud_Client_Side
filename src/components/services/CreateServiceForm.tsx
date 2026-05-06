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
  { value: "custom", label: "Negotiable" },
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

  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
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
    const newFiles = files.slice(0, 6 - imageFiles.length);
    setImageFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeImage(idx: number) {
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedDays.length === 0) return;

    createService.mutate(
      {
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
        imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
      } as any,
      { onSuccess: () => router.push("/services") },
    );
  }

  const subcategoryOptions = SUBCATEGORIES[form.category] ?? [];

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4 px-4 pb-24">
      {/* ── Service Details ── */}
      <div className="mod-card rounded-2xl p-5 space-y-5">
        <h2 className="text-base font-bold" style={{ color: "var(--neu-text)" }}>Service Details</h2>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--neu-text-muted)" }}>
            Service Title <span style={{ color: "var(--brand-red)" }}>*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            placeholder="e.g. Professional Home Cleaning"
            className="w-full mod-inset rounded-xl px-4 py-3 focus:outline-none transition-all"
            style={{ color: "var(--neu-text)" }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--neu-text-muted)" }}>
            Description <span style={{ color: "var(--brand-red)" }}>*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            required
            rows={5}
            placeholder="Describe what you offer, your experience, and what makes you stand out..."
            className="w-full mod-inset rounded-xl px-4 py-3 focus:outline-none transition-all resize-none"
            style={{ color: "var(--neu-text)" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--neu-text-muted)" }}>
              Category <span style={{ color: "var(--brand-red)" }}>*</span>
            </label>
            <select
              aria-label="Category"
              value={form.category}
              onChange={(e) => {
                set("category", e.target.value as (typeof CATEGORIES)[number]);
                set("subcategory", "");
              }}
              className="w-full mod-inset rounded-xl px-4 py-3 focus:outline-none transition-all"
              style={{ color: "var(--neu-text)" }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--neu-text-muted)" }}>
              Subcategory <span className="font-normal text-xs">(optional)</span>
            </label>
            <select
              aria-label="Subcategory"
              value={form.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
              disabled={subcategoryOptions.length === 0}
              className="w-full mod-inset rounded-xl px-4 py-3 focus:outline-none transition-all disabled:opacity-40"
              style={{ color: "var(--neu-text)" }}
            >
              <option value="">— Select —</option>
              {subcategoryOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Pricing ── */}
      <div className="mod-card rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold" style={{ color: "var(--neu-text)" }}>Pricing</h2>

        <div className="flex gap-2">
          {PRICING_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => set("pricingType", value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                form.pricingType === value ? "mod-btn-active text-primary" : "mod-btn"
              }`}
              style={form.pricingType !== value ? { color: "var(--neu-text-muted)" } : {}}
            >
              {label}
            </button>
          ))}
        </div>

        {form.pricingType !== "custom" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--neu-text-muted)" }}>
                Amount{form.pricingType === "hourly" && <span className="font-normal"> / hour</span>}
              </label>
              <input
                type="number"
                value={form.pricingAmount}
                onChange={(e) => set("pricingAmount", e.target.value)}
                placeholder="e.g. 5000"
                min={0}
                className="w-full mod-inset rounded-xl px-4 py-3 focus:outline-none transition-all"
                style={{ color: "var(--neu-text)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--neu-text-muted)" }}>Currency</label>
              <select
                aria-label="Currency"
                value={form.pricingCurrency}
                onChange={(e) => set("pricingCurrency", e.target.value)}
                className="w-full mod-inset rounded-xl px-4 py-3 focus:outline-none transition-all"
                style={{ color: "var(--neu-text)" }}
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {form.pricingType === "custom" && (
          <p className="text-sm mod-inset rounded-xl px-4 py-3" style={{ color: "var(--neu-text-muted)" }}>
            Clients will contact you to negotiate a price.
          </p>
        )}
      </div>

      {/* ── Availability ── */}
      <div className="mod-card rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold" style={{ color: "var(--neu-text)" }}>Availability</h2>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--neu-text-muted)" }}>
            Working Days <span style={{ color: "var(--brand-red)" }}>*</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {ALL_DAYS.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    active ? "mod-btn-active text-primary" : "mod-btn"
                  }`}
                  style={!active ? { color: "var(--neu-text-muted)" } : {}}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {selectedDays.length === 0 && (
            <p className="text-xs mt-1.5" style={{ color: "var(--brand-red)" }}>Select at least one day.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--neu-text-muted)" }}>Working Hours</label>
          <input
            value={form.hoursText}
            onChange={(e) => set("hoursText", e.target.value)}
            placeholder="e.g. 8am – 6pm, or Flexible"
            className="w-full mod-inset rounded-xl px-4 py-3 focus:outline-none transition-all"
            style={{ color: "var(--neu-text)" }}
          />
        </div>
      </div>

      {/* ── Photos ── */}
      <div className="mod-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: "var(--neu-text)" }}>
            Photos <span className="text-sm font-normal" style={{ color: "var(--neu-text-muted)" }}>(optional, max 6)</span>
          </h2>
          {imageFiles.length < 6 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-sm font-semibold transition-all"
              style={{ color: "var(--primary)" }}
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
                <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.7)" }}
                >
                  <span className="material-symbols-outlined text-[16px] text-white">close</span>
                </button>
              </div>
            ))}
            {imagePreviews.length < 6 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl mod-inset flex flex-col items-center justify-center gap-1 transition-all"
                style={{ color: "var(--neu-text-muted)" }}
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
            className="w-full h-32 rounded-xl mod-inset flex flex-col items-center justify-center gap-2 transition-all"
            style={{ color: "var(--neu-text-muted)" }}
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
        className="w-full py-4 mod-btn-active text-primary disabled:opacity-50 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
      >
        {createService.isPending ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
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
