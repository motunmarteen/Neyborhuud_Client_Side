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

export default function CreateJobForm() {
  const router = useRouter();
  const { location } = useGeolocation();
  const createJob = useCreateJob();

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "full-time" as typeof JOB_TYPES[number],
    category: "Tech",
    workMode: "on-site" as typeof WORK_MODES[number],
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "NGN",
    salaryPeriod: "monthly" as typeof PERIODS[number],
    expiresAt: "",
  });
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [skills, setSkills] = useState<string[]>([""]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateList(
    list: string[],
    setList: (v: string[]) => void,
    idx: number,
    value: string,
  ) {
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
        lga: location?.lga,
        state: location?.state,
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

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-lg font-bold text-white">Job Details</h2>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Job Title <span className="text-red-400">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            placeholder="e.g. Frontend Developer"
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
            placeholder="Describe the role, responsibilities, and what you're looking for..."
            className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Type + Work Mode */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Job Type <span className="text-red-400">*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors capitalize"
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace("-", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Work Mode <span className="text-red-400">*</span>
            </label>
            <select
              value={form.workMode}
              onChange={(e) => set("workMode", e.target.value)}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors capitalize"
            >
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>{m.replace("-", " ")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Salary */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">
          Salary <span className="text-gray-500 font-normal text-sm">(optional)</span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Min</label>
            <input
              type="number"
              value={form.salaryMin}
              onChange={(e) => set("salaryMin", e.target.value)}
              placeholder="50000"
              min={0}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Max</label>
            <input
              type="number"
              value={form.salaryMax}
              onChange={(e) => set("salaryMax", e.target.value)}
              placeholder="150000"
              min={0}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Currency</label>
            <select
              value={form.salaryCurrency}
              onChange={(e) => set("salaryCurrency", e.target.value)}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Per</label>
            <select
              value={form.salaryPeriod}
              onChange={(e) => set("salaryPeriod", e.target.value as any)}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors capitalize"
            >
              {PERIODS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-bold text-white">Requirements</h2>
        {requirements.map((req, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              value={req}
              onChange={(e) => updateList(requirements, setRequirements, idx, e.target.value)}
              placeholder={`Requirement ${idx + 1}`}
              className="flex-1 bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
            {requirements.length > 1 && (
              <button
                type="button"
                onClick={() => removeFromList(requirements, setRequirements, idx)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addToList(requirements, setRequirements)}
          className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add requirement
        </button>
      </div>

      {/* Skills */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-bold text-white">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-gray-800 rounded-full px-3 py-1.5">
              <input
                value={skill}
                onChange={(e) => updateList(skills, setSkills, idx, e.target.value)}
                placeholder="Skill"
                className="bg-transparent text-white text-sm focus:outline-none w-24"
              />
              {skills.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFromList(skills, setSkills, idx)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addToList(skills, setSkills)}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm bg-blue-900/20 rounded-full px-3 py-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Add skill
          </button>
        </div>
      </div>

      {/* Expires */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Closing Date <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="date"
          value={form.expiresAt}
          onChange={(e) => set("expiresAt", e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={createJob.isPending || !form.title || !form.description}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-400 text-white rounded-2xl font-bold text-base transition-colors"
      >
        {createJob.isPending ? "Posting…" : "Post Job"}
      </button>
    </form>
  );
}
