"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowLeft,
  Loader2,
  FolderPlus,
  Sparkles,
  Layers,
} from "lucide-react";
import { useDispatch, useSelector, selectCategories } from "@/lib/redux/store";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/redux/slices/productSlice";
import { triggerToast } from "@/lib/redux/slices/adminSlice";

export default function AdminCategoriesPage() {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent: "",
    sortOrder: 0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        await dispatch(fetchCategories(true));
      } catch (err) {
        dispatch(triggerToast("Failed to load categories", "error"));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [dispatch]);

  const openCreateModal = (parentCategory = null) => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      parent: parentCategory ? parentCategory._id : "",
      sortOrder: 0,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || "",
      description: cat.description || "",
      parent: cat.parent?._id || cat.parent || "",
      sortOrder: cat.sortOrder || 0,
      isActive: cat.isActive !== undefined ? cat.isActive : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      dispatch(triggerToast("Category name is required", "error"));
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await dispatch(
          updateCategory({
            id: editingCategory._id,
            data: formData,
          })
        );
        dispatch(triggerToast(`Category '${formData.name}' updated successfully`, "success"));
      } else {
        await dispatch(createCategory(formData));
        dispatch(triggerToast(`Category '${formData.name}' created successfully`, "success"));
      }
      setShowModal(false);
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to save category", "error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteCategory(deleteTarget._id));
      dispatch(triggerToast(`Category '${deleteTarget.name}' deleted`, "success"));
      setDeleteTarget(null);
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to delete category", "error"));
    }
  };

  // Group into main categories and subcategories
  const mainCategories = categories.filter((c) => !c.parent);
  const getSubcategories = (parentId) =>
    categories.filter(
      (c) =>
        c.parent &&
        (typeof c.parent === "object" ? c.parent._id === parentId : c.parent === parentId)
    );

  // Filter categories by search
  const filteredMain = mainCategories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      getSubcategories(c._id).some((sub) => sub.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Link href="/admin/products" className="hover:text-slate-800 transition-colors">
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-emerald-600">Category Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderTree className="w-7 h-7 text-emerald-600" />
            <span>Product Categories & Subcategories</span>
          </h1>
          <p className="text-xs text-slate-500">
            Organize A2 Ghee, Panchagavya, Puja Essentials, and Dairy products into catalog structures.
          </p>
        </div>

        <button
          onClick={() => openCreateModal()}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Main Category</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories or subcategories..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total: <span className="font-bold text-slate-900">{categories.length}</span> categories (
          <span className="text-emerald-600 font-semibold">{mainCategories.length} Main</span>,{" "}
          <span className="text-sky-600 font-semibold">{categories.length - mainCategories.length} Sub</span>)
        </div>
      </div>

      {/* Main Category List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading catalog categories...</p>
        </div>
      ) : filteredMain.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <FolderTree className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Categories Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Create your first product category (e.g., &quot;A2 Ghee&quot;, &quot;Panchagavya&quot;, &quot;Puja Products&quot;) to organize products.
            </p>
          </div>
          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Category</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredMain.map((cat) => {
            const subs = getSubcategories(cat._id);

            return (
              <div
                key={cat._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Main Category Row */}
                <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{cat.name}</h3>
                        <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                          /{cat.slug}
                        </span>
                        {cat.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cat.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openCreateModal(cat)}
                      className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-lg border border-sky-200 transition-colors flex items-center gap-1.5"
                      title="Add Subcategory"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Add Subcategory</span>
                    </button>
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-200/60 rounded-lg transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories List */}
                <div className="p-4 bg-white space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Subcategories ({subs.length})</span>
                  </div>

                  {subs.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-slate-400 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      No subcategories configured under {cat.name}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {subs.map((sub) => (
                        <div
                          key={sub._id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 transition-all group"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-xs font-semibold text-slate-800 block truncate">
                              {sub.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">
                              /{sub.slug}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(sub)}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                              title="Edit Subcategory"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(sub)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Delete Subcategory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-emerald-600" />
                <span>{editingCategory ? "Edit Category" : "Create New Category"}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., A2 Bilona Ghee, Panchagavya, Puja Products"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Category (Optional for Subcategory)
                </label>
                <select
                  value={formData.parent}
                  onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="">None (Make Main Category)</option>
                  {mainCategories
                    .filter((c) => !editingCategory || c._id !== editingCategory._id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        Parent: {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of products in this category..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-700">Active Published</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? "Update Category" : "Save Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Category</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete category{" "}
              <strong className="text-slate-900">&quot;{deleteTarget.name}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
