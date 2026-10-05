"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Tag,
  Layers,
  DollarSign,
  Package,
  Globe,
  Loader2,
  CheckCircle2,
  FolderPlus,
  ExternalLink,
} from "lucide-react";
import ImageUploader from "./ImageUploader";
import FileUploader from "./FileUploader";
import { useDispatch, useSelector, selectCategories, selectProductSubmitting } from "@/lib/redux/store";
import { createProduct, updateProduct, fetchCategories, createCategory } from "@/lib/redux/slices/productSlice";
import { triggerToast } from "@/lib/redux/slices/adminSlice";

export default function ProductForm({ initialData = null, isEdit = false }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const categories = useSelector(selectCategories);
  const submitting = useSelector(selectProductSubmitting);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    brand: "Brundavanam",
    sku: "",
    category: "",
    subcategory: "",
    shortDescription: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "",
    images: [],
    files: [],
    variants: [],
    attributes: [],
    tags: "",
    isFeatured: false,
    isActive: true,
    seoTitle: "",
    seoDescription: "",
  });

  const [attributeInput, setAttributeInput] = useState({ name: "", value: "" });
  const [variantInput, setVariantInput] = useState({ label: "", price: "", stock: "", sku: "" });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Load existing product into form state when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        slug: initialData.slug || "",
        brand: initialData.brand || "Brundavanam",
        sku: initialData.sku || "",
        category: initialData.category?._id || initialData.category || "",
        subcategory: initialData.subcategory?._id || initialData.subcategory || "",
        shortDescription: initialData.shortDescription || "",
        description: initialData.description || "",
        price: initialData.price !== undefined ? initialData.price : "",
        discountPrice: initialData.discountPrice !== undefined ? initialData.discountPrice : "",
        stock: initialData.stock !== undefined ? initialData.stock : "",
        images: initialData.images || [],
        files: initialData.files || [],
        variants: initialData.variants || [],
        attributes: initialData.attributes || [],
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(", ") : "",
        isFeatured: Boolean(initialData.isFeatured),
        isActive: initialData.isActive !== undefined ? Boolean(initialData.isActive) : true,
        seoTitle: initialData.seoTitle || "",
        seoDescription: initialData.seoDescription || "",
      });
    }
  }, [initialData]);

  // Handle standard input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Add custom attribute (e.g. Origin: "Desi Gir Cow")
  const addAttribute = () => {
    if (!attributeInput.name.trim() || !attributeInput.value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { name: attributeInput.name.trim(), value: attributeInput.value.trim() }],
    }));
    setAttributeInput({ name: "", value: "" });
  };

  const removeAttribute = (index) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, idx) => idx !== index),
    }));
  };

  // Add variant (e.g. 500ml, 1L)
  const addVariant = () => {
    if (!variantInput.label.trim() || !variantInput.price) return;
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          label: variantInput.label.trim(),
          price: Number(variantInput.price),
          stock: Number(variantInput.stock || 0),
          sku: variantInput.sku.trim(),
        },
      ],
    }));
    setVariantInput({ label: "", price: "", stock: "", sku: "" });
  };

  const removeVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index),
    }));
  };

  const handleQuickCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      dispatch(triggerToast("Category name is required", "error"));
      return;
    }
    setCreatingCat(true);
    try {
      const created = await dispatch(createCategory({ name: newCatName.trim(), description: newCatDesc }));
      if (created?.data?._id || created?._id) {
        const catId = created.data?._id || created._id;
        setFormData((prev) => ({ ...prev, category: catId }));
      }
      dispatch(triggerToast(`Category '${newCatName}' created and selected!`, "success"));
      setShowCategoryModal(false);
      setNewCatName("");
      setNewCatDesc("");
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to create category", "error"));
    } finally {
      setCreatingCat(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      dispatch(triggerToast("Product name is required", "error"));
      return;
    }
    if (!formData.price || Number(formData.price) < 0) {
      dispatch(triggerToast("Valid price is required", "error"));
      return;
    }
    if (!formData.category) {
      dispatch(triggerToast("Category selection is required", "error"));
      return;
    }

    if (formData.images.some((img) => img.isUploading)) {
      dispatch(triggerToast("Please wait for images to finish uploading to Google Cloud Storage", "warning"));
      return;
    }

    const formattedTags = formData.tags
      ? formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const cleanedImages = (formData.images || []).map((img, idx) => ({
      fileId: img.fileId,
      fileName: img.fileName,
      fileType: img.fileType || "image",
      mimeType: img.mimeType,
      size: img.size,
      bucketName: img.bucketName || "radhakrishnan",
      storagePath: img.storagePath,
      publicUrl: img.publicUrl,
      isPrimary: Boolean(img.isPrimary),
      displayOrder: img.displayOrder !== undefined ? img.displayOrder : idx,
    }));

    const payload = {
      ...formData,
      images: cleanedImages,
      price: Number(formData.price),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : 0,
      stock: formData.stock ? Number(formData.stock) : 0,
      tags: formattedTags,
    };

    try {
      if (isEdit && initialData?._id) {
        await dispatch(updateProduct({ id: initialData._id, data: payload }));
        dispatch(triggerToast("Product updated successfully", "success"));
      } else {
        await dispatch(createProduct(payload));
        dispatch(triggerToast("Product created successfully", "success"));
      }
      router.push("/admin/products");
    } catch (err) {
      dispatch(triggerToast(err.message || "Operation failed", "error"));
    }
  };

  const mainCategories = categories.filter((c) => !c.parent);
  const subCategories = categories.filter(
    (c) => c.parent && (typeof c.parent === "object" ? c.parent._id === formData.category : c.parent === formData.category)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? `Edit Product: ${initialData?.name}` : "Create New Product"}
            </h1>
            <p className="text-xs text-slate-500">
              Configure product details, categories, pricing, GCS media assets, and SEO metadata.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isEdit ? "Update Product" : "Publish Product"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main 2-Column Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Product Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>General Information</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Pure A2 Desi Gir Cow Ghee (Bilona Method)"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Slug (URL Key)
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="Auto-generated if empty"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="e.g. BG-GHEE-500ML"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Description
                </label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Brief 1-2 sentence summary for product cards..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Detailed Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Comprehensive description, health benefits, traditional preparation notes..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Product Media Section (GCS Integration) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <ImageUploader
              images={formData.images}
              onChange={(updatedImages) => setFormData((prev) => ({ ...prev, images: updatedImages }))}
            />

            <div className="pt-4 border-t border-slate-100">
              <FileUploader
                files={formData.files}
                onChange={(updatedFiles) => setFormData((prev) => ({ ...prev, files: updatedFiles }))}
              />
            </div>
          </div>

          {/* Product Variants & Dynamic Attributes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Variants & Specifications</span>
            </h3>

            {/* Variants Manager */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Product Options / Variants (e.g. 500ml, 1L, 5L)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Variant Label (e.g. 500ml)"
                  value={variantInput.label}
                  onChange={(e) => setVariantInput({ ...variantInput, label: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={variantInput.price}
                  onChange={(e) => setVariantInput({ ...variantInput, price: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <input
                  type="number"
                  placeholder="Stock Qty"
                  value={variantInput.stock}
                  onChange={(e) => setVariantInput({ ...variantInput, stock: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={addVariant}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Variant
                </button>
              </div>

              {formData.variants.length > 0 && (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {formData.variants.map((varItem, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-slate-900">{varItem.label}</span>
                        <span className="text-emerald-700 font-semibold">₹{varItem.price}</span>
                        <span className="text-slate-500">Stock: {varItem.stock}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Flexible Attribute Key-Value Pairs */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Extensible Specifications / Attributes (e.g. Origin, Organic Cert)
              </h4>

              <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Attribute Name (e.g. Process)"
                  value={attributeInput.name}
                  onChange={(e) => setAttributeInput({ ...attributeInput, name: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Attribute Value (e.g. Bilona Churned)"
                  value={attributeInput.value}
                  onChange={(e) => setAttributeInput({ ...attributeInput, value: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={addAttribute}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {formData.attributes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.attributes.map((attr, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-700">{attr.name}:</span>{" "}
                        <span className="text-slate-900 font-medium">{attr.value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttribute(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SEO Metadata */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Globe className="w-5 h-5 text-emerald-600" />
              <span>Search Engine Optimization (SEO)</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SEO Meta Title
              </label>
              <input
                type="text"
                name="seoTitle"
                value={formData.seoTitle}
                onChange={handleChange}
                placeholder="Google Search Snippet Title"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SEO Meta Description
              </label>
              <textarea
                name="seoDescription"
                value={formData.seoDescription}
                onChange={handleChange}
                rows={3}
                placeholder="Search engine meta description snippet..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Controls (1 Column) */}
        <div className="space-y-8">
          {/* Status & Visibility */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Publish Status & Flags
            </h3>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Product Status</span>
                <span className="text-[10px] text-slate-500">
                  {formData.isActive ? "Visible on storefront" : "Hidden from customers"}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Featured Product</span>
                <span className="text-[10px] text-slate-500">Highlight on homepage showcase</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Pricing & Inventory</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount / Compare Price (₹)
              </label>
              <input
                type="number"
                name="discountPrice"
                value={formData.discountPrice}
                onChange={handleChange}
                placeholder="Original strike-through price"
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="Units available"
                min="0"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Categories & Organization */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Organization & Category</span>
            </h3>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Category *
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Quick Add Category</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <a
                    href="/admin/products/categories"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:underline"
                  >
                    <span>Manage</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="">Select Category</option>
                {mainCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {mainCategories.length === 0 && (
                <p className="text-[11px] text-amber-700 mt-1 font-medium flex items-center gap-1">
                  <span>No categories exist yet. Click &quot;+ Quick Add Category&quot; above to create one instantly!</span>
                </p>
              )}
            </div>

            {subCategories.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subcategory
                </label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="">None / Optional</option>
                  {subCategories.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Brundavanam"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tags (Comma Separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="a2, ghee, bilona, organic, vedic"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-600" />
                <span>Quick Add New Category</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g., A2 Bilona Ghee, Panchagavya, Puja Products"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief summary of products in this category..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickCreateCategory}
                  disabled={creatingCat}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-2"
                >
                  {creatingCat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save &amp; Select Category</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
