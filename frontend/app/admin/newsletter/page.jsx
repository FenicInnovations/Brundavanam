"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Search,
  RefreshCw,
  Download,
  Send,
  Users,
  UserCheck,
  UserMinus,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit3,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { newsletterApi } from "@/lib/api/newsletterApi";
import { useDispatch, triggerToast } from "@/lib/redux/store";

export default function AdminNewsletterPage() {
  const dispatch = useDispatch();

  // State
  const [subscribers, setSubscribers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, today: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    subject: "",
    message: "",
    actionText: "Shop Sacred Offerings",
    actionUrl: "https://brundavanamgoshala.com/shop",
    isTestOnly: false,
    testEmail: "",
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [subNote, setSubNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  // Fetch subscribers list
  const fetchSubscribers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await newsletterApi.getAdminSubscribers({
          page,
          limit: 20,
          search: search.trim() || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          sortBy,
          sortOrder,
        });

        if (res.success && res.data) {
          setSubscribers(res.data.subscribers || []);
          setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
          if (res.data.stats) {
            setStats(res.data.stats);
          }
        }
      } catch (err) {
        console.error("Failed to fetch subscribers:", err);
        dispatch(triggerToast("Failed to load newsletter subscribers", "error"));
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, sortBy, sortOrder, dispatch]
  );

  // Fetch stats directly
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await newsletterApi.getAdminStats();
      if (res.success && res.data) {
        setStats((prev) => ({
          ...prev,
          total: res.data.total ?? prev.total,
          active: res.data.active ?? prev.active,
          unsubscribed: res.data.unsubscribed ?? prev.unsubscribed,
          today: res.data.today ?? prev.today,
          thisMonth: res.data.thisMonth ?? prev.thisMonth,
        }));
      }
    } catch (err) {
      console.error("Failed to load newsletter stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSubscribers(1);
    setSelectedIds([]);
  }, [fetchSubscribers]);

  const handleRefresh = () => {
    fetchStats();
    fetchSubscribers(pagination.page);
  };

  // Toggle active/unsubscribed status
  const handleToggleStatus = async (subscriber) => {
    const newStatus = subscriber.status === "active" ? "unsubscribed" : "active";
    try {
      const res = await newsletterApi.updateSubscriber(subscriber._id, { status: newStatus });
      if (res.success) {
        dispatch(triggerToast(`Marked ${subscriber.email} as ${newStatus}`, "success"));
        fetchSubscribers(pagination.page);
        fetchStats();
      }
    } catch (err) {
      dispatch(triggerToast("Failed to update subscriber status", "error"));
    }
  };

  // Open note edit modal
  const handleOpenNoteModal = (sub) => {
    setEditingSub(sub);
    setSubNote(sub.notes || "");
    setNoteModalOpen(true);
  };

  // Save note
  const handleSaveNote = async () => {
    if (!editingSub) return;
    setSavingNote(true);
    try {
      const res = await newsletterApi.updateSubscriber(editingSub._id, { notes: subNote });
      if (res.success) {
        dispatch(triggerToast("Subscriber note updated", "success"));
        setNoteModalOpen(false);
        setEditingSub(null);
        fetchSubscribers(pagination.page);
      }
    } catch (err) {
      dispatch(triggerToast("Failed to save note", "error"));
    } finally {
      setSavingNote(false);
    }
  };

  // Delete subscriber
  const handleDelete = async (id, email) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${email}" from the subscriber list?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await newsletterApi.deleteSubscriber(id);
      if (res.success) {
        dispatch(triggerToast("Subscriber deleted successfully", "success"));
        fetchSubscribers(pagination.page);
        fetchStats();
      }
    } catch (err) {
      dispatch(triggerToast("Failed to delete subscriber", "error"));
    } finally {
      setDeletingId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const exportUrl = `${baseUrl}/newsletter/admin/export?status=${statusFilter}`;
    window.open(exportUrl, "_blank");
    dispatch(triggerToast("Exporting subscribers CSV...", "info"));
  };

  // Send Broadcast
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.subject.trim()) {
      dispatch(triggerToast("Please enter an email subject", "error"));
      return;
    }
    if (!broadcastForm.message.trim()) {
      dispatch(triggerToast("Please enter message content", "error"));
      return;
    }
    if (broadcastForm.isTestOnly && !broadcastForm.testEmail.trim()) {
      dispatch(triggerToast("Please enter a test recipient email", "error"));
      return;
    }

    setSendingBroadcast(true);
    try {
      const payload = {
        subject: broadcastForm.subject.trim(),
        message: broadcastForm.message.trim(),
        actionText: broadcastForm.actionText.trim(),
        actionUrl: broadcastForm.actionUrl.trim(),
        testEmailOnly: broadcastForm.isTestOnly ? broadcastForm.testEmail.trim() : null,
      };

      const res = await newsletterApi.broadcast(payload);
      if (res.success) {
        dispatch(triggerToast(res.message || "Broadcast initiated successfully!", "success"));
        setBroadcastModalOpen(false);
        setBroadcastForm({
          subject: "",
          message: "",
          actionText: "Shop Sacred Offerings",
          actionUrl: "https://brundavanamgoshala.com/shop",
          isTestOnly: false,
          testEmail: "",
        });
      }
    } catch (err) {
      console.error("Broadcast failed:", err);
      dispatch(
        triggerToast(
          err.data?.message || err.message || "Failed to dispatch broadcast email",
          "error"
        )
      );
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Selection toggle
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(subscribers.map((s) => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Mail size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Newsletter Subscribers
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage devotee email subscribers, export marketing lists, and send Vedic announcements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-xs"
            title="Refresh subscriber list"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-xs"
            title="Export CSV of subscribers"
          >
            <Download size={14} className="text-amber-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setBroadcastModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-4 py-2 text-xs font-bold text-stone-950 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-950/30"
          >
            <Send size={14} />
            <span>Send Broadcast Email</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Subscribers */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Devotees
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">
              {statsLoading ? "..." : stats.total.toLocaleString("en-IN")}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              All newsletter registrations
            </p>
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Active Subscribers
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {statsLoading ? "..." : stats.active.toLocaleString("en-IN")}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Receiving email broadcasts (
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 100}%)
            </p>
          </div>
        </div>

        {/* Unsubscribed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Unsubscribed
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <UserMinus size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-rose-400 font-mono">
              {statsLoading ? "..." : stats.unsubscribed.toLocaleString("en-IN")}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Opted out of email alerts
            </p>
          </div>
        </div>

        {/* Joined This Month */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              New This Month
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-blue-400 font-mono">
              +{statsLoading ? "..." : stats.thisMonth.toLocaleString("en-IN")}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Devotees joined in current cycle
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by devotee email, notes, or source..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 p-1">
            {[
              { id: "all", label: "All Devotees", count: stats.total },
              { id: "active", label: "Active", count: stats.active },
              { id: "unsubscribed", label: "Unsubscribed", count: stats.unsubscribed },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? "bg-amber-500 text-stone-950 shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    statusFilter === tab.id
                      ? "bg-stone-950/20 text-stone-950"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("_");
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="createdAt_desc">Newest Registered</option>
              <option value="createdAt_asc">Oldest Registered</option>
              <option value="email_asc">Email (A to Z)</option>
              <option value="email_desc">Email (Z to A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Subscribers Data Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin text-amber-500" />
            <p className="text-xs">Loading newsletter subscribers...</p>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
              <Mail size={24} />
            </div>
            <h3 className="text-base font-bold text-white">No Subscribers Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {search
                ? `No results match your search "${search}". Try clearing search filters.`
                : "No subscribers recorded yet in this category. Subscriptions from the storefront footer will appear here automatically."}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        subscribers.length > 0 &&
                        selectedIds.length === subscribers.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0"
                    />
                  </th>
                  <th className="py-3.5 px-4">Devotee Email</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Subscribed Date</th>
                  <th className="py-3.5 px-4">Internal Notes</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {subscribers.map((sub) => {
                  const isSelected = selectedIds.includes(sub._id);
                  const isDeleting = deletingId === sub._id;
                  const initial = (sub.email || "D").charAt(0).toUpperCase();

                  return (
                    <tr
                      key={sub._id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? "bg-amber-500/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(sub._id)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-0"
                        />
                      </td>

                      {/* Devotee Email with Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 font-bold text-xs shadow-xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">
                              {sub.email}
                            </span>
                            {sub.tags && sub.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {sub.tags.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[9px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {sub.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                            <span>Unsubscribed</span>
                          </span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">
                        <span className="inline-block rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-mono text-slate-300 capitalize">
                          {sub.source || "footer"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-400">
                        <div>
                          <span className="text-slate-200">
                            {sub.subscribedAt
                              ? new Date(sub.subscribedAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "N/A"}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {sub.subscribedAt
                              ? new Date(sub.subscribedAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 max-w-xs">
                        {sub.notes ? (
                          <p className="text-[11px] text-slate-300 truncate" title={sub.notes}>
                            {sub.notes}
                          </p>
                        ) : (
                          <span className="text-slate-600 italic text-[11px]">No notes</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active / Unsubscribed */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(sub)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              sub.status === "active"
                                ? "border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-400/40"
                                : "border-emerald-700 text-emerald-400 hover:bg-emerald-950/40"
                            }`}
                            title={
                              sub.status === "active"
                                ? "Mark Unsubscribed"
                                : "Reactivate Subscriber"
                            }
                          >
                            {sub.status === "active" ? (
                              <UserMinus size={13} />
                            ) : (
                              <UserCheck size={13} />
                            )}
                          </button>

                          {/* Edit Note */}
                          <button
                            type="button"
                            onClick={() => handleOpenNoteModal(sub)}
                            className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                            title="Edit notes"
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(sub._id, sub.email)}
                            className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors disabled:opacity-40"
                            title="Delete subscriber permanently"
                          >
                            {isDeleting ? (
                              <Loader2 size={13} className="animate-spin text-rose-400" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="border-t border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-950/40 text-xs text-slate-400">
            <span>
              Showing page <strong className="text-white">{pagination.page}</strong> of{" "}
              <strong className="text-white">{pagination.pages}</strong> ({pagination.total} total)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchSubscribers(pagination.page - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchSubscribers(pagination.page + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Broadcast Email Modal */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Send Newsletter Announcement
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dispatches via verified Gmail SMTP to active devotees.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastForm.subject}
                  onChange={(e) =>
                    setBroadcastForm((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  placeholder="e.g. Fresh A2 Bilona Ghee Batch Now Ready | Festival Blessings"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Message Content *
                </label>
                <textarea
                  rows={5}
                  required
                  value={broadcastForm.message}
                  onChange={(e) =>
                    setBroadcastForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Dear Devotee,\n\nWe are pleased to inform you that our fresh batch of traditional Bilona A2 Desi Cow Ghee has just been completed with morning prayer...\n\nWith gratitude,\nBrundavanam Goshala"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none font-sans leading-relaxed"
                />
              </div>

              {/* CTA Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={broadcastForm.actionText}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({ ...prev, actionText: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Button Link URL
                  </label>
                  <input
                    type="text"
                    value={broadcastForm.actionUrl}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({ ...prev, actionUrl: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Test Email Option */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={broadcastForm.isTestOnly}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({
                        ...prev,
                        isTestOnly: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-slate-200">
                    Send as a Test Email First (Recommended)
                  </span>
                </label>
                {broadcastForm.isTestOnly && (
                  <input
                    type="email"
                    required={broadcastForm.isTestOnly}
                    value={broadcastForm.testEmail}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({
                        ...prev,
                        testEmail: e.target.value,
                      }))
                    }
                    placeholder="Enter your personal or admin test email"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-5 py-2.5 text-xs font-bold text-stone-950 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-950/40 disabled:opacity-50"
                >
                  {sendingBroadcast ? (
                    <>
                      <Loader2 size={15} className="animate-spin text-stone-950" />
                      <span>Sending Broadcast...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>
                        {broadcastForm.isTestOnly
                          ? "Send Test Email"
                          : `Broadcast to ${stats.active} Devotees`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Subscriber Note Modal */}
      {noteModalOpen && editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-5 space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                Devotee Internal Notes
              </h3>
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <p className="text-xs text-amber-400 font-semibold mb-2">
                {editingSub.email}
              </p>
              <textarea
                rows={4}
                value={subNote}
                onChange={(e) => setSubNote(e.target.value)}
                placeholder="Add notes for this subscriber (e.g. VIP devotee, special preferences, festival donor)..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingNote}
                onClick={handleSaveNote}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
              >
                {savingNote ? (
                  <Loader2 size={13} className="animate-spin text-stone-950" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
