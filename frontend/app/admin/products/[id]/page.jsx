"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Tag,
  DollarSign,
  Layers,
  FileText,
  Star,
  Globe,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Boxes,
  Loader2,
} from "lucide-react";
import {
  useDispatch,
  useSelector,
  selectSelectedProduct,
  selectProductLoading,
} from "@/lib/redux/store";
import { fetchProductById, deleteProduct, updateProductStock } from "@/lib/redux/slices/productSlice";
import { triggerToast } from "@/lib/redux/slices/adminSlice";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { FormSkeleton } from "@/components/admin/SkeletonLoader";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const product = useSelector(selectSelectedProduct);
  const loading = useSelector(selectProductLoading);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [stockEditOpen, setStockEditOpen] = useState(false);
  const [newStock, setNewStock] = useState("");
  const [variantStocks, setVariantStocks] = useState({});
  const [updatingStock, setUpdatingStock] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync variant stocks into local state when product loads / stock editor opens
  const handleOpenStockEdit = () => {
    setNewStock(String(product.stock ?? ""));
    const vs = {};
    (product.variants || []).forEach((v) => { vs[v._id] = String(v.stock ?? 0); });
    setVariantStocks(vs);
    setStockEditOpen(true);
  };

  useEffect(() => {
    if (params?.id) {
      dispatch(fetchProductById(params.id));
    }
  }, [dispatch, params?.id]);

  if (loading || !product || product._id !== params?.id) {
    return <FormSkeleton />;
  }

  const images = product.images || [];
  const activeImage = images[activeImageIndex]?.publicUrl || "https://placehold.co/500x500?text=No+Image";

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    setUpdatingStock(true);
    try {
      const variantsPayload = Object.entries(variantStocks).map(([_id, stock]) => ({
        _id,
        stock: Number(stock) || 0,
      }));
      await dispatch(updateProductStock({
        id: product._id,
        stock: newStock !== "" ? Number(newStock) : undefined,
        variants: variantsPayload.length > 0 ? variantsPayload : undefined,
      }));
      dispatch(triggerToast("Stock updated successfully", "success"));
      setStockEditOpen(false);
      dispatch(fetchProductById(params.id)); // Refresh
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to update stock", "error"));
    } finally {
      setUpdatingStock(false);
    }
  };


  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteProduct({ id: product._id, hardDelete: false }));
      dispatch(triggerToast("Product soft deleted successfully", "success"));
      router.push("/admin/products");
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to delete product", "error"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
              {product.isActive ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              SKU: {product.sku} • Slug: /{product.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/products/${product._id}/edit`}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
          >
            <Edit className="w-4 h-4" /> Edit Product
          </Link>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Images Gallery & Details) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery Component */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Product Images Gallery ({images.length})
            </h3>
            <div className="aspect-video w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 relative flex items-center justify-center">
              <img src={activeImage} alt={product.name} className="w-full h-full object-contain" />
            </div>

            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 relative bg-white transition-all ${
                      idx === activeImageIndex ? "border-emerald-600 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img src={img.publicUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    {img.isPrimary && (
                      <span className="absolute top-1 left-1 bg-emerald-600 text-white p-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5 fill-current" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Descriptions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Descriptions & Content
            </h3>
            {product.shortDescription && (
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">Short Summary</span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {product.shortDescription}
                </p>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">Full Description</span>
              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                {product.description || "No full description provided."}
              </div>
            </div>
          </div>

          {/* Variants & Attachments */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            {/* Variants */}
            {product.variants?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Configured Variants</span>
                </h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                  {product.variants.map((v, i) => (
                    <div key={i} className="p-3 flex items-center justify-between">
                      <span className="font-bold text-slate-900">{v.label}</span>
                      <span className="text-emerald-700 font-semibold">₹{v.price}</span>
                      <span className="text-slate-500">Stock: {v.stock}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Attachments */}
            {product.files?.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>PDF / Document Attachments</span>
                </h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                  {product.files.map((f, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <span className="font-semibold text-slate-800">{f.fileName}</span>
                      <a
                        href={f.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>Download</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Metadata */}
        <div className="space-y-8">
          {/* Inventory & Quick Stock Update */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-600" /> Inventory Status
              </span>
              <button
                type="button"
                onClick={handleOpenStockEdit}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                Quick Edit
              </button>
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Base Stock</span>
              <span className="text-2xl font-extrabold text-slate-900">{product.stock}</span>
            </div>

            {/* Show variant-level stocks */}
            {product.variants?.length > 0 && (
              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Variant Stock</p>
                {product.variants.map((v) => (
                  <div key={v._id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{v.label}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-lg ${v.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {v.stock > 0 ? `${v.stock} in stock` : "OUT OF STOCK ⚠️"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {stockEditOpen && (
              <form onSubmit={handleStockUpdate} className="pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Base Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="Base stock count"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>

                {/* Variant stock inputs */}
                {product.variants?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Variant Stock</p>
                    {product.variants.map((v) => (
                      <div key={v._id}>
                        <label className="text-xs text-slate-600 block mb-1">{v.label}</label>
                        <input
                          type="number"
                          min="0"
                          value={variantStocks[v._id] ?? v.stock}
                          onChange={(e) => setVariantStocks((prev) => ({ ...prev, [v._id]: e.target.value }))}
                          placeholder={`Stock for ${v.label}`}
                          className="w-full px-3 py-2 border rounded-xl text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updatingStock}
                  className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                >
                  {updatingStock ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save All Stock"}
                </button>
                <button type="button" onClick={() => setStockEditOpen(false)} className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-700">Cancel</button>
              </form>
            )}
          </div>


          {/* Pricing Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Pricing Structure
            </h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Regular Price:</span>
              <span className="font-bold text-slate-900 text-base">₹{product.price}</span>
            </div>
            {product.discountPrice > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Discount Strike Price:</span>
                <span className="font-bold text-rose-600">₹{product.discountPrice}</span>
              </div>
            )}
          </div>

          {/* Categories & Organization */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" /> Category & Brand
            </h3>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-semibold text-slate-900">{product.category?.name || "None"}</span>
            </div>
            {product.subcategory && (
              <div className="flex justify-between">
                <span className="text-slate-500">Subcategory:</span>
                <span className="font-semibold text-slate-900">{product.subcategory?.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Brand:</span>
              <span className="font-semibold text-slate-900">{product.brand || "Brundavanam"}</span>
            </div>
          </div>

          {/* System Audit Timestamps */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-[11px] text-slate-500">
            <div className="flex justify-between">
              <span>Created At:</span>
              <span className="font-mono text-slate-700">{new Date(product.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated:</span>
              <span className="font-mono text-slate-700">{new Date(product.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title={`Delete Product: ${product.name}`}
        message="Soft Delete preserves order history while preventing future customer purchases."
        confirmText="Confirm Soft Delete"
        type="danger"
        isLoading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
