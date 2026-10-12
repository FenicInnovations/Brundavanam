"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon,
  Video,
  Youtube,
  Link2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Edit3,
  X,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";

const TYPE_OPTIONS = [
  { value: "image", label: "Image (URL)", icon: ImageIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
  { value: "youtube", label: "YouTube Video", icon: Youtube, color: "text-rose-600", bg: "bg-rose-50" },
  { value: "video", label: "Video (URL)", icon: Video, color: "text-blue-600", bg: "bg-blue-50" },
  { value: "external_video", label: "External Embed", icon: Link2, color: "text-purple-600", bg: "bg-purple-50" },
];

const EMPTY_FORM = {
  type: "image",
  title: "",
  description: "",
  url: "",
  thumbnailUrl: "",
  sortOrder: 0,
  isPublished: true,
  tags: "",
};

function getYoutubeId(url) {
  const match = url?.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : null;
}

function GalleryItemCard({ item, onEdit, onDelete, onToggle }) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const typeConfig = TYPE_OPTIONS.find((t) => t.value === item.type) || TYPE_OPTIONS[0];
  const TypeIcon = typeConfig.icon;

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.title || item.url}"?`)) return;
    setDeleting(true);
    await onDelete(item._id);
    setDeleting(false);
  };

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(item._id);
    setToggling(false);
  };

  const previewThumb =
    item.thumbnailUrl ||
    (item.type === "youtube" && item.youtubeId
      ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`
      : item.type === "image"
      ? item.url
      : null);

  return (
    <div
      className={`relative bg-white rounded-2xl border shadow-xs overflow-hidden group transition-all hover:shadow-md ${
        item.isPublished ? "border-slate-200" : "border-slate-200 opacity-60"
      }`}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-slate-100 relative overflow-hidden">
        {previewThumb ? (
          <img
            src={previewThumb}
            alt={item.title || "Gallery item"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className={`w-12 h-12 ${typeConfig.color}`} />
          </div>
        )}

        {/* Type badge */}
        <div
          className={`absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold ${typeConfig.bg} ${typeConfig.color} shadow-sm`}
        >
          <TypeIcon className="w-3 h-3" />
          <span className="uppercase tracking-wide">{typeConfig.label}</span>
        </div>

        {/* Published badge */}
        {!item.isPublished && (
          <div className="absolute top-2 right-2 bg-slate-800/80 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
            HIDDEN
          </div>
        )}

        {/* Actions Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(item)}
            className="p-2 bg-white/90 rounded-xl text-slate-700 hover:text-blue-600 transition-colors shadow-sm"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="p-2 bg-white/90 rounded-xl text-slate-700 hover:text-amber-600 transition-colors shadow-sm"
            title={item.isPublished ? "Hide" : "Show"}
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : item.isPublished ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 bg-white/90 rounded-xl text-slate-700 hover:text-rose-600 transition-colors shadow-sm"
            title="Delete"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-slate-800 text-sm truncate">
          {item.title || <span className="text-slate-400 italic">No title</span>}
        </p>
        {item.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 truncate"
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span className="truncate">{item.url}</span>
        </a>
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      sortOrder: parseInt(form.sortOrder) || 0,
      tags:
        typeof form.tags === "string"
          ? form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : form.tags,
    };
    onSave(payload);
  };

  const ytId = form.type === "youtube" ? getYoutubeId(form.url) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-lg">
            {initial?._id ? "Edit Gallery Item" : "Add Gallery Item"}
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Media Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((t) => {
                const TIcon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set("type", t.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                      form.type === t.value
                        ? `${t.bg} ${t.color} border-current`
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <TIcon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              {form.type === "youtube"
                ? "YouTube URL *"
                : form.type === "image"
                ? "Image URL *"
                : form.type === "video"
                ? "Video URL *"
                : "Embed URL *"}
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              required
              placeholder={
                form.type === "youtube"
                  ? "https://www.youtube.com/watch?v=..."
                  : form.type === "image"
                  ? "https://storage.googleapis.com/... or any image URL"
                  : form.type === "video"
                  ? "https://storage.googleapis.com/video.mp4"
                  : "https://..."
              }
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
            />
            {/* YouTube Preview */}
            {ytId && (
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                  alt="YouTube thumbnail"
                  className="w-full"
                />
                <p className="text-[11px] text-slate-500 p-2">
                  ✓ YouTube ID detected: <strong>{ytId}</strong>
                </p>
              </div>
            )}
            {/* Image Preview */}
            {form.type === "image" && form.url && (
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-h-32">
                <img
                  src={form.url}
                  alt="Preview"
                  className="w-full h-32 object-cover"
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Enter a title for this item"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Thumbnail (for video/external_video) */}
          {(form.type === "video" || form.type === "external_video") && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Thumbnail URL (optional)
              </label>
              <input
                type="url"
                value={form.thumbnailUrl}
                onChange={(e) => set("thumbnailUrl", e.target.value)}
                placeholder="https://... (thumbnail image URL)"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={typeof form.tags === "string" ? form.tags : form.tags?.join(", ") || ""}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="product, goshala, amrutha-dhara"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
            />
          </div>

          {/* Sort Order & Published */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                min={0}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Published
              </label>
              <button
                type="button"
                onClick={() => set("isPublished", !form.isPublished)}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  form.isPublished
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                {form.isPublished ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                {form.isPublished ? "Visible" : "Hidden"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-sm disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {initial?._id ? "Save Changes" : "Add to Gallery"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminGalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/gallery/admin");
      setItems(res.data || []);
    } catch (err) {
      setError("Failed to load gallery items. Check API connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editItem?._id) {
        await apiClient.put(`/gallery/admin/${editItem._id}`, form);
        showToast("Gallery item updated!");
      } else {
        await apiClient.post("/gallery/admin", form);
        showToast("Gallery item added!");
      }
      setShowForm(false);
      setEditItem(null);
      fetchItems();
    } catch (err) {
      showToast(err.message || "Failed to save item", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/gallery/admin/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      showToast("Item deleted");
    } catch (err) {
      showToast("Failed to delete item", "error");
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await apiClient.patch(`/gallery/admin/${id}/toggle`);
      setItems((prev) => prev.map((i) => (i._id === id ? res.data : i)));
      showToast(res.data.isPublished ? "Item published" : "Item hidden");
    } catch (err) {
      showToast("Failed to toggle item", "error");
    }
  };

  const handleEdit = (item) => {
    setEditItem({ ...item, tags: item.tags?.join(", ") || "" });
    setShowForm(true);
  };

  const filteredItems =
    filter === "all" ? items : items.filter((i) => i.type === filter);

  const stats = {
    total: items.length,
    images: items.filter((i) => i.type === "image").length,
    youtube: items.filter((i) => i.type === "youtube").length,
    videos: items.filter(
      (i) => i.type === "video" || i.type === "external_video"
    ).length,
    published: items.filter((i) => i.isPublished).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gallery Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage images, videos, and YouTube links shown on the About Us page.
          </p>
        </div>
        <button
          onClick={() => {
            setEditItem(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Gallery Item
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-slate-900" },
          { label: "Images", value: stats.images, color: "text-emerald-600" },
          { label: "YouTube", value: stats.youtube, color: "text-rose-600" },
          { label: "Videos", value: stats.videos, color: "text-blue-600" },
          { label: "Published", value: stats.published, color: "text-purple-600" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-slate-200 p-4 text-center"
          >
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { val: "all", label: "All" },
          { val: "image", label: "Images" },
          { val: "youtube", label: "YouTube" },
          { val: "video", label: "Videos" },
          { val: "external_video", label: "Embeds" },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => setFilter(tab.val)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filter === tab.val
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === "error" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
          }`}
        >
          {toast.type === "error" ? (
            <X className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden animate-pulse"
            >
              <div className="aspect-video bg-slate-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-rose-600 font-medium">{error}</p>
          <button
            onClick={fetchItems}
            className="mt-3 text-sm text-blue-600 underline"
          >
            Try again
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No gallery items yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Click &quot;Add Gallery Item&quot; to get started
          </p>
          <button
            onClick={() => {
              setEditItem(null);
              setShowForm(true);
            }}
            className="mt-4 flex items-center gap-2 mx-auto bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:bg-emerald-500 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <GalleryItemCard
              key={item._id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <GalleryForm
          initial={editItem}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditItem(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}
