"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Headphones,
  ArrowRight,
  Plus,
  RefreshCw,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supportApi } from "@/lib/api/supportApi";
import Button from "@/components/ui/Button";

export default function CustomerSupportListPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/register");
    }
  }, [status, router]);

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await supportApi.getMyTickets();
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load support conversations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchTickets();
    }
  }, [status]);

  const getStatusBadge = (s) => {
    const config = {
      new: { label: "New", bg: "bg-purple-50 text-purple-700 border-purple-200" },
      open: { label: "Open", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      in_progress: { label: "In Progress", bg: "bg-sky-50 text-sky-700 border-sky-200" },
      waiting_customer: { label: "Waiting for You", bg: "bg-amber-50 text-amber-800 border-amber-300" },
      resolved: { label: "Resolved", bg: "bg-emerald-100 text-emerald-800 border-emerald-300" },
      closed: { label: "Closed", bg: "bg-slate-100 text-slate-700 border-slate-300" },
    };
    const c = config[s] || config.open;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  const getCategoryLabel = (cat) => {
    const map = {
      general: "General Enquiry",
      product: "Product Information",
      order: "Order Related",
      shipping: "Shipping & Delivery",
      payment: "Payment Issue",
      return_refund: "Return / Refund",
      complaint: "Product Complaint",
      partnership: "Partnership / Business",
      other: "Other",
    };
    return map[cat] || cat;
  };

  if (status === "loading" || (loading && tickets.length === 0)) {
    return (
      <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14 space-y-6">
        <div className="h-8 w-56 animate-pulse rounded bg-line" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-line/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className="text-xs font-semibold text-ink-soft hover:text-ink transition-colors"
            >
              Account
            </Link>
            <span className="text-xs text-ink-soft">/</span>
            <span className="text-xs font-semibold text-accent-deep">Support</span>
          </div>
          <h1 className="mt-2 font-display text-2xl text-ink md:text-3xl">
            My Support Requests
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Track and continue conversations regarding your orders, enquiries, and issues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTickets}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink-soft hover:text-ink transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <Button href="/contact">
            <Plus size={16} />
            <span>New Enquiry</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Ticket List */}
      <div className="mt-8 space-y-4">
        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
              <MessageSquare size={26} />
            </div>
            <h2 className="mt-4 font-display text-lg text-ink">No support requests yet</h2>
            <p className="mx-auto mt-2 max-w-md text-xs text-ink-soft leading-relaxed">
              Have questions about our cows, products, order shipping, or billing? Reach out to our customer care team anytime.
            </p>
            <div className="mt-6">
              <Button href="/contact">
                Contact Customer Care &rarr;
              </Button>
            </div>
          </div>
        ) : (
          tickets.map((t) => (
            <Link
              key={t._id}
              href={`/account/support/${t._id}`}
              className="group block rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs transition-all hover:border-accent hover:shadow-card"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-accent-deep bg-bg px-2.5 py-1 rounded border border-line">
                    #{t.ticketNumber}
                  </span>
                  {getStatusBadge(t.status)}
                  <span className="text-xs text-ink-soft">
                    {getCategoryLabel(t.category)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <Clock size={13} />
                  <span>
                    Updated {new Date(t.lastMessageAt || t.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-ink group-hover:text-accent-deep transition-colors">
                    {t.subject}
                  </h2>
                  <p className="mt-1 text-xs text-ink-soft line-clamp-2 leading-relaxed">
                    {t.latestMessage || "No message content"}
                  </p>
                </div>

                <div className="hidden sm:flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-bg text-ink-soft group-hover:bg-accent group-hover:text-white transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
