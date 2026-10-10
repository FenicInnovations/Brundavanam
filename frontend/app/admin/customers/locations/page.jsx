"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  TrendingUp,
  Target,
  Sparkles,
  Search,
  Download,
  Copy,
  Check,
  Building,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Share2,
  RefreshCw,
  ShoppingBag,
  Flame,
  Award,
  ChevronLeft,
} from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";
import { useDispatch, triggerToast } from "@/lib/redux/store";

export default function CustomerLocationsPage() {
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedPincodes, setCopiedPincodes] = useState(false);

  // Filters for Address Table
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [activeTab, setActiveTab] = useState("marketing"); // "marketing" | "directory"

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/customers/locations");
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to fetch customer location insights:", err);
      dispatch(triggerToast("Failed to load location insights", "error"));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Copy top pincodes for Facebook / Meta Ads Manager location targeting
  const handleCopyPincodes = () => {
    if (!data?.topPincodes || data.topPincodes.length === 0) return;
    const pinString = data.topPincodes.map((p) => p.pincode).join(", ");
    navigator.clipboard.writeText(pinString);
    setCopiedPincodes(true);
    dispatch(
      triggerToast(
        `Copied ${data.topPincodes.length} PIN codes to clipboard for Meta / Google Ads targeting!`,
        "success"
      )
    );
    setTimeout(() => setCopiedPincodes(false), 2500);
  };

  // Filtered addresses
  const filteredAddresses = useMemo(() => {
    if (!data?.addresses) return [];
    let list = [...data.addresses];

    if (selectedState !== "all") {
      list = list.filter(
        (a) => a.state?.toLowerCase() === selectedState.toLowerCase()
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.customerName?.toLowerCase().includes(q) ||
          a.phone?.includes(q) ||
          a.city?.toLowerCase().includes(q) ||
          a.state?.toLowerCase().includes(q) ||
          a.postalCode?.includes(q) ||
          a.line1?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data?.addresses, selectedState, searchTerm]);

  // Distinct states for filter dropdown
  const uniqueStates = useMemo(() => {
    if (!data?.addresses) return [];
    const set = new Set();
    data.addresses.forEach((a) => {
      if (a.state) set.add(a.state);
    });
    return Array.from(set).sort();
  }, [data?.addresses]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-1">
            <Link href="/admin/customers" className="hover:text-emerald-700 flex items-center gap-1">
              <ChevronLeft size={14} />
              <span>Customers</span>
            </Link>
            <span>/</span>
            <span className="text-slate-800">Geographic & Digital Marketing Insights</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MapPin className="text-emerald-600" size={28} />
            <span>Customer Locations & Marketing Strategy</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Analyze customer geographic density across India to drive hyper-local Meta & Google digital marketing campaigns for A2 Ghee and Gau Puja essentials.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchInsights}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPincodes}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold shadow-md shadow-emerald-900/20 active:scale-95 transition-all"
          >
            {copiedPincodes ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedPincodes ? "PIN Codes Copied!" : "Copy PINs for Meta Ads"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Hubs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Delivery Hubs
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? "..." : data?.stats?.totalUniqueCities || 0}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Across {data?.stats?.totalUniqueStates || 0} States / UTs
            </p>
          </div>
        </div>

        {/* Top Market City */}
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Primary City Hub
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950">
              {loading ? "..." : data?.stats?.topCity || "Hyderabad"}
            </span>
            <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
              {data?.stats?.topCityPercentage || 0}% of all customer orders
            </p>
          </div>
        </div>

        {/* Primary State */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Primary State
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Flame size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? "..." : data?.stats?.topState || "Telangana"}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Dominant regional demand hub
            </p>
          </div>
        </div>

        {/* Saved Addresses / PIN Codes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Customer Addresses
            </span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? "..." : data?.stats?.totalSavedAddresses || 0}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {data?.stats?.totalUniquePincodes || 0} distinct PIN codes
            </p>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("marketing")}
          className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all ${
            activeTab === "marketing"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Target size={16} />
          <span>Digital Marketing Playbook & Geo Hubs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 pb-2 text-sm font-bold border-b-2 transition-all ${
            activeTab === "directory"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MapPin size={16} />
          <span>Customer Address Directory ({filteredAddresses.length})</span>
        </button>
      </div>

      {/* TAB 1: Marketing Playbook & Location Concentration */}
      {activeTab === "marketing" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Cities and Top States Visual Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Cities Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Top Customer Cities</h3>
                  <p className="text-xs text-slate-500">Ranked by customer count & order frequency</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  High Conversion Hubs
                </span>
              </div>

              <div className="space-y-4">
                {data?.topCities?.slice(0, 6).map((city, idx) => (
                  <div key={city.city} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-400 w-4">#{idx + 1}</span>
                        <span className="font-bold text-slate-900">{city.city}</span>
                        <span className="text-[11px] text-slate-500">({city.state})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600 font-semibold">{city.customerCount} customers</span>
                        <span className="font-extrabold text-emerald-800">{city.percentage}%</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(city.percentage, 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top States Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">State-wise Penetration</h3>
                  <p className="text-xs text-slate-500">Regional customer distribution across India</p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                  Territory Spread
                </span>
              </div>

              <div className="space-y-4">
                {data?.topStates?.slice(0, 6).map((st, idx) => (
                  <div key={st.state} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-400 w-4">#{idx + 1}</span>
                        <span className="font-bold text-slate-900">{st.state}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600 font-semibold">{st.customerCount} customers</span>
                        <span className="font-extrabold text-indigo-800">{st.percentage}%</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(st.percentage, 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Digital Marketing Action Plan Strategies */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} />
                  <span>How to Strengthen Sales in These Locations (Digital Marketing Playbook)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Data-driven advertising campaigns and product positioning tailored to your top customer locations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {data?.marketingRecommendations?.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        {rec.badge}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">
                        {rec.estimatedRoas}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {rec.title}
                    </h3>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                      {rec.insight}
                    </div>

                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Actionable Campaign Tactics:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {rec.actionPlan.map((act, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommended Products Tag */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Hero Products to Feature in Ads:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.suggestedProducts.map((p, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-semibold text-slate-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Address Directory Table */}
      {activeTab === "directory" && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs space-y-4 animate-in fade-in duration-200">
          {/* Table Search & State Filter Controls */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Customer, City, State, PIN Code, or Street..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter State:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none cursor-pointer hover:border-emerald-500 transition-colors"
              >
                <option value="all">All States ({uniqueStates.length})</option>
                {uniqueStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Delivery Address</th>
                  <th className="px-5 py-3.5">City & State</th>
                  <th className="px-5 py-3.5">PIN Code</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Source</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredAddresses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                      No addresses match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAddresses.map((addr) => (
                    <tr key={addr.id || `${addr.phone}-${addr.postalCode}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{addr.customerName}</div>
                        <div className="text-[11px] text-slate-500">+91 {addr.phone}</div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs truncate" title={`${addr.line1} ${addr.line2 || ''}`}>
                        <div>{addr.line1}</div>
                        {addr.line2 && <div className="text-[11px] text-slate-500">{addr.line2}</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-900">{addr.city}</span>,{" "}
                        <span className="text-slate-500">{addr.state}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {addr.postalCode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {addr.isDefault ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={11} /> Primary
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Secondary</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {addr.source || "Profile"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${addr.customerName}, ${addr.phone}, ${addr.line1}, ${addr.city}, ${addr.state} - ${addr.postalCode}`
                            );
                            dispatch(triggerToast("Full delivery address copied!", "success"));
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                          <Copy size={12} />
                          <span>Copy</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
