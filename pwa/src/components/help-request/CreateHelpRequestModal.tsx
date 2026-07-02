"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, ChevronDown, AlertCircle } from "lucide-react";
import { contentService } from "@/services/content.service";
import { getRegisteredLocationSync } from "@/hooks/useRegisteredLocation";

const CATEGORIES = [
  { value: "financial", label: "💰 Financial", desc: "Money, fees, bills" },
  { value: "medical", label: "🏥 Medical", desc: "Health or medicine" },
  { value: "food", label: "🍱 Food", desc: "Meals, groceries" },
  { value: "shelter", label: "🏠 Shelter", desc: "Housing, rent" },
  { value: "emergency", label: "🚨 Emergency", desc: "Urgent situation" },
] as const;

type HelpCategory = (typeof CATEGORIES)[number]["value"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateHelpRequestModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<HelpCategory | "">("");
  const [body, setBody] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [priority, setPriority] = useState<"normal" | "high" | "critical">("normal");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const reset = () => {
    setStep(1);
    setCategory("");
    setBody("");
    setTargetAmount("");
    setAccountName("");
    setAccountNumber("");
    setBankName("");
    setPriority("normal");
    setImages([]);
    setImagePreviews([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const userLocation = getRegisteredLocationSync();

      const payload: Parameters<typeof contentService.createPost>[0] = {
        type: images.length > 0 ? "image" : "text",
        contentType: "help_request",
        content: body.trim(),
        visibility: "public",
        priority,
        language: "en",
        helpCategory: category || undefined,
        targetAmount: targetAmount ? Number(targetAmount) : undefined,
        helpRequestPayment:
          accountName || accountNumber || bankName
            ? { accountName, accountNumber, bankName }
            : undefined,
        location: userLocation
          ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
          : undefined,
        media: images.length > 0 ? images : undefined,
      };

      return contentService.createPost(payload);
    },
    onSuccess: () => {
      toast.success("Help request posted!");
      queryClient.invalidateQueries({ queryKey: ["helpRequest"] });
      queryClient.invalidateQueries({ queryKey: ["locationFeed"] });
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to post help request");
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - images.length);
    setImages((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const canProceedStep1 = category !== "" && body.trim().length >= 20;
  const canSubmit = canProceedStep1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg mx-auto bg-brand-black rounded-t-2xl sm:rounded-2xl border border-white/10 overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="text-white/60 hover:text-white p-1 rounded-lg"
              >
                ‹
              </button>
            )}
            <span className="text-white font-semibold text-[15px]">
              {step === 1 ? "Request Help" : "Bank Details"}
            </span>
            <span className="text-white/30 text-xs">
              Step {step} of 2
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {step === 1 && (
            <div className="p-4 space-y-4">
              {/* Category */}
              <div>
                <label className="text-white/70 text-xs font-medium mb-2 block">
                  Category <span className="text-brand-red400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-center transition-all ${
                        category === cat.value
                          ? "border-primary/60 bg-primary/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <span className="text-xl leading-none">
                        {cat.label.split(" ")[0]}
                      </span>
                      <span className="text-[11px] text-white/80 font-medium">
                        {cat.label.split(" ").slice(1).join(" ")}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {cat.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-white/70 text-xs font-medium mb-1.5 block">
                  Describe your situation <span className="text-brand-red400">*</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Explain what help you need, why, and how it will be used…"
                  rows={4}
                  maxLength={1000}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-primary/40"
                />
                <div className="flex justify-between mt-1">
                  {body.trim().length > 0 && body.trim().length < 20 && (
                    <span className="text-brand-red400 text-[11px] flex items-center gap-1">
                      <AlertCircle size={10} /> Minimum 20 characters
                    </span>
                  )}
                  <span className="text-white/30 text-[11px] ml-auto">
                    {body.length}/1000
                  </span>
                </div>
              </div>

              {/* Target Amount */}
              <div>
                <label className="text-white/70 text-xs font-medium mb-1.5 block">
                  Amount needed (₦) <span className="text-white/30">optional</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                    ₦
                  </span>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0"
                    min={0}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/40"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-white/70 text-xs font-medium mb-1.5 block">
                  Urgency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "normal", label: "Normal", color: "text-white/70" },
                      { value: "high", label: "⚠️ High", color: "text-primary" },
                      { value: "critical", label: "🚨 Critical", color: "text-brand-red400" },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPriority(p.value)}
                      className={`py-2 rounded-xl border text-[12px] font-medium transition-all ${
                        priority === p.value
                          ? "border-primary/60 bg-primary/10 text-white"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      } ${p.color}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="text-white/70 text-xs font-medium mb-1.5 block">
                  Photos <span className="text-white/30">optional, up to 4</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative w-16 h-16">
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover rounded-lg border border-white/10"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1 -right-1 bg-brand-red500 rounded-full w-4 h-4 flex items-center justify-center"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <label className="w-16 h-16 border border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-white/40 text-white/30 text-xl">
                      +
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-4 space-y-4">
              <p className="text-white/50 text-[12px]">
                Add your bank details so neighbors can send money directly. You
                can skip this if you don&apos;t want direct transfers.
              </p>

              {/* Bank Name */}
              <div>
                <label className="text-white/70 text-xs font-medium mb-1.5 block">
                  Bank name
                </label>
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. First Bank, GTBank, UBA…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/40"
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="text-white/70 text-xs font-medium mb-1.5 block">
                  Account number
                </label>
                <input
                  value={accountNumber}
                  onChange={(e) =>
                    setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 20))
                  }
                  placeholder="10-digit NUBAN"
                  inputMode="numeric"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/40"
                />
              </div>

              {/* Account Name */}
              <div>
                <label className="text-white/70 text-xs font-medium mb-1.5 block">
                  Account name
                </label>
                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Name as it appears on the account"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/40"
                />
              </div>

              {/* HuudCoin Coming Soon */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5">
                <span className="text-primary text-xl">🪙</span>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-primary">
                    Pay with HuudCoins
                  </p>
                  <p className="text-[11px] text-white/50">
                    Coming soon — HuudCoins will be exchangeable for Naira
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary whitespace-nowrap">
                  SOON
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
          {step === 1 ? (
            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Add bank details →
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={!canProceedStep1 || mutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? "Posting…" : "Post Request"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Posting…" : "Post Help Request"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
