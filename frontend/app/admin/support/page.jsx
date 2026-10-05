"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  ArrowUpDown,
  Mail,
  Phone,
  Inbox,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { supportApi } from "@/lib/api/supportApi";
import { useDispatch, triggerToast } from "@/lib/redux/store";

export default function AdminSupportPage() {
  const dispatch = useDispatch();

  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("lastMessageAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await supportApi.getAdminStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load admin support stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTickets = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await supportApi.getAdminTickets({
        page,
        limit: 15,
        search,
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        sortBy,
        sortOrder,
      });

      if (res.success) {
        setTickets(res.data.tickets || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
      dispatch(triggerToast("Failed to load tickets", "error"));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, priorityFilter, sortBy, sortOrder, dispatch]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTickets(1);
  }, [fetchTickets]);

  const handleRefresh = () => {
    fetchStats();
    fetchTickets(pagination.page);
  };

  const getStatusBadge = (status) => {
    const config = {
      new: { label: "New", bg: "bg-purple-100 text-purple-800 border-purple-200" },
      open: { label: "Open", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      in_progress: { label: "In Progress", bg: "bg-sky-100 text-sky-800 border-sky-200" },
      waiting_customer: { label: "Waiting Customer", bg: "bg-amber-100 text-amber-900 border-amber-300" },
      resolved: { label: "Resolved", bg: "bg-green-100 text-green-800 border-green-300" },
      closed: { label: "Closed", bg: "bg-slate-200 text-slate-700 border-slate-300" },
    };
    const c = config[status] || config.open;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = {
      urgent: { label: "Urgent", bg: "bg-rose-100 text-rose-800 border-rose-200" },
      high: { label: "High", bg: "bg-orange-100 text-orange-800 border-orange-200" },
      medium: { label: "Medium", bg: "bg-blue-50 text-blue-700 border-blue-200" },
      low: { label: "Low", bg: "bg-slate-100 text-slate-600 border-slate-200" },
    };
    const c = config[priority] || config.medium;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  const getCategoryLabel = (cat) => {
    const map = {
      general: "General Enquiry",
      product: "Product Info",
      order: "Order Related",
      shipping: "Shipping & Delivery",
      payment: "Payment Issue",
      return_refund: "Return / Refund",
      complaint: "Product Complaint",
      partnership: "Partnership",
      other: "Other",
    };
    return map[cat] || cat;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-emerald-600" />
            <span>Customer Support & Enquiries</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming customer contact submissions, track conversation threads, and resolve issues.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading || statsLoading ? "animate-spin" : ""}`} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* KPI Stats Row (PART 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.total ?? 0}</p>
        </div>

        {/* New */}
        <div
          onClick={() => setStatusFilter("new")}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            statusFilter === "new"
              ? "bg-purple-100 border-purple-400 ring-2 ring-purple-300"
              : "bg-purple-50/60 border-purple-200 hover:bg-purple-50"
          }`}
        >
          <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">New</span>
          <p className="text-2xl font-extrabold text-purple-900 mt-1">{stats?.new ?? 0}</p>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setStatusFilter("in_progress")}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            statusFilter === "in_progress"
              ? "bg-sky-100 border-sky-400 ring-2 ring-sky-300"
              : "bg-sky-50/60 border-sky-200 hover:bg-sky-50"
          }`}
        >
          <span className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">In Progress</span>
          <p className="text-2xl font-extrabold text-sky-900 mt-1">{stats?.inProgress ?? 0}</p>
        </div>

        {/* Waiting Customer */}
        <div
          onClick={() => setStatusFilter("waiting_customer")}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            statusFilter === "waiting_customer"
              ? "bg-amber-100 border-amber-400 ring-2 ring-amber-300"
              : "bg-amber-50/60 border-amber-200 hover:bg-amber-50"
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Waiting Cust</span>
          <p className="text-2xl font-extrabold text-amber-900 mt-1">{stats?.waitingCustomer ?? 0}</p>
        </div>

        {/* Resolved */}
        <div
          onClick={() => setStatusFilter("resolved")}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            statusFilter === "resolved"
              ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300"
              : "bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Resolved</span>
          <p className="text-2xl font-extrabold text-emerald-900 mt-1">{stats?.resolved ?? 0}</p>
        </div>

        {/* Closed */}
        <div
          onClick={() => setStatusFilter("closed")}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            statusFilter === "closed"
              ? "bg-slate-200 border-slate-400 ring-2 ring-slate-300"
              : "bg-slate-100 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Closed</span>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats?.closed ?? 0}</p>
        </div>

        {/* High Priority */}
        <div
          onClick={() => setPriorityFilter("high")}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            priorityFilter === "high"
              ? "bg-rose-100 border-rose-400 ring-2 ring-rose-300"
              : "bg-rose-50/60 border-rose-200 hover:bg-rose-50"
          }`}
        >
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>High/Urgent</span>
          </span>
          <p className="text-2xl font-extrabold text-rose-900 mt-1">{stats?.highPriority ?? 0}</p>
        </div>

        {/* Unassigned */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Unassigned</span>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats?.unassigned ?? 0}</p>
        </div>
      </div>

      {/* Filter and Search Bar (PART 10) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket #, customer name, email, phone, or subject…"
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Status filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-emerald-600 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting for Customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-emerald-600 font-medium"
            >
              <option value="all">All Categories</option>
              <option value="general">General Enquiry</option>
              <option value="product">Product Information</option>
              <option value="order">Order Related</option>
              <option value="shipping">Shipping & Delivery</option>
              <option value="payment">Payment Issue</option>
              <option value="return_refund">Return / Refund</option>
              <option value="complaint">Complaint</option>
              <option value="partnership">Partnership</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="md:col-span-1.5">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-emerald-600 font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-emerald-600 font-medium"
            >
              <option value="lastMessageAt">Recently Updated</option>
              <option value="createdAt">Creation Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && tickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
            <p>Loading tickets from database…</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">No support tickets match criteria</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search terms, status, category, or priority filters to see more results.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Subject & Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Last Response</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Ticket Reference */}
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/support/${t._id}`}
                        className="font-mono font-bold text-emerald-700 hover:text-emerald-900 underline"
                      >
                        #{t.ticketNumber}
                      </Link>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(t.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{t.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{t.email}</div>
                      <div className="text-[10px] text-slate-400">{t.phone}</div>
                    </td>

                    {/* Subject & Category */}
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="font-medium text-slate-900 truncate" title={t.subject}>
                        {t.subject}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                        {getCategoryLabel(t.category)}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPriorityBadge(t.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(t.status)}
                    </td>

                    {/* Assigned To */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-700 font-medium">
                        {t.assignedTo?.name || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </div>
                    </td>

                    {/* Last Response snippet & date */}
                    <td className="py-3.5 px-4 max-w-[180px]">
                      <div className="text-slate-600 truncate text-[11px]">
                        {t.latestMessage || t.subject}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(t.lastMessageAt || t.updatedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Action Link */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/support/${t._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-xs"
                      >
                        <span>Workspace</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total tickets)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchTickets(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchTickets(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
