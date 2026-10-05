"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  X,
  Sparkles,
  ShoppingBag,
  Filter,
} from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import FilterSidebar, { PRICE_BANDS } from "@/components/shop/FilterSidebar";
import FilterSheet from "@/components/shop/FilterSheet";
import SortSheet from "@/components/shop/SortSheet";
import EmptyState from "@/components/ui/EmptyState";
import { sortProducts, SORT_OPTIONS } from "@/components/shop/sortOptions";
import { CATEGORIES } from "@/lib/mockCategories";
import { useSelector, selectCategories } from "@/lib/redux/store";

const EMPTY_FILTERS = { categories: [], priceBands: [], inStockOnly: false };

export default function ShopView({ products = [] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "";

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [filters, setFilters] = useState({
    categories: urlCategory && urlCategory !== "all" ? [urlCategory] : [],
    priceBands: [],
    inStockOnly: false,
  });
  const [sort, setSort] = useState("featured");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const reduxCategories = useSelector(selectCategories);
  const availableCategories =
    reduxCategories && reduxCategories.length > 0
      ? reduxCategories.filter((c) => !c.parent)
      : CATEGORIES;

  // Sync state if URL query params change
  useEffect(() => {
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
    if (urlCategory && urlCategory !== "all" && !filters.categories.includes(urlCategory)) {
      setFilters((prev) => ({ ...prev, categories: [urlCategory] }));
    }
  }, [urlSearch, urlCategory]);

  // Filter & Sort Pipeline
  const filtered = useMemo(() => {
    let list = Array.isArray(products) ? [...products] : [];

    // Search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some?.((t) => t.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      list = list.filter((p) => {
        const catSlug = typeof p.category === "object" ? p.category?.slug : p.category;
        const catId = typeof p.category === "object" ? p.category?._id : p.category;
        return filters.categories.includes(catSlug) || filters.categories.includes(catId);
      });
    }

    // Price bands filter
    if (filters.priceBands.length > 0) {
      const bands = PRICE_BANDS.filter((b) => filters.priceBands.includes(b.id));
      list = list.filter((p) => bands.some((b) => b.test(p)));
    }

    // Availability filter
    if (filters.inStockOnly) {
      list = list.filter(
        (p) => p.stock > 0 || p.variants?.some?.((v) => v.stock > 0)
      );
    }

    return sortProducts(list, sort);
  }, [products, searchTerm, filters, sort]);

  const activeFilterCount =
    filters.categories.length +
    filters.priceBands.length +
    (filters.inStockOnly ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  // Quick category pill click
  const handlePillClick = (catIdOrSlug) => {
    if (catIdOrSlug === "all") {
      setFilters((prev) => ({ ...prev, categories: [] }));
    } else {
      setFilters((prev) => ({
        ...prev,
        categories: prev.categories.includes(catIdOrSlug) ? [] : [catIdOrSlug],
      }));
    }
  };

  const clearAllFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchTerm("");
    router.push("/shop");
  };

  return (
    <div className="mx-auto max-w-content px-4 sm:px-6 py-8 md:px-8 md:py-12 space-y-8">
      {/* 1. Shop Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#20180f] via-[#2c2215] to-[#1c1813] text-[#faf3e0] p-6 sm:p-10 shadow-lg">
        <div className="max-w-2xl space-y-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
            <Sparkles size={13} className="text-amber-400" />
            <span>Sacred Ahimsa Store</span>
          </span>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
            The Goshala Store
          </h1>
          <p className="text-xs sm:text-sm text-[#ded4be] leading-relaxed">
            Pure A2 Gir Cow Bilona Ghee, natural Gau Dhoop, temple puja essentials, and chemical-free wellness crafted with devotion.
          </p>
        </div>
      </div>

      {/* 2. Quick Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => handlePillClick("all")}
          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-2xs ${
            filters.categories.length === 0
              ? "bg-accent text-surface shadow-accent/20"
              : "bg-surface border border-line text-ink-soft hover:text-ink hover:bg-bg"
          }`}
        >
          All Offerings ({products.length})
        </button>

        {availableCategories.map((cat) => {
          const isSelected =
            filters.categories.includes(cat.slug) ||
            filters.categories.includes(cat._id);
          return (
            <button
              key={cat._id || cat.slug}
              type="button"
              onClick={() => handlePillClick(cat.slug || cat._id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-2xs ${
                isSelected
                  ? "bg-accent text-surface shadow-accent/20"
                  : "bg-surface border border-line text-ink-soft hover:text-ink hover:bg-bg"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* 3. Main Catalog Layout */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Filter Sidebar */}
        <FilterSidebar filters={filters} onChange={setFilters} />

        {/* Products Grid & Controls Container */}
        <div className="flex-1 space-y-6">
          {/* Controls Bar: Search, Result Count, Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl border border-line bg-surface shadow-xs">
            {/* Inline Search Bar */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name or herb..."
                className="w-full rounded-xl border border-line bg-bg/50 pl-9 pr-8 py-2 text-xs text-ink placeholder:text-ink-soft/70 outline-none focus:border-accent focus:bg-white transition-all"
              />
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/70"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results Count & Sort Dropdown */}
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="text-xs font-semibold text-ink-soft whitespace-nowrap">
                {filtered.length} {filtered.length === 1 ? "product" : "products"}
              </span>

              {/* Desktop Sort Select */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-ink-soft whitespace-nowrap">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-xl border border-line bg-bg/50 px-3 py-1.5 text-xs font-semibold text-ink outline-none cursor-pointer hover:border-accent transition-colors"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Trigger Buttons */}
              <div className="flex sm:hidden items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterSheetOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink"
                >
                  <SlidersHorizontal size={14} />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="h-4 min-w-[16px] rounded-full bg-accent text-[10px] text-white flex items-center justify-center font-bold px-1">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSortSheetOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink"
                >
                  <ArrowUpDown size={14} />
                  <span>Sort</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">
                Active Filters:
              </span>
              {searchTerm.trim() && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-xs font-medium text-accent-deep">
                  <span>Search: "{searchTerm}"</span>
                  <button type="button" onClick={() => setSearchTerm("")}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {filters.categories.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-xs font-medium text-accent-deep"
                >
                  <span>Category: {c}</span>
                  <button type="button" onClick={() => handlePillClick(c)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              {filters.inStockOnly && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-800">
                  <span>In Stock Only</span>
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, inStockOnly: false }))}
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-bold text-rose-600 hover:underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Product Grid or Empty State */}
          {filtered.length === 0 ? (
            <EmptyState
              title="No products match your criteria"
              message="Try broadening your search term or clearing one of the filters to view available products."
              actionLabel="Reset All Filters"
              onAction={clearAllFilters}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.slug || product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter & Sort Sheets */}
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
