import { PackageSearch } from "lucide-react";
import Button from "@/components/ui/Button";

export default function EmptyState({
  title = "No products found",
  message = "Try adjusting your filters or search.",
  actionLabel,
  actionHref,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <PackageSearch size={36} strokeWidth={1.3} className="text-ink-soft" />
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="max-w-xs text-sm text-ink-soft">{message}</p>
      {actionLabel && actionHref && (
        <Button href={actionHref} variant="secondary" className="mt-2">
          {actionLabel}
        </Button>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction} variant="secondary" className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
