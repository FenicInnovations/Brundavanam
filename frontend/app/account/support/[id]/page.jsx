"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Headphones,
  Info,
  Clock,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supportApi } from "@/lib/api/supportApi";
import Button from "@/components/ui/Button";

export default function CustomerConversationPage() {
  const { id } = useParams();
  const { user, status: authStatus } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState("");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTicketDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await supportApi.getMyTicketById(id);
      if (res.success) {
        setTicket(res.ticket);
        setMessages(res.messages || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load ticket conversation.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/register");
    } else if (authStatus === "authenticated") {
      fetchTicketDetails();
    }
  }, [authStatus, router, fetchTicketDetails]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSendingReply(true);
    setReplyError("");
    try {
      const res = await supportApi.replyMyTicket(id, {
        message: replyMessage.trim(),
      });

      if (res.success) {
        setMessages((prev) => [...prev, res.message]);
        if (res.ticket?.status) {
          setTicket((prev) => ({ ...prev, status: res.ticket.status }));
        }
        setReplyMessage("");
      }
    } catch (err) {
      setReplyError(err.message || "Failed to send your reply. Please try again.");
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (s) => {
    const config = {
      new: { label: "New", bg: "bg-purple-50 text-purple-700 border-purple-200" },
      open: { label: "Open", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      in_progress: { label: "In Progress", bg: "bg-sky-50 text-sky-700 border-sky-200" },
      waiting_customer: { label: "Waiting for Customer", bg: "bg-amber-50 text-amber-800 border-amber-200" },
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

  if (loading && !ticket) {
    return (
      <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14 space-y-6">
        <div className="h-6 w-36 animate-pulse rounded bg-line" />
        <div className="h-32 animate-pulse rounded-2xl bg-line/60" />
        <div className="h-64 animate-pulse rounded-2xl bg-line/40" />
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="mx-auto max-w-content px-6 py-14 md:px-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle size={28} />
        </div>
        <h1 className="mt-4 font-display text-xl text-ink">Ticket Unavailable</h1>
        <p className="mt-2 text-sm text-ink-soft">{error}</p>
        <div className="mt-6">
          <Button href="/account/support">
            &larr; Back to My Support Requests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
      {/* Top Nav Breadcrumb */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <Link
          href="/account/support"
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to All Requests</span>
        </Link>
        <span className="text-xs text-ink-soft flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-support" />
          <span>Verified Customer Thread</span>
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main Conversation Thread Column */}
        <div className="space-y-6">
          {/* Ticket Header Card */}
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-accent-deep bg-bg px-2.5 py-1 rounded border border-line">
                  #{ticket.ticketNumber}
                </span>
                {getStatusBadge(ticket.status)}
              </div>

              <button
                onClick={fetchTicketDetails}
                className="flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors"
                title="Refresh messages"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>

            <h1 className="mt-4 font-display text-xl text-ink md:text-2xl">
              {ticket.subject}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
              <span>Category: <strong>{ticket.categoryLabel || ticket.category}</strong></span>
              <span>&bull;</span>
              <span>
                Created {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Reopen notice if resolved or closed */}
          {(ticket.status === "resolved" || ticket.status === "closed") && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900">
              <CheckCircle2 size={18} className="mt-0.5 text-emerald-700 flex-shrink-0" />
              <div>
                <p className="font-semibold">This ticket is marked as {ticket.status.toUpperCase()}</p>
                <p className="mt-0.5 text-emerald-800">
                  If you have further updates or if this issue was not fully resolved, reply below to automatically reopen this ticket.
                </p>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div className="space-y-4">
            {messages.map((msg, idx) => {
              if (msg.noteType === "system_event") {
                return (
                  <div key={msg._id || idx} className="my-3 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3.5 py-1 text-[11px] font-medium text-ink-soft">
                      <Info size={12} className="text-accent" />
                      {msg.message}
                    </span>
                  </div>
                );
              }

              const isCustomer = msg.senderType === "customer";

              return (
                <div
                  key={msg._id || idx}
                  className={`flex items-start gap-3.5 ${isCustomer ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCustomer
                        ? "bg-accent/15 text-accent-deep"
                        : "bg-emerald-900 text-white"
                    }`}
                  >
                    {isCustomer ? <User size={16} /> : <Headphones size={16} />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-5 shadow-xs ${
                      isCustomer
                        ? "rounded-tr-none bg-surface border border-accent/20"
                        : "rounded-tl-none bg-surface border border-line"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-line/60 pb-2 text-xs">
                      <span className="font-semibold text-ink">
                        {isCustomer ? "You" : (msg.senderName || "Brundavanam Support Team")}
                      </span>
                      <span className="text-[11px] text-ink-soft">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm text-ink leading-relaxed">
                      {msg.message}
                    </p>

                    {msg.channel && msg.channel !== "website" && (
                      <div className="mt-2 text-[10px] text-ink-soft italic">
                        Sent via {msg.channel}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Composer */}
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Reply to Support Team
            </h3>

            <form onSubmit={handleSendReply} className="mt-3 space-y-3">
              <textarea
                rows={4}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Write your response or additional information..."
                disabled={sendingReply}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-accent"
              />

              {replyError && (
                <p className="text-xs text-accent-deep">{replyError}</p>
              )}

              <div className="flex items-center justify-between">
                <p className="text-[11px] text-ink-soft">
                  Replies are added directly to this support thread.
                </p>
                <Button type="submit" disabled={sendingReply || !replyMessage.trim()}>
                  {sendingReply ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={15} className="animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Send size={14} />
                      Send Reply
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Meta Details */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Ticket Details
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-ink-soft">Reference:</span>
                <p className="font-mono font-bold text-ink">#{ticket.ticketNumber}</p>
              </div>
              <div>
                <span className="text-ink-soft">Category:</span>
                <p className="font-medium text-ink">{ticket.categoryLabel || ticket.category}</p>
              </div>
              <div>
                <span className="text-ink-soft">Assigned To:</span>
                <p className="font-medium text-ink">{ticket.assignedTo || "Support Team"}</p>
              </div>
              <div>
                <span className="text-ink-soft">Registered Email:</span>
                <p className="font-medium text-ink truncate">{ticket.email}</p>
              </div>
              <div>
                <span className="text-ink-soft">Contact Phone:</span>
                <p className="font-medium text-ink">{ticket.phone}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface/70 p-5 text-xs text-ink-soft">
            <p className="font-semibold text-ink">Immediate Support</p>
            <p className="mt-1 leading-relaxed">
              If your request requires urgent escalation, call us directly at +91 94926 02499.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
