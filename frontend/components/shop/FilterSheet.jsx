"use client";

import BottomSheet from "@/components/ui/BottomSheet";
import { CATEGORIES } from "@/lib/mockCategories";
import { FilterSection, Checkbox, PRICE_BANDS } from "@/components/shop/FilterSidebar";
import Button from "@/components/ui/Button";

export default function FilterSheet({ open, onClose, filters, onChange, resultCount }) {
  const toggleCategory = (slug) => {
    const next = filters.categories.includes(slug)
      ? filters.categories.filter((c) => c !== slug)
      : [...filters.categories, slug];
    onChange({ ...filters, categories: next });
  };

  const togglePriceBand = (id) => {
    const next = filters.priceBands.includes(id)
      ? filters.priceBands.filter((p) => p !== id)
      : [...filters.priceBands, id];
    onChange({ ...filters, priceBands: next });
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Filters">
      <FilterSection title="Category">
        {CATEGORIES.map((cat) => (
          <Checkbox
            key={cat.slug}
            label={cat.name}
            checked={filters.categories.includes(cat.slug)}
            onChange={() => toggleCategory(cat.slug)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Price">
        {PRICE_BANDS.map((band) => (
          <Checkbox
            key={band.id}
            label={band.label}
            checked={filters.priceBands.includes(band.id)}
            onChange={() => togglePriceBand(band.id)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Availability">
        <Checkbox
          label="In stock only"
          checked={filters.inStockOnly}
          onChange={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}
        />
      </FilterSection>

      <div className="mt-2 flex gap-3 pb-2">
        <button
          type="button"
          onClick={() =>
            onChange({ categories: [], priceBands: [], inStockOnly: false })
          }
          className="flex-1 rounded border border-ink py-3 text-sm text-ink"
        >
          Clear all
        </button>
        <Button onClick={onClose} className="flex-1">
          Show {resultCount} results
        </Button>
      </div>
    </BottomSheet>
  );
}
