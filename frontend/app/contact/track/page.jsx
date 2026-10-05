"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  User,
  Headphones,
  Info,
  Search,
} from "lucide-react";
import { supportApi } from "@/lib/api/supportApi";
import Button from "@/components/ui/Button";

function TrackConversationContent() {
  const searchParams = useSearchParams();
  const initialTicketNumber = searchParams.get("ticket") || "";

  const [ticketNumber, setTicketNumber] = useState(initialTicketNumber);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState("");

  const fetchTicket = useCallback(async (tNum) => {
    if (!tNum || !tNum.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await supportApi.getGuestTicket(tNum.trim());
      if (res.success && res.ticket) {
        setTicket(res.ticket);
        setMessages(res.messages || []);
      }
    } catch (err) {
      setError(
        err.message ||
          `Ticket #${tNum} could not be located. Please verify your reference number.`
      );
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialTicketNumber) {
      fetchTicket(initialTicketNumber);
    }
  }, [initialTicketNumber, fetchTicket]);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!ticketNumber.trim()) {
      setError("Please enter your Ticket Reference Number (e.g. SUP-2026-400904).");
      return;
    }
    fetchTicket(ticketNumber.trim());
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !ticket) return;

    setSendingReply(true);
    setReplyError("");
    try {
      const res = await supportApi.replyGuestTicket(ticket.ticketNumber, {
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

  const getStatusBadge = (status) => {
    const config = {
      new: { label: "New", bg: "bg-purple-50 text-purple-700 border-purple-200" },
      open: { label: "Open", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      in_progress: { label: "In Progress", bg: "bg-sky-50 text-sky-700 border-sky-200" },
      waiting_customer: { label: "Waiting for Customer", bg: "bg-amber-50 text-amber-800 border-amber-200" },
      resolved: { label: "Resolved", bg: "bg-emerald-100 text-emerald-800 border-emerald-300" },
      closed: { label: "Closed", bg: "bg-slate-100 text-slate-700 border-slate-300" },
    };
    const c = config[status] || config.open;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Contact Us</span>
        </Link>
        <span className="text-xs text-ink-soft flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-support" />
          <span>Customer Support Desk</span>
        </span>
      </div>

      {/* Manual lookup input if not loaded or when searching */}
      {(!initialTicketNumber || !ticket) && (
        <div className="mt-8 mx-auto max-w-lg rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Search size={22} />
          </div>
          <h2 className="mt-4 font-display text-xl text-ink">Track Your Support Ticket</h2>
          <p className="mt-1 text-xs text-ink-soft leading-relaxed">
            Enter your support ticket reference number (e.g. <code>SUP-2026-400904</code>) to view the complete conversation history and reply to our support team.
          </p>

          <form onSubmit={handleManualSearch} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink uppercase tracking-wider">
                Ticket Reference Number
              </label>
              <input
                type="text"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                placeholder="e.g. SUP-2026-400904"
                className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm uppercase font-mono font-medium text-ink outline-none focus:border-accent"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Locating Ticket…
                </span>
              ) : (
                "View Conversation &rarr;"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Ticket Details & Thread */}
      {ticket && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Conversation Stream */}
          <div className="space-y-6">
            {/* Conversation Header */}
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-accent-deep bg-bg px-2.5 py-1 rounded border border-line">
                    #{ticket.ticketNumber}
                  </span>
                  {getStatusBadge(ticket.status)}
                </div>
                <button
                  onClick={() => fetchTicket(ticket.ticketNumber)}
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
                <span>Created {new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </div>

            {/* Resolved / Closed Notification Banner */}
            {(ticket.status === "resolved" || ticket.status === "closed") && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900">
                <CheckCircle2 size={18} className="mt-0.5 text-emerald-700 flex-shrink-0" />
                <div>
                  <p className="font-semibold">This ticket is marked as {ticket.status.toUpperCase()}</p>
                  <p className="mt-0.5 text-emerald-800">
                    If your issue is not fully addressed or you need further assistance, simply write a reply below to automatically reopen this ticket.
                  </p>
                </div>
              </div>
            )}

            {/* Messages Thread */}
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
                          {isCustomer ? "You" : (msg.senderName || "Brundavanam Support")}
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
                          Channel: {msg.channel}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Continue the Conversation
              </h3>

              <form onSubmit={handleSendReply} className="mt-3 space-y-3">
                <textarea
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your message or response here…"
                  disabled={sendingReply}
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-accent"
                />

                {replyError && (
                  <p className="text-xs text-accent-deep">{replyError}</p>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-ink-soft">
                    All replies remain grouped in this ticket thread.
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

          {/* Right Sidebar: Ticket Meta */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Ticket Information
              </h3>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <span className="text-ink-soft">Ticket Reference:</span>
                  <p className="font-mono font-bold text-ink">#{ticket.ticketNumber}</p>
                </div>
                <div>
                  <span className="text-ink-soft">Assigned Staff:</span>
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
              <p className="font-semibold text-ink">Need Immediate Assistance?</p>
              <p className="mt-1 leading-relaxed">
                You can also call our customer desk at +91 90000 00000 or WhatsApp us during business hours.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-content px-6 py-20 text-center text-sm text-ink-soft">
          Loading conversation…
        </div>
      }
    >
      <TrackConversationContent />
    </Suspense>
  );
}
