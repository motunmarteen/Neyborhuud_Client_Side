"use client";

interface ReviewItem {
  id: string;
  reviewer?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    profilePicture?: string;
  };
  rating: number;
  review?: string;
  createdAt: string;
}

interface Props {
  review: ReviewItem;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="material-symbols-outlined text-[14px]"
          style={{
            color: s <= rating ? "#facc15" : "var(--neu-text-muted)",
            fontVariationSettings: s <= rating ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function ReviewCard({ review }: Props) {
  const name = review.reviewer
    ? [review.reviewer.firstName, review.reviewer.lastName].filter(Boolean).join(" ") ||
      review.reviewer.username ||
      "Anonymous"
    : "Anonymous";

  return (
    <div className="py-4 last:border-0" style={{ borderBottom: "1px solid var(--neu-shadow-dark)" }}>
      <div className="flex items-start gap-3">
        {review.reviewer?.profilePicture ? (
          <img
            src={review.reviewer.profilePicture}
            alt={name}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full mod-inset flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--neu-text-muted)" }}>person</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold" style={{ color: "var(--neu-text)" }}>{name}</p>
            <p className="text-xs shrink-0" style={{ color: "var(--neu-text-muted)" }}>{formatDate(review.createdAt)}</p>
          </div>
          <StarDisplay rating={review.rating} />
          {review.review && (
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--neu-text-muted)" }}>{review.review}</p>
          )}
        </div>
      </div>
    </div>
  );
}
