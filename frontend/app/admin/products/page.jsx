"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  RefreshCw,
} from "lucide-react";
import {
  useDispatch,
  useSelector,
  selectProducts,
  selectProductPagination,
  selectProductFilters,
  selectProductLoading,
  selectCategories,
} from "@/lib/redux/store";
import {
  fetchProducts,
  deleteProduct,
  updateProductStock,
  fetchCategories,
  productSliceActions,
} from "@/lib/redux/slices/productSlice";
import { triggerToast } from "@/lib/redux/slices/adminSlice";
import { TableSkeleton } from "@/components/admin/SkeletonLoader";
import ConfirmModal from "@/components/admin/ConfirmModal";

export default function AllProductsPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const products = useSelector(selectProducts);
  const pagination = useSelector(selectProductPagination);
  const filters = useSelector(selectProductFilters);
  const loading = useSelector(selectProductLoading);
  const categories = useSelector(selectCategories);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isHardDelete, setIsHardDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Initial load
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchProducts());
  }, [dispatch]);

  // Search debouncer or change handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    dispatch({ type: productSliceActions.SET_FILTERS, payload: { search: value } });
  };

  const handleApplySearch = (e) => {
    e.preventDefault();
    dispatch(fetchProducts({ page: 1 }));
  };

  const handleFilterChange = (name, value) => {
    dispatch({ type: productSliceActions.SET_FILTERS, payload: { [name]: value } });
    dispatch(fetchProducts({ page: 1, [name]: value }));
  };

  const handleSortChange = (sortByField) => {
    const newOrder = filters.sortBy === sortByField && filters.sortOrder === "asc" ? "desc" : "asc";
    dispatch({
      type: productSliceActions.SET_FILTERS,
      payload: { sortBy: sortByField, sortOrder: newOrder },
    });
    dispatch(fetchProducts({ page: 1, sortBy: sortByField, sortOrder: newOrder }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    dispatch(fetchProducts({ page: newPage }));
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteProduct({ id: deleteTarget._id, hardDelete: isHardDelete }));
      dispatch(
        triggerToast(
          isHardDelete
            ? "Product permanently deleted from database and storage"
            : "Product soft deleted. Historical order references preserved.",
          "success"
        )
      );
      setDeleteTarget(null);
      dispatch(fetchProducts());
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to delete product", "error"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Product Catalog</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your store items, monitor stock levels, view GCS media assets, and update catalog pricing.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-900/20 transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <form onSubmit={handleApplySearch} className="w-full lg:w-96 relative">
          <input
            type="text"
            placeholder="Search by product name, SKU, tag, or brand..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </form>

        {/* Filter Select Controls */}
        <div className="w-full lg:w-auto flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Stock Status Filter */}
          <select
            value={filters.stockStatus}
            onChange={(e) => handleFilterChange("stockStatus", e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock (&gt;10)</option>
            <option value="low_stock">Low Stock (&le;10)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          <button
            type="button"
            onClick={() => dispatch(fetchProducts())}
            className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Data Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Products Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No product items match your search or filter criteria. Try resetting filters or create a new product.
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Add Product Now
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSortChange("price")}>
                    <div className="flex items-center gap-1">
                      <span>Price</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSortChange("stock")}>
                    <div className="flex items-center gap-1">
                      <span>Stock</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-4">Status</th>
                  <th className="p-4 cursor-pointer" onClick={() => handleSortChange("createdAt")}>
                    <div className="flex items-center gap-1">
                      <span>Created</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((product) => {
                  const primaryImg =
                    product.images?.find((img) => img.isPrimary)?.publicUrl ||
                    product.images?.[0]?.publicUrl ||
                    "https://placehold.co/100x100?text=No+Image";

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name & Thumbnail */}
                      <td className="p-4">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            <img src={primaryImg} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <Link
                              href={`/admin/products/${product._id}`}
                              className="font-bold text-slate-900 hover:text-emerald-600 truncate transition-colors text-sm"
                            >
                              {product.name}
                            </Link>
                            <span className="text-[10px] text-slate-400 truncate">
                              Brand: {product.brand || "Brundavanam"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="p-4 font-mono text-slate-600 text-xs">{product.sku}</td>

                      {/* Category */}
                      <td className="p-4 text-slate-700 font-semibold">
                        {product.category?.name || "Uncategorized"}
                      </td>

                      {/* Price & Discount */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">₹{product.price}</span>
                          {product.discountPrice > 0 && (
                            <span className="text-[10px] text-rose-500 line-through">
                              ₹{product.discountPrice}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="p-4">
                        {product.stock === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                            <XCircle className="w-3 h-3" /> Out of stock
                          </span>
                        ) : product.stock <= 10 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Low ({product.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> In stock ({product.stock})
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {product.isActive ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="p-4 text-slate-500 text-[11px]">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/products/${product._id}`}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/products/${product._id}/edit`}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(product);
                              setIsHardDelete(false);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Showing page <span className="font-bold text-slate-900">{pagination.page}</span> of{" "}
              <span className="font-bold text-slate-900">{pagination.totalPages}</span> ({pagination.total} total products)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-xs"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete Product: ${deleteTarget?.name}`}
        message="Soft Delete preserves historical order records, while Hard Delete removes all associated GCS images and database documents permanently."
        confirmText={isHardDelete ? "Permanently Delete" : "Soft Delete"}
        type="danger"
        isLoading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
