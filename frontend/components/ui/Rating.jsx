import { Star } from "lucide-react";

/**
 * Read-only star rating. `size` controls icon size; `showCount` appends
 * the review count in parentheses.
 */
export default function Rating({ value = 0, count, size = 14, showCount = true }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.round(value);
          return (
            <Star
              key={i}
              size={size}
              className={filled ? "text-accent" : "text-line"}
              fill={filled ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      <span className="sr-only">{value.toFixed(1)} out of 5 stars</span>
      {showCount && count != null && (
        <span className="text-xs text-ink-soft">({count})</span>
      )}
    </div>
  );
}
