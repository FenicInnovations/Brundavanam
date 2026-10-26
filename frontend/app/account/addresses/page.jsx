"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  Building,
  CheckCircle2,
  Trash2,
  Edit2,
  ChevronLeft,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useDispatch, triggerToast } from "@/lib/redux/store";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Telangana",
  "Karnataka",
  "Tamil Nadu",
  "Maharashtra",
  "Kerala",
  "Gujarat",
  "Delhi",
  "Rajasthan",
  "Uttar Pradesh",
  "Madhya Pradesh",
  "West Bengal",
  "Bihar",
  "Punjab",
  "Haryana",
  "Odisha",
  "Assam",
  "Goa",
  "Other State / UT",
];

const INITIAL_FORM = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "Telangana",
  postalCode: "",
  country: "India",
  isDefault: false,
};

export default function AddressesPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, status, refresh } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxLimit, setMaxLimit] = useState(5);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [deletingId, setDeletingId] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/register");
    }
  }, [status, router]);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAddresses();
      if (res.success) {
        setAddresses(res.addresses || []);
        if (res.maxLimit) setMaxLimit(res.maxLimit);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      loadAddresses();
    }
  }, [status, loadAddresses]);

  const handleOpenAdd = () => {
    if (addresses.length >= maxLimit) {
      dispatch(
        triggerToast(
          `You have reached the maximum limit of ${maxLimit} addresses. Please edit or delete an existing address.`,
          "warning"
        )
      );
      return;
    }
    setEditingId(null);
    setFormData({
      ...INITIAL_FORM,
      fullName: user?.name || "",
      phone: user?.phone || "",
      isDefault: addresses.length === 0,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingId(addr._id);
    setFormData({
      label: addr.label || "Home",
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      line1: addr.line1 || "",
      line2: addr.line2 || "",
      city: addr.city || "",
      state: addr.state || "Telangana",
      postalCode: addr.postalCode || "",
      country: addr.country || "India",
      isDefault: Boolean(addr.isDefault),
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.line1.trim() || !formData.city.trim() || !formData.postalCode.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (!/^\d{6}$/.test(formData.postalCode.trim())) {
      setFormError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await api.updateAddress(editingId, formData);
        if (res.success) {
          setAddresses(res.addresses);
          dispatch(triggerToast("Address updated successfully.", "success"));
          setModalOpen(false);
          await refresh();
          if (typeof window !== "undefined") window.dispatchEvent(new Event("address-updated"));
        }
      } else {
        const res = await api.addAddress(formData);
        if (res.success) {
          setAddresses(res.addresses);
          dispatch(triggerToast("Address added successfully.", "success"));
          setModalOpen(false);
          await refresh();
          if (typeof window !== "undefined") window.dispatchEvent(new Event("address-updated"));
        }
      }
    } catch (err) {
      setFormError(err.message || "Could not save address. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this delivery address?")) return;

    setDeletingId(id);
    try {
      const res = await api.deleteAddress(id);
      if (res.success) {
        setAddresses(res.addresses);
        dispatch(triggerToast("Address removed.", "info"));
        await refresh();
        if (typeof window !== "undefined") window.dispatchEvent(new Event("address-updated"));
      }
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to remove address", "error"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (id) => {
    setSettingDefaultId(id);
    try {
      const res = await api.setDefaultAddress(id);
      if (res.success) {
        setAddresses(res.addresses);
        dispatch(triggerToast("Primary delivery address updated.", "success"));
        await refresh();
        if (typeof window !== "undefined") window.dispatchEvent(new Event("address-updated"));
      }
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to set primary address", "error"));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const getLabelIcon = (label) => {
    const l = (label || "").toLowerCase();
    if (l === "work" || l === "office") return <Briefcase size={16} className="text-amber-600" />;
    if (l === "other") return <Building size={16} className="text-indigo-600" />;
    return <Home size={16} className="text-emerald-600" />;
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-content px-6 py-12 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-xs font-semibold text-ink-soft">Loading address book...</p>
        </div>
      </div>
    );
  }

  const limitReached = addresses.length >= maxLimit;

  return (
    <div className="mx-auto max-w-content px-4 sm:px-6 py-8 md:px-8 md:py-12 space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-ink-soft font-medium">
        <Link href="/account" className="hover:text-accent flex items-center gap-1 transition-colors">
          <ChevronLeft size={14} />
          <span>My Account</span>
        </Link>
        <span>/</span>
        <span className="text-ink font-semibold">Saved Addresses</span>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#20180f] via-[#2c2215] to-[#1c1813] text-[#faf3e0] p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
            <MapPin size={13} className="text-amber-400" />
            <span>Delivery Management</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Saved Delivery Addresses
          </h1>
          <p className="text-xs sm:text-sm text-[#ded4be] max-w-xl leading-relaxed">
            Manage your doorstep delivery locations. Your designated <strong className="text-amber-300">Primary Address</strong> will be automatically selected during checkout.
          </p>
        </div>

        {/* Counter Badge & Add Button */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3">
          {/* Address Limit Progress */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10 text-right">
            <div className="flex items-center gap-2 justify-between">
              <span className="text-xs text-[#ded4be]">Saved Slots:</span>
              <span className="text-xs font-extrabold text-amber-300">
                {addresses.length} of {maxLimit} max
              </span>
            </div>
            <div className="w-36 h-1.5 bg-black/40 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  limitReached ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{ width: `${(addresses.length / maxLimit) * 100}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            disabled={limitReached}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md active:scale-95 ${
              limitReached
                ? "bg-white/20 text-white/50 cursor-not-allowed"
                : "bg-accent hover:bg-accent-deep text-surface shadow-accent/25"
            }`}
          >
            <Plus size={16} />
            <span>Add New Address</span>
          </button>
        </div>
      </div>

      {/* Safety Notice regarding Address Limits */}
      {limitReached && (
        <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-xs text-amber-900">
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <p>
            <strong>Address Limit Reached:</strong> To keep your account secure and prevent system misuse, customers can save up to <strong>{maxLimit} addresses</strong>. Please update or remove an existing address to register a new delivery location.
          </p>
        </div>
      )}

      {/* Address Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="h-48 rounded-2xl border bg-surface/50 animate-pulse" />
          <div className="h-48 rounded-2xl border bg-surface/50 animate-pulse" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface/60 p-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <MapPin size={26} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-ink">No Saved Addresses Found</h3>
            <p className="text-xs text-ink-soft max-w-sm mx-auto">
              Save your home or work address now for lightning-fast checkout on all Goshala products.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-surface shadow-sm hover:bg-accent-deep transition-all"
          >
            <Plus size={16} />
            <span>Add First Delivery Address</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => {
            const isPrimary = Boolean(addr.isDefault);
            return (
              <div
                key={addr._id}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                  isPrimary
                    ? "border-emerald-600/70 bg-gradient-to-br from-emerald-50/40 via-surface to-surface shadow-md ring-1 ring-emerald-500/30"
                    : "border-line bg-surface hover:border-accent/40 hover:shadow-sm"
                }`}
              >
                <div>
                  {/* Card Header: Label & Primary Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg border border-line/60">
                        {getLabelIcon(addr.label)}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-ink">
                        {addr.label || "Home"}
                      </span>
                    </div>

                    {isPrimary ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300/80 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800 shadow-2xs">
                        <CheckCircle2 size={13} className="text-emerald-700" />
                        <span>Primary Address</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={settingDefaultId === addr._id}
                        onClick={() => handleSetPrimary(addr._id)}
                        className="text-[11px] font-semibold text-accent-deep hover:text-accent hover:underline transition-colors"
                      >
                        {settingDefaultId === addr._id ? "Setting..." : "Set as Primary"}
                      </button>
                    )}
                  </div>

                  {/* Customer Contact */}
                  <h3 className="font-display text-sm font-bold text-ink">
                    {addr.fullName}
                  </h3>
                  <p className="text-xs font-semibold text-ink-soft mt-0.5">
                    +91 {addr.phone}
                  </p>

                  {/* Address Details */}
                  <div className="mt-3 text-xs text-ink/80 leading-relaxed font-sans space-y-0.5">
                    <p>{addr.line1}</p>
                    {addr.line2 && <p>{addr.line2}</p>}
                    <p className="font-medium text-ink">
                      {addr.city}, {addr.state} – <span className="font-bold text-emerald-800">{addr.postalCode}</span>
                    </p>
                    <p className="text-ink-soft/80">{addr.country || "India"}</p>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-5 pt-3 border-t border-line/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(addr)}
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink hover:bg-bg transition-colors"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === addr._id}
                      onClick={() => handleDelete(addr._id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>{deletingId === addr._id ? "Removing..." : "Delete"}</span>
                    </button>
                  </div>

                  {isPrimary && (
                    <span className="text-[11px] text-emerald-700 font-medium italic">
                      Auto-used at checkout
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Address Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-surface border border-line shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink">
                    {editingId ? "Edit Delivery Address" : "Add New Delivery Address"}
                  </h2>
                  <p className="text-[11px] text-ink-soft">
                    Slot {addresses.length + (editingId ? 0 : 1)} of {maxLimit} allowed addresses
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 rounded-full border border-line flex items-center justify-center text-ink-soft hover:text-ink hover:bg-bg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Address Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Address Label Buttons */}
              <div>
                <label className="block font-semibold text-ink-soft mb-1.5">Address Label</label>
                <div className="flex items-center gap-2">
                  {["Home", "Work", "Other"].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, label: lbl }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        formData.label === lbl
                          ? "bg-accent text-surface border-accent shadow-xs"
                          : "bg-surface border-line text-ink-soft hover:bg-bg"
                      }`}
                    >
                      {getLabelIcon(lbl)}
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-soft mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Recipient name"
                    className="w-full rounded-xl border border-line bg-bg/50 px-3 py-2 text-xs text-ink outline-none focus:border-accent focus:bg-surface transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink-soft mb-1">10-Digit Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-xl border border-line bg-bg/50 px-3 py-2 text-xs text-ink outline-none focus:border-accent focus:bg-surface transition-all"
                  />
                </div>
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block font-semibold text-ink-soft mb-1">
                  Flat, House No., Building, Apartment *
                </label>
                <input
                  type="text"
                  required
                  value={formData.line1}
                  onChange={(e) => setFormData((p) => ({ ...p, line1: e.target.value }))}
                  placeholder="e.g. Flat 402, Brundavanam Towers"
                  className="w-full rounded-xl border border-line bg-bg/50 px-3 py-2 text-xs text-ink outline-none focus:border-accent focus:bg-surface transition-all"
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block font-semibold text-ink-soft mb-1">
                  Area, Colony, Street, Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={formData.line2}
                  onChange={(e) => setFormData((p) => ({ ...p, line2: e.target.value }))}
                  placeholder="e.g. Near Sri Krishna Temple, Gachibowli"
                  className="w-full rounded-xl border border-line bg-bg/50 px-3 py-2 text-xs text-ink outline-none focus:border-accent focus:bg-surface transition-all"
                />
              </div>

              {/* City, State, PIN Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-ink-soft mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    placeholder="e.g. Hyderabad"
                    className="w-full rounded-xl border border-line bg-bg/50 px-3 py-2 text-xs text-ink outline-none focus:border-accent focus:bg-surface transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink-soft mb-1">State *</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
                    className="w-full rounded-xl border border-line bg-bg/50 px-3 py-2 text-xs text-ink outline-none focus:border-accent focus:bg-surface transition-all cursor-pointer"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-ink-soft mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={formData.postalCode}
                    onChange={(e) => setFormData((p) => ({ ...p, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                    placeholder="e.g. 500032"
                    className="w-full rounded-xl border border-line bg-bg/50 px-3 py-2 text-xs text-ink outline-none focus:border-accent focus:bg-surface transition-all font-mono"
                  />
                </div>
              </div>

              {/* Primary Address Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData((p) => ({ ...p, isDefault: e.target.checked }))}
                    className="h-4 w-4 rounded-md border-line text-accent accent-accent focus:ring-accent"
                  />
                  <span className="font-semibold text-ink">
                    Set this as my primary delivery address
                  </span>
                </label>
                <p className="text-[11px] text-ink-soft pl-6.5 mt-0.5">
                  Your primary address is automatically selected for instant one-click checkout.
                </p>
              </div>

              {/* Actions Row */}
              <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-line px-4 py-2 font-semibold text-ink-soft hover:bg-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2 font-bold text-surface shadow-xs hover:bg-accent-deep transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingId ? "Save Changes" : "Save Delivery Address"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
