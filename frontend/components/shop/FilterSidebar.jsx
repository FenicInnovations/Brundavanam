"use client";

import { useSelector, selectCategories } from "@/lib/redux/store";
import { CATEGORIES } from "@/lib/mockCategories";

const PRICE_BANDS = [
  { id: "under-200", label: "Under ₹200", test: (p) => p.basePrice < 200 },
  { id: "200-500", label: "₹200 – ₹500", test: (p) => p.basePrice >= 200 && p.basePrice <= 500 },
  { id: "500-1000", label: "₹500 – ₹1,000", test: (p) => p.basePrice > 500 && p.basePrice <= 1000 },
  { id: "over-1000", label: "Over ₹1,000", test: (p) => p.basePrice > 1000 },
];

/**
 * Desktop-only filter panel. Mirrors FilterSheet's fields exactly so the
 * two never drift — the same `filters` state powers both.
 */
export default function FilterSidebar({ filters, onChange, categories }) {
  const reduxCategories = useSelector(selectCategories);
  const categoriesList =
    categories && categories.length > 0
      ? categories
      : reduxCategories && reduxCategories.length > 0
      ? reduxCategories.filter((c) => !c.parent)
      : CATEGORIES;

  const toggleCategory = (slugOrId) => {
    const next = filters.categories.includes(slugOrId)
      ? filters.categories.filter((c) => c !== slugOrId)
      : [...filters.categories, slugOrId];
    onChange({ ...filters, categories: next });
  };

  const togglePriceBand = (id) => {
    const next = filters.priceBands.includes(id)
      ? filters.priceBands.filter((p) => p !== id)
      : [...filters.priceBands, id];
    onChange({ ...filters, priceBands: next });
  };

  return (
    <aside className="hidden w-56 shrink-0 md:block">
      <div className="sticky top-[calc(var(--header-height)+24px)]">
        <FilterSection title="Category">
          {categoriesList.map((cat) => {
            const val = cat.slug || cat._id;
            return (
              <Checkbox
                key={val}
                label={cat.name}
                checked={filters.categories.includes(val) || filters.categories.includes(cat._id) || filters.categories.includes(cat.slug)}
                onChange={() => toggleCategory(val)}
              />
            );
          })}
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
      </div>
    </aside>
  );
}

export function FilterSection({ title, children }) {
  return (
    <div className="border-b py-5 first:pt-0">
      <p className="text-sm font-medium text-ink">{title}</p>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </div>
  );
}

export function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded-sm accent-accent"
      />
      {label}
    </label>
  );
}

export { PRICE_BANDS };
