"use client";

interface Props {
  value: number; // 0–5
  size?: "sm" | "md" | "lg";
  onChange?: (rating: number) => void;
}

const SIZE_CLASS = {
  sm: "text-[14px]",
  md: "text-[18px]",
  lg: "text-[24px]",
};

export default function StarRating({ value, size = "md", onChange }: Props) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            disabled={!onChange}
            className={`transition-colors ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
          >
            <span
              className={`material-symbols-outlined ${SIZE_CLASS[size]} ${filled ? "text-primary400" : "text-[var(--neu-text-secondary)]"}`}
              style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          </button>
        );
      })}
    </div>
  );
}
