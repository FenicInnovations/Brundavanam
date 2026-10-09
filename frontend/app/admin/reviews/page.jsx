"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Trash2, Eye, EyeOff, Search, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";
import ConfirmModal from "@/components/admin/ConfirmModal";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/reviews", { page, limit: pagination.limit });
      if (res.success) {
        setReviews(res.reviews);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchReviews(pagination.page);
  }, [fetchReviews, pagination.page]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((p) => ({ ...p, page: newPage }));
    }
  };

  const toggleVisibility = async (id, currentStatus) => {
    try {
      await apiClient.patch(`/admin/reviews/${id}/status`, { isApproved: !currentStatus });
      setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, isApproved: !currentStatus } : r)));
    } catch (err) {
      console.error("Status update failed:", err.message);
    }
  };

  const confirmDelete = (id) => {
    setReviewToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await apiClient.delete(`/admin/reviews/${reviewToDelete}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewToDelete));
      setDeleteModalOpen(false);
      setReviewToDelete(null);
    } catch (err) {
      console.error("Deletion failed:", err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Product Reviews</h1>
        <p className="text-sm text-slate-500 mt-1">Manage and moderate customer reviews</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Review</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Loading reviews...</p>
                    </div>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                      <p>No reviews found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {review.product?.images?.[0]?.url ? (
                          <img src={review.product.images[0].url} alt={review.product.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="flex flex-col max-w-[150px]">
                          <span className="font-medium text-slate-800 truncate" title={review.product?.name}>
                            {review.product?.name || "Unknown Product"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                          ))}
                        </div>
                        {review.title && <span className="font-semibold text-slate-800 text-xs">{review.title}</span>}
                        <p className="text-xs text-slate-500 line-clamp-2" title={review.comment}>{review.comment}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{review.user?.name || "Unknown"}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(review.createdAt).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                        review.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {review.isApproved ? "Approved" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleVisibility(review._id, review.isApproved)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title={review.isApproved ? "Hide Review" : "Approve Review"}
                        >
                          {review.isApproved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => confirmDelete(review._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && reviews.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reviews
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700 min-w-[2rem] text-center">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Review"
        confirmText="Delete"
        isDestructive={true}
      >
        <p className="text-sm text-slate-600 my-2">
          Are you sure you want to permanently delete this review? This action cannot be undone.
        </p>
      </ConfirmModal>

    </div>
  );
}
