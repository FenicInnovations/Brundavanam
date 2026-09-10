"use client";

import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { SORT_OPTIONS } from "@/components/shop/sortOptions";

export default function ShopControls({
  resultCount,
  activeFilterCount,
  sort,
  onSortChange,
  onOpenFilters,
  onOpenSort,
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <p className="text-sm text-ink-soft">{resultCount} products</p>

      {/* Desktop: inline select. Mobile: sheet-opening buttons. */}
      <div className="hidden items-center gap-2 md:flex">
        <label htmlFor="sort" className="text-sm text-ink-soft">
          Sort by
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded border bg-surface px-3 py-2 text-sm text-ink"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex items-center gap-1.5 rounded border px-3 py-2 text-sm text-ink"
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-surface">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onOpenSort}
          className="flex items-center gap-1.5 rounded border px-3 py-2 text-sm text-ink"
        >
          <ArrowUpDown size={15} />
          Sort
        </button>
      </div>
    </div>
  );
}
