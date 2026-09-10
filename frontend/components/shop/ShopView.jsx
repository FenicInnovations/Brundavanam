"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import FilterSidebar, { PRICE_BANDS } from "@/components/shop/FilterSidebar";
import FilterSheet from "@/components/shop/FilterSheet";
import SortSheet from "@/components/shop/SortSheet";
import ShopControls from "@/components/shop/ShopControls";
import EmptyState from "@/components/ui/EmptyState";
import { sortProducts } from "@/components/shop/sortOptions";

const EMPTY_FILTERS = { categories: [], priceBands: [], inStockOnly: false };

export default function ShopView({ products }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState("featured");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = products;

    if (filters.categories.length) {
      list = list.filter((p) => filters.categories.includes(p.category));
    }

    if (filters.priceBands.length) {
      const bands = PRICE_BANDS.filter((b) => filters.priceBands.includes(b.id));
      list = list.filter((p) => bands.some((b) => b.test(p)));
    }

    if (filters.inStockOnly) {
      list = list.filter((p) => p.variants.some((v) => v.stock > 0));
    }

    return sortProducts(list, sort);
  }, [products, filters, sort]);

  const activeFilterCount =
    filters.categories.length + filters.priceBands.length + (filters.inStockOnly ? 1 : 0);

  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
      <h1 className="font-display text-2xl text-ink md:text-3xl">Shop</h1>

      <div className="mt-8 flex gap-10">
        <FilterSidebar filters={filters} onChange={setFilters} />

        <div className="flex-1">
          <ShopControls
            resultCount={filtered.length}
            activeFilterCount={activeFilterCount}
            sort={sort}
            onSortChange={setSort}
            onOpenFilters={() => setFilterSheetOpen(true)}
            onOpenSort={() => setSortSheetOpen(true)}
          />

          {filtered.length === 0 ? (
            <EmptyState
              title="No products match those filters"
              message="Try clearing a filter to see more products."
              actionLabel="Clear filters"
              onAction={() => setFilters(EMPTY_FILTERS)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        onChange={setFilters}
        resultCount={filtered.length}
      />
      <SortSheet
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        value={sort}
        onChange={setSort}
      />
    </div>
  );
}
