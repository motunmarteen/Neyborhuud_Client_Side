"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateJob } from "@/hooks/useJobs";
import { useGeolocation } from "@/hooks/useGeolocation";

const JOB_TYPES = ["full-time", "part-time", "contract", "freelance", "internship"] as const;
const WORK_MODES = ["on-site", "remote", "hybrid"] as const;
const CATEGORIES = [
  "Tech", "Healthcare", "Education", "Finance", "Construction",
  "Agriculture", "Transport", "Hospitality", "Marketing", "Other",
];
const CURRENCIES = ["NGN", "USD", "GBP"];
const PERIODS = ["hourly", "daily", "weekly", "monthly", "yearly"] as const;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--neu-text-secondary)" }}>
      {children}
    </label>
  );
}

function inputCls() {
  return "w-full bg-transparent px-4 py-3 text-sm focus:outline-none rounded-xl";
}

export default function CreateJobForm() {
  const router = useRouter();
  const { location } = useGeolocation();
  const createJob = useCreateJob();

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "full-time" as (typeof JOB_TYPES)[number],
    category: "Tech",
    workMode: "on-site" as (typeof WORK_MODES)[number],
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "NGN",
    salaryPeriod: "monthly" as (typeof PERIODS)[number],
    expiresAt: "",
  });
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [skills, setSkills] = useState<string[]>([""]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateList(list: string[], setList: (v: string[]) => void, idx: number, value: string) {
    const next = [...list];
    next[idx] = value;
    setList(next);
  }

  function addToList(list: string[], setList: (v: string[]) => void) {
    setList([...list, ""]);
  }

  function removeFromList(list: string[], setList: (v: string[]) => void, idx: number) {
    setList(list.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: any = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      category: form.category,
      workMode: form.workMode,
      requirements: requirements.filter((r) => r.trim()),
      skills: skills.filter((s) => s.trim()),
      location: {
        latitude: location?.latitude ?? 0,
        longitude: location?.longitude ?? 0,
        lga: (location as any)?.lga,
        state: (location as any)?.state,
      },
    };

    if (form.salaryMin && form.salaryMax) {
      payload.salary = {
        min: Number(form.salaryMin),
        max: Number(form.salaryMax),
        currency: form.salaryCurrency,
        period: form.salaryPeriod,
      };
    }

    if (form.expiresAt) payload.expiresAt = form.expiresAt;

    createJob.mutate(payload, {
      onSuccess: () => router.push("/jobs"),
    });
  }

  const sectionCls = "mod-card rounded-2xl p-5 space-y-5";
  const neuInputCls = "neu-input rounded-xl";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5 pb-20">
      {/* Basic Details */}
      <div className={sectionCls}>
        <h2 className="text-base font-bold" style={{ color: "var(--neu-text)" }}>
          Job Details
        </h2>

        <div>
          <Label>Job Title <span style={{ color: "var(--brand-red)" }}>*</span></Label>
          <div className={neuInputCls}>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              placeholder="e.g. Frontend Developer"
              className={inputCls()}
              style={{ color: "var(--neu-text)" }}
            />
          </div>
        </div>

        <div>
          <Label>Description <span style={{ color: "var(--brand-red)" }}>*</span></Label>
          <div className={neuInputCls}>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
              rows={5}
              placeholder="Describe the role, responsibilities, and what you are looking for…"
              className={`${inputCls()} resize-none`}
              style={{ color: "var(--neu-text)" }}
            />
          </div>
        </div>

        {/* Type + Work Mode */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Job Type <span style={{ color: "var(--brand-red)" }}>*</span></Label>
            <div className={neuInputCls}>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className={`${inputCls()} cursor-pointer`}
                style={{ color: "var(--neu-text)", background: "transparent" }}
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t} style={{ background: "var(--neu-bg)" }}>
                    {t.replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>Work Mode <span style={{ color: "var(--brand-red)" }}>*</span></Label>
            <div className={neuInputCls}>
              <select
                value={form.workMode}
                onChange={(e) => set("workMode", e.target.value)}
                className={`${inputCls()} cursor-pointer`}
                style={{ color: "var(--neu-text)", background: "transparent" }}
              >
                {WORK_MODES.map((m) => (
                  <option key={m} value={m} style={{ background: "var(--neu-bg)" }}>
                    {m.replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category */}
        <div>
          <Label>Category <span style={{ color: "var(--brand-red)" }}>*</span></Label>
          <div className={neuInputCls}>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={`${inputCls()} cursor-pointer`}
              style={{ color: "var(--neu-text)", background: "transparent" }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ background: "var(--neu-bg)" }}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Salary */}
      <div className={sectionCls}>
        <h2 className="text-base font-bold" style={{ color: "var(--neu-text)" }}>
          Salary <span className="text-sm font-normal" style={{ color: "var(--neu-text-muted)" }}>(optional)</span>
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Min</Label>
            <div className={neuInputCls}>
              <input
                type="number"
                value={form.salaryMin}
                onChange={(e) => set("salaryMin", e.target.value)}
                placeholder="e.g. 150000"
                min={0}
                className={inputCls()}
                style={{ color: "var(--neu-text)" }}
              />
            </div>
          </div>
          <div>
            <Label>Max</Label>
            <div className={neuInputCls}>
              <input
                type="number"
                value={form.salaryMax}
                onChange={(e) => set("salaryMax", e.target.value)}
                placeholder="e.g. 300000"
                min={0}
                className={inputCls()}
                style={{ color: "var(--neu-text)" }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Currency</Label>
            <div className={neuInputCls}>
              <select
                value={form.salaryCurrency}
                onChange={(e) => set("salaryCurrency", e.target.value)}
                className={`${inputCls()} cursor-pointer`}
                style={{ color: "var(--neu-text)", background: "transparent" }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} style={{ background: "var(--neu-bg)" }}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>Period</Label>
            <div className={neuInputCls}>
              <select
                value={form.salaryPeriod}
                onChange={(e) => set("salaryPeriod", e.target.value)}
                className={`${inputCls()} cursor-pointer`}
                style={{ color: "var(--neu-text)", background: "transparent" }}
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p} style={{ background: "var(--neu-bg)" }}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className={sectionCls}>
        <h2 className="text-base font-bold" style={{ color: "var(--neu-text)" }}>
          Skills Required
        </h2>
        {skills.map((skill, idx) => (
          <div key={idx} className="flex gap-2">
            <div className={`${neuInputCls} flex-1`}>
              <input
                value={skill}
                onChange={(e) => updateList(skills, setSkills, idx, e.target.value)}
                placeholder={`Skill ${idx + 1}`}
                className={inputCls()}
                style={{ color: "var(--neu-text)" }}
              />
            </div>
            {skills.length > 1 && (
              <button
                type="button"
                onClick={() => removeFromList(skills, setSkills, idx)}
                className="p-2 rounded-xl mod-btn shrink-0"
                style={{ color: "var(--brand-red)" }}
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addToList(skills, setSkills)}
          className="flex items-center gap-2 text-sm font-semibold transition-all"
          style={{ color: "var(--primary)" }}
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Add Skill
        </button>
      </div>

      {/* Requirements */}
      <div className={sectionCls}>
        <h2 className="text-base font-bold" style={{ color: "var(--neu-text)" }}>
          Requirements <span className="text-sm font-normal" style={{ color: "var(--neu-text-muted)" }}>(optional)</span>
        </h2>
        {requirements.map((req, idx) => (
          <div key={idx} className="flex gap-2">
            <div className={`${neuInputCls} flex-1`}>
              <input
                value={req}
                onChange={(e) => updateList(requirements, setRequirements, idx, e.target.value)}
                placeholder={`Requirement ${idx + 1}`}
                className={inputCls()}
                style={{ color: "var(--neu-text)" }}
              />
            </div>
            {requirements.length > 1 && (
              <button
                type="button"
                onClick={() => removeFromList(requirements, setRequirements, idx)}
                className="p-2 rounded-xl mod-btn shrink-0"
                style={{ color: "var(--brand-red)" }}
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addToList(requirements, setRequirements)}
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--primary)" }}
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Add Requirement
        </button>
      </div>

      {/* Expiry */}
      <div className={sectionCls}>
        <h2 className="text-base font-bold" style={{ color: "var(--neu-text)" }}>
          Expiry Date <span className="text-sm font-normal" style={{ color: "var(--neu-text-muted)" }}>(optional)</span>
        </h2>
        <div className={neuInputCls}>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className={inputCls()}
            style={{ color: "var(--neu-text)" }}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={createJob.isPending}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all mod-btn-active text-primary disabled:opacity-60"
      >
        {createJob.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Posting Job…
          </span>
        ) : (
          "Post Job"
        )}
      </button>
    </form>
  );
}
