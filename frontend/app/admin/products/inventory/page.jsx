"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Minus,
  Save,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  ArrowUpDown,
  Package,
  Layers,
} from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";
import { TableSkeleton } from "@/components/admin/SkeletonLoader";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("all"); // all, low_stock, out_of_stock, in_stock
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });

  // Local editing states: { [productId]: number }
  const [editedStock, setEditedStock] = useState({});
  // Variant editing states: { [variantId]: number }
  const [editedVariantStock, setEditedVariantStock] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [expandedVariants, setExpandedVariants] = useState({});

  // Summary Metrics
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiClient.get("/categories?all=true");
      if (res.data) setCategories(res.data);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }, []);

  // Fetch Inventory
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit: 10,
        sortBy: "stock",
        sortOrder: "asc",
      };
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (stockStatus !== "all") params.stockStatus = stockStatus;

      const res = await apiClient.get("/admin/products", params);
      if (res.success && res.data) {
        setProducts(res.data);
        setPagination({
          total: res.pagination?.total || 0,
          totalPages: res.pagination?.totalPages || 1,
          limit: res.pagination?.limit || 10,
        });

        // Initialize local stock states
        const initialStock = {};
        const initialVarStock = {};
        res.data.forEach((p) => {
          initialStock[p._id] = p.stock;
          if (p.variants && p.variants.length > 0) {
            p.variants.forEach((v) => {
              initialVarStock[v._id] = v.stock;
            });
          }
        });
        setEditedStock((prev) => ({ ...initialStock, ...prev }));
        setEditedVariantStock((prev) => ({ ...initialVarStock, ...prev }));
      }
    } catch (err) {
      console.error("Failed to load inventory:", err.message);
      setError(err.message || "Unable to fetch inventory.");
    } finally {
      setLoading(false);
    }
  }, [page, search, category, stockStatus]);

  // Fetch aggregate stock metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await apiClient.get("/admin/products", { limit: 200 });
      if (res.success && res.data) {
        const prods = res.data;
        let totalUnits = 0;
        let low = 0;
        let out = 0;
        prods.forEach((p) => {
          totalUnits += Number(p.stock) || 0;
          if (p.stock === 0) out++;
          else if (p.stock <= 10) low++;
        });
        setMetrics({
          totalProducts: res.pagination?.total || prods.length,
          totalUnits,
          lowStockCount: low,
          outOfStockCount: out,
        });
      }
    } catch (e) {
      console.warn("Metrics fetch error:", e);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchMetrics();
  }, [fetchCategories, fetchMetrics]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInventory();
  };

  const toggleVariants = (id) => {
    setExpandedVariants((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStockChange = (productId, delta) => {
    setEditedStock((prev) => {
      const current = prev[productId] !== undefined ? prev[productId] : 0;
      return { ...prev, [productId]: Math.max(0, current + delta) };
    });
  };

  const handleVariantStockChange = (variantId, delta) => {
    setEditedVariantStock((prev) => {
      const current = prev[variantId] !== undefined ? prev[variantId] : 0;
      return { ...prev, [variantId]: Math.max(0, current + delta) };
    });
  };

  const saveProductStock = async (product) => {
    setSavingId(product._id);
    try {
      const newStock = Number(editedStock[product._id]);
      const payload = { stock: newStock };

      // If product has variants, include updated variant values
      if (product.variants && product.variants.length > 0) {
        payload.variants = product.variants.map((v) => ({
          _id: v._id,
          stock: editedVariantStock[v._id] !== undefined ? Number(editedVariantStock[v._id]) : v.stock,
        }));
      }

      const res = await apiClient.patch(`/admin/products/${product._id}/stock`, payload);
      if (res.success) {
        showToast(`Stock updated for "${product.name}" to ${newStock} units`);
        setProducts((prev) =>
          prev.map((p) => (p._id === product._id ? { ...p, stock: newStock, variants: res.data?.variants || p.variants } : p))
        );
        fetchMetrics();
      }
    } catch (err) {
      showToast(err.message || "Failed to update stock", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === "error"
              ? "bg-rose-600 text-white shadow-rose-900/20"
              : "bg-emerald-600 text-white shadow-emerald-900/20"
          }`}
        >
          {toast.type === "error" ? <XCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-emerald-600" />
            Inventory &amp; Stock Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time warehouse stock tracking, low-inventory alerts, and quick batch adjustments.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchInventory();
              fetchMetrics();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Total Products</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{metrics.totalProducts}</span>
            <Package className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active catalog items</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Total Warehouse Stock</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{metrics.totalUnits}</span>
            <Boxes className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Units available for dispatch</span>
        </div>

        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-xs font-semibold text-amber-800 block mb-1">Low Stock Alert (&le; 10)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-900">{metrics.lowStockCount}</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <button
            onClick={() => {
              setStockStatus("low_stock");
              setPage(1);
            }}
            className="text-[11px] font-bold text-amber-700 hover:underline mt-1 block"
          >
            Filter low stock &rarr;
          </button>
        </div>

        <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-xs">
          <span className="text-xs font-semibold text-rose-800 block mb-1">Out of Stock (0 units)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-900">{metrics.outOfStockCount}</span>
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
          <button
            onClick={() => {
              setStockStatus("out_of_stock");
              setPage(1);
            }}
            className="text-[11px] font-bold text-rose-700 hover:underline mt-1 block"
          >
            Filter out of stock &rarr;
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Stock Level Filter */}
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (&gt; 10 units)</option>
            <option value="low_stock">Low Stock (1–10 units)</option>
            <option value="out_of_stock">Out of Stock (0 units)</option>
          </select>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchInventory} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">SKU</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Stock Health</th>
                <th className="px-5 py-3.5 text-center">Quick Stock Adjust</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    <TableSkeleton rows={6} />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium">No products matching the selected criteria.</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const currentStock =
                    editedStock[product._id] !== undefined ? editedStock[product._id] : product.stock;
                  const isModified = currentStock !== product.stock;
                  const hasVariants = product.variants && product.variants.length > 0;
                  const isExpanded = !!expandedVariants[product._id];
                  const primaryImg = product.images?.find((i) => i.isPrimary) || product.images?.[0];

                  return (
                    <React.Fragment key={product._id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        {/* Product Column */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                              {primaryImg?.publicUrl ? (
                                <img
                                  src={primaryImg.publicUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 max-w-xs">
                              <span className="font-bold text-slate-900 truncate" title={product.name}>
                                {product.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                <span>{product.brand || "Brundavanam"}</span>
                                {hasVariants && (
                                  <button
                                    onClick={() => toggleVariants(product._id)}
                                    className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold hover:underline"
                                  >
                                    <Layers className="w-3 h-3" />
                                    {product.variants.length} Variants
                                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-5 py-4">
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                            {product.sku || "N/A"}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4 text-slate-600 font-medium">
                          {product.category?.name || "Uncategorized"}
                        </td>

                        {/* Stock Health Status */}
                        <td className="px-5 py-4">
                          {currentStock === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Out of Stock
                            </span>
                          ) : currentStock <= 10 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low Stock ({currentStock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> In Stock ({currentStock})
                            </span>
                          )}
                        </td>

                        {/* Quick Stock Controls */}
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => handleStockChange(product._id, -1)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Decrease by 1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={currentStock}
                              onChange={(e) =>
                                setEditedStock((prev) => ({
                                  ...prev,
                                  [product._id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                                }))
                              }
                              className="w-14 text-center bg-white border border-slate-200 rounded-lg py-1 font-bold text-xs text-slate-900 outline-none focus:border-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleStockChange(product._id, 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Increase by 1"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            {isModified && (
                              <button
                                type="button"
                                onClick={() => saveProductStock(product)}
                                disabled={savingId === product._id}
                                className="ml-1 px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-xs"
                              >
                                <Save className="w-3 h-3" />
                                {savingId === product._id ? "Saving..." : "Save"}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/products/${product._id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition-colors text-[11px]"
                            >
                              Edit Product &rarr;
                            </Link>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Variants Breakdown */}
                      {hasVariants && isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan="6" className="px-8 py-3">
                            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                              <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider block mb-2">
                                Variants Stock Distribution ({product.name}):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {product.variants.map((v) => {
                                  const vStock =
                                    editedVariantStock[v._id] !== undefined
                                      ? editedVariantStock[v._id]
                                      : v.stock;
                                  return (
                                    <div
                                      key={v._id}
                                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <span className="font-bold text-slate-800 block">{v.label}</span>
                                        <span className="font-mono text-[10px] text-slate-400">
                                          SKU: {v.sku || product.sku}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleVariantStockChange(v._id, -1)}
                                          className="p-1 rounded bg-white border text-slate-600 hover:bg-slate-100"
                                        >
                                          <Minus className="w-2.5 h-2.5" />
                                        </button>
                                        <span className="font-bold text-slate-900 w-8 text-center">{vStock}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleVariantStockChange(v._id, 1)}
                                          className="p-1 rounded bg-white border text-slate-600 hover:bg-slate-100"
                                        >
                                          <Plus className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => saveProductStock(product)}
                                  disabled={savingId === product._id}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  {savingId === product._id ? "Saving Variant Stock..." : "Save Variant Stock"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && products.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 text-xs">
            <span className="text-slate-500">
              Showing {(page - 1) * pagination.limit + 1} to{" "}
              {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} catalog items
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
