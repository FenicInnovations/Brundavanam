"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  MapPin,
  ShieldAlert,
  Activity,
  Eye,
  X,
  ShoppingBag,
  Calendar,
  Check,
  ExternalLink,
  RefreshCw,
  Filter,
  IndianRupee,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  UserCheck,
  UserX,
  Edit3,
  Save,
  Loader2,
  AlertCircle,
  Home,
  Briefcase,
  MapPinned,
  ChevronDown,
} from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";
import { useDispatch, triggerToast } from "@/lib/redux/store";
import ConfirmModal from "@/components/admin/ConfirmModal";

export default function AdminCustomersPage() {
  const dispatch = useDispatch();

  // List State
  const [customers, setCustomers] = useState([]);
  const [overview, setOverview] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  // Status Toggle Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    customer: null,
    targetStatus: false,
  });
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Customer Details Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCustomerId, setActiveCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState("orders"); // "orders" | "addresses" | "edit"

  // Edit Customer Form State inside Drawer
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", isActive: true });
  const [editSaving, setEditSaving] = useState(false);

  // Fetch Customers List
  const fetchCustomers = useCallback(
    async (page = 1, search = "", status = "all") => {
      setLoading(true);
      try {
        const params = { page, limit: pagination.limit };
        if (search.trim()) params.search = search.trim();
        if (status !== "all") params.status = status;

        const res = await apiClient.get("/admin/customers", params);
        if (res.success) {
          setCustomers(res.customers || []);
          setPagination(res.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
          if (res.overview) {
            setOverview(res.overview);
          }
        }
      } catch (err) {
        console.error("Failed to fetch customers:", err);
        dispatch(triggerToast(err.message || "Failed to load customers", "error"));
      } finally {
        setLoading(false);
      }
    },
    [dispatch, pagination.limit]
  );

  useEffect(() => {
    fetchCustomers(pagination.page, searchTerm, statusFilter);
  }, [fetchCustomers, pagination.page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchCustomers(1, searchTerm, statusFilter);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPagination((p) => ({ ...p, page: 1 }));
    fetchCustomers(1, "", "all");
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((p) => ({ ...p, page: newPage }));
    }
  };

  // Open Status Confirmation Modal
  const requestToggleStatus = (customer) => {
    setConfirmModal({
      isOpen: true,
      customer,
      targetStatus: !customer.isActive,
    });
  };

  // Confirm Status Toggle
  const handleConfirmToggle = async () => {
    if (!confirmModal.customer) return;
    setStatusUpdating(true);
    const { _id } = confirmModal.customer;
    const newStatus = confirmModal.targetStatus;

    try {
      const res = await apiClient.patch(`/admin/customers/${_id}/status`, { isActive: newStatus });
      if (res.success) {
        setCustomers((prev) =>
          prev.map((c) => (c._id === _id ? { ...c, isActive: newStatus } : c))
        );
        if (customerDetail && customerDetail.customer._id === _id) {
          setCustomerDetail((prev) => ({
            ...prev,
            customer: { ...prev.customer, isActive: newStatus },
          }));
        }
        setOverview((prev) => ({
          ...prev,
          activeCustomers: newStatus ? prev.activeCustomers + 1 : prev.activeCustomers - 1,
          inactiveCustomers: !newStatus ? prev.inactiveCustomers + 1 : prev.inactiveCustomers - 1,
        }));
        dispatch(
          triggerToast(
            `Customer account ${newStatus ? "activated" : "deactivated"} successfully`,
            "success"
          )
        );
      }
    } catch (err) {
      console.error("Status update failed:", err);
      dispatch(triggerToast(err.message || "Failed to update customer status", "error"));
    } finally {
      setStatusUpdating(false);
      setConfirmModal({ isOpen: false, customer: null, targetStatus: false });
    }
  };

  // Open Customer Detail Drawer
  const openCustomerDrawer = async (customerId) => {
    setActiveCustomerId(customerId);
    setDrawerOpen(true);
    setDrawerTab("orders");
    setDetailLoading(true);

    try {
      const res = await apiClient.get(`/admin/customers/${customerId}`);
      if (res.success) {
        setCustomerDetail(res);
        setEditForm({
          name: res.customer.name || "",
          phone: res.customer.phone || "",
          email: res.customer.email || "",
          isActive: Boolean(res.customer.isActive),
        });
      }
    } catch (err) {
      console.error("Failed to load customer details:", err);
      dispatch(triggerToast("Failed to load customer profile", "error"));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeCustomerDrawer = () => {
    setDrawerOpen(false);
    setActiveCustomerId(null);
    setCustomerDetail(null);
  };

  // Handle Edit Customer Submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeCustomerId) return;

    setEditSaving(true);
    try {
      const res = await apiClient.patch(`/admin/customers/${activeCustomerId}`, editForm);
      if (res.success) {
        dispatch(triggerToast("Customer profile updated successfully", "success"));
        setCustomerDetail((prev) => ({
          ...prev,
          customer: { ...prev.customer, ...res.customer },
        }));
        setCustomers((prev) =>
          prev.map((c) => (c._id === activeCustomerId ? { ...c, ...res.customer } : c))
        );
        setDrawerTab("orders");
      }
    } catch (err) {
      console.error("Failed to update customer:", err);
      dispatch(triggerToast(err.message || "Update failed", "error"));
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Customer Management</h1>
              <p className="text-sm text-slate-500">
                Track registered customers, order histories, addresses, and lifetime engagement
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => fetchCustomers(pagination.page, searchTerm, statusFilter)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-xs disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/customers/locations"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white px-4 py-2.5 text-xs font-bold shadow-sm shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Geo & Marketing Insights</span>
          </Link>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Devotees</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
              {overview.totalCustomers.toLocaleString("en-IN")}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Registered customer accounts</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs flex items-center gap-3.5 bg-emerald-50/20">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Active Customers</p>
            <h3 className="text-2xl font-bold text-emerald-900 mt-0.5">
              {overview.activeCustomers.toLocaleString("en-IN")}
            </h3>
            <p className="text-[11px] text-emerald-600 mt-0.5">Allowed to purchase & login</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Suspended / Inactive</p>
            <h3 className="text-2xl font-bold text-rose-700 mt-0.5">
              {overview.inactiveCustomers.toLocaleString("en-IN")}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Deactivated accounts</p>
          </div>
        </div>

        <Link
          href="/admin/customers/locations"
          className="group bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-4 shadow-sm shadow-amber-900/10 flex items-center justify-between transition-all hover:shadow-md hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <MapPinned className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-100 uppercase tracking-wider">Location Intel</p>
              <h3 className="text-lg font-bold text-white mt-0.5">Cluster Strategy</h3>
              <p className="text-[11px] text-amber-100 mt-0.5 flex items-center gap-1">
                View top cities & PINs <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/70">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Mobile Number, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  fetchCustomers(1, "", statusFilter);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Filters & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="appearance-none bg-white border border-slate-300 rounded-xl pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="all">All Accounts ({overview.totalCustomers})</option>
                <option value="active">Active Only ({overview.activeCustomers})</option>
                <option value="inactive">Inactive Only ({overview.inactiveCustomers})</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Customer Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Customer Profile</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5">Orders & Spend</th>
                <th className="px-6 py-3.5">Registered On</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-medium text-slate-600">Loading customer directory...</p>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-800">No customers found</p>
                      <p className="text-xs text-slate-500">
                        No customer accounts match your current search query or filter selection.
                      </p>
                      {(searchTerm || statusFilter !== "all") && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const rawName = customer.name?.trim() || "";
                  const isValuedCustomer =
                    !rawName || rawName.toLowerCase() === "valued customer";
                  const displayName = isValuedCustomer
                    ? customer.phone
                      ? `Customer (+91 ${customer.phone})`
                      : "Devotee"
                    : rawName;
                  const initial = (
                    isValuedCustomer
                      ? customer.phone
                        ? customer.phone.charAt(0)
                        : "D"
                      : displayName.charAt(0)
                  ).toUpperCase();
                  const orderCount = customer.orderCount || 0;
                  const totalSpent = customer.totalSpent || 0;

                  return (
                    <tr
                      key={customer._id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => openCustomerDrawer(customer._id)}
                    >
                      {/* Customer Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-300 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {initial}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                              {displayName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                                {customer.role || "Customer"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {customer._id.slice(-6)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 text-xs">
                          {customer.phone ? (
                            <a
                              href={`tel:${customer.phone}`}
                              className="inline-flex items-center gap-1.5 text-slate-700 hover:text-emerald-600 font-medium w-fit"
                              title="Call customer"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>+91 {customer.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">No phone</span>
                          )}

                          {customer.email ? (
                            <a
                              href={`mailto:${customer.email}`}
                              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 w-fit"
                              title="Email customer"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-[180px]">{customer.email}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">No email saved</span>
                          )}
                        </div>
                      </td>

                      {/* Orders & Spend */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                                orderCount > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <ShoppingBag className="w-3 h-3" />
                              {orderCount} {orderCount === 1 ? "Order" : "Orders"}
                            </span>
                            {totalSpent > 0 && (
                              <span className="font-bold text-slate-800 text-xs">
                                ₹{totalSpent.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                          {customer.lastOrderDate && (
                            <span className="text-[11px] text-slate-400 mt-1">
                              Last order:{" "}
                              {new Date(customer.lastOrderDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            customer.isActive
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {customer.isActive ? (
                            <>
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Active
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openCustomerDrawer(customer._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-xs"
                            title="View customer profile and order history"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => requestToggleStatus(customer)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 border rounded-lg transition-all text-xs font-semibold shadow-xs ${
                              customer.isActive
                                ? "bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                                : "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                            }`}
                            title={customer.isActive ? "Deactivate account" : "Activate account"}
                          >
                            {customer.isActive ? (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Activity className="w-3.5 h-3.5" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && customers.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 text-xs">
            <span className="text-slate-500 font-medium">
              Showing <span className="font-semibold text-slate-700">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-semibold text-slate-700">{pagination.total}</span> customers
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium bg-slate-50 shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="text-slate-700 font-semibold px-2 min-w-[2.5rem] text-center">
                Page {pagination.page} of {pagination.pages || 1}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium bg-slate-50 shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Profile & Orders Slide-Over Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between">
              {detailLoading || !customerDetail ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="w-24 h-3 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ) : (
                (() => {
                  const rawDetailName = customerDetail.customer.name?.trim() || "";
                  const isValued = !rawDetailName || rawDetailName.toLowerCase() === "valued customer";
                  const detailDisplayName = isValued
                    ? (customerDetail.customer.phone ? `Customer (+91 ${customerDetail.customer.phone})` : "Devotee")
                    : rawDetailName;
                  const detailInitial = (
                    isValued
                      ? (customerDetail.customer.phone ? customerDetail.customer.phone.charAt(0) : "D")
                      : detailDisplayName.charAt(0)
                  ).toUpperCase();

                  return (
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        {detailInitial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900">
                            {detailDisplayName}
                          </h2>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              customerDetail.customer.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {customerDetail.customer.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      {customerDetail.customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          +91 {customerDetail.customer.phone}
                        </span>
                      )}
                      {customerDetail.customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {customerDetail.customer.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          )}

              <button
                type="button"
                onClick={closeCustomerDrawer}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            {detailLoading || !customerDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Fetching customer profile & orders...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Lifetime Summary KPI Row */}
                <div className="p-5 border-b border-slate-200 bg-white grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                      Lifetime Spend
                    </span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      ₹{customerDetail.stats.totalSpent.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                      Total Orders
                    </span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {customerDetail.stats.orderCount}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                      Avg Order Value
                    </span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      ₹{customerDetail.stats.averageOrderValue.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                      Customer Since
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {new Date(customerDetail.customer.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="px-5 border-b border-slate-200 bg-white flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setDrawerTab("orders")}
                    className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                      drawerTab === "orders"
                        ? "border-emerald-600 text-emerald-800"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Order History ({customerDetail.orders.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawerTab("addresses")}
                    className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                      drawerTab === "addresses"
                        ? "border-emerald-600 text-emerald-800"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Saved Addresses ({customerDetail.customer.addresses?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawerTab("edit")}
                    className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                      drawerTab === "edit"
                        ? "border-emerald-600 text-emerald-800"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                {/* Tab Content Area */}
                <div className="p-5 flex-1 bg-slate-50/50">
                  {/* Tab 1: Orders History */}
                  {drawerTab === "orders" && (
                    <div className="space-y-3">
                      {customerDetail.orders.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-sm font-semibold text-slate-700">No Orders Yet</p>
                          <p className="text-xs text-slate-500">
                            This customer has not placed any orders yet.
                          </p>
                        </div>
                      ) : (
                        customerDetail.orders.map((ord) => {
                          const orderTotal = ord.pricing?.grandTotal ?? ord.payableAmount ?? ord.total ?? 0;
                          return (
                            <div
                              key={ord._id}
                              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-emerald-200 transition-all space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-slate-800">
                                      #{ord.orderNumber || ord._id.slice(-8).toUpperCase()}
                                    </span>
                                    <span
                                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                        ord.status === "delivered"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : ord.status === "cancelled"
                                          ? "bg-rose-100 text-rose-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {ord.status || "Pending"}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm font-bold text-slate-900">
                                    ₹{Number(orderTotal).toLocaleString("en-IN")}
                                  </p>
                                  <span className="text-[10px] text-slate-500 capitalize">
                                    {ord.payment?.status || "Paid"}
                                  </span>
                                </div>
                              </div>

                              {/* Item preview list */}
                              {Array.isArray(ord.items) && ord.items.length > 0 && (
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                                  {ord.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-slate-700">
                                      <span className="truncate max-w-[280px]">
                                        <span className="font-semibold text-slate-900">{item.quantity}x</span>{" "}
                                        {item.name} {item.variantLabel ? `(${item.variantLabel})` : ""}
                                      </span>
                                      <span className="font-medium text-slate-900">
                                        ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Link to Admin Order Page */}
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] text-slate-500">
                                  Ship to: {ord.shippingAddress?.city || "India"}, {ord.shippingAddress?.state || ""}
                                </span>
                                <Link
                                  href={`/admin/orders/${ord._id}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                                >
                                  <span>View Order</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Tab 2: Saved Addresses */}
                  {drawerTab === "addresses" && (
                    <div className="space-y-3">
                      {customerDetail.customer.addresses?.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                          <Home className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-sm font-semibold text-slate-700">No Saved Addresses</p>
                          <p className="text-xs text-slate-500">
                            The customer hasn't added any addresses to their profile yet.
                          </p>
                        </div>
                      ) : (
                        customerDetail.customer.addresses?.map((addr, idx) => (
                          <div
                            key={addr._id || idx}
                            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 uppercase px-2 py-0.5 rounded bg-slate-100">
                                  {addr.label || "Address"}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    Default
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 font-mono">
                                PIN: {addr.postalCode}
                              </span>
                            </div>

                            <p className="text-sm font-semibold text-slate-900">{addr.fullName}</p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {addr.line1}
                              {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} -{" "}
                              {addr.postalCode}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>+91 {addr.phone}</span>
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Tab 3: Edit Profile */}
                  {drawerTab === "edit" && (
                    <form onSubmit={handleEditSubmit} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Customer Full Name
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="e.g. Ramesh Sharma"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Mobile Phone (10 Digits)
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="9876543210"
                          required
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="customer@example.com"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, isActive: e.target.checked }))
                            }
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-semibold text-slate-700">
                            Account is Active (Allow login & purchasing)
                          </span>
                        </label>
                      </div>

                      <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setDrawerTab("orders")}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={editSaving}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-xs"
                        >
                          {editSaving ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Account Activation / Deactivation */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.targetStatus ? "Activate Customer Account?" : "Deactivate Customer Account?"}
        message={
          confirmModal.targetStatus
            ? `Are you sure you want to activate the account for ${
                confirmModal.customer?.name || confirmModal.customer?.phone || "this customer"
              }? They will be able to log in and place orders.`
            : `Are you sure you want to deactivate the account for ${
                confirmModal.customer?.name || confirmModal.customer?.phone || "this customer"
              }? They will be prevented from logging in.`
        }
        confirmText={confirmModal.targetStatus ? "Activate Account" : "Deactivate Account"}
        cancelText="Cancel"
        type={confirmModal.targetStatus ? "info" : "danger"}
        isLoading={statusUpdating}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmModal({ isOpen: false, customer: null, targetStatus: false })}
      />
    </div>
  );
}
