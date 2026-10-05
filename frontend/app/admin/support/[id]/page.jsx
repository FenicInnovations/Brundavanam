"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Lock,
  Phone,
  PhoneCall,
  Mail,
  Clock,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Calendar,
  ExternalLink,
  MessageSquare,
  FileText,
  UserCheck,
  ChevronDown,
  Info,
  Check,
} from "lucide-react";
import { supportApi } from "@/lib/api/supportApi";
import { useDispatch, triggerToast } from "@/lib/redux/store";

export default function AdminTicketWorkspacePage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Timeline filter tab
  const [timelineFilter, setTimelineFilter] = useState("all"); // all | messages | internal | calls | system

  // Composer state
  const [composerTab, setComposerTab] = useState("reply"); // reply | note | call
  const [replyText, setReplyText] = useState("");
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [replyChannel, setReplyChannel] = useState("website");
  const [sendingReply, setSendingReply] = useState(false);

  // Internal Note state
  const [internalNoteText, setInternalNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Call Log state
  const [callPhoneNumber, setCallPhoneNumber] = useState("");
  const [callDuration, setCallDuration] = useState("5");
  const [callOutcome, setCallOutcome] = useState("answered");
  const [callNoteText, setCallNoteText] = useState("");
  const [savingCall, setSavingCall] = useState(false);

  // Quick updating status/priority
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [ticketRes, staffRes] = await Promise.all([
        supportApi.getAdminTicketById(id),
        supportApi.getAdminStaff().catch(() => ({ success: false, data: [] })),
      ]);

      if (ticketRes.success) {
        setTicket(ticketRes.data.ticket);
        setMessages(ticketRes.data.messages || []);
        setCustomerProfile(ticketRes.data.customerProfile);
        setCallPhoneNumber(ticketRes.data.ticket.phone || "");
      }

      if (staffRes.success) {
        setStaffList(staffRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load admin ticket:", err);
      setError(err.message || "Failed to load support ticket workspace.");
      dispatch(triggerToast(err.message || "Failed to load ticket", "error"));
    } finally {
      setLoading(false);
    }
  }, [id, dispatch]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await supportApi.adminReply(id, {
        message: replyText.trim(),
        channel: replyChannel,
        sendEmailNotification,
      });

      if (res.success) {
        if (sendEmailNotification) {
          if (res.emailDispatched) {
            dispatch(
              triggerToast(
                `Reply posted & live email sent to ${ticket?.email}!`,
                "success"
              )
            );
          } else {
            dispatch(
              triggerToast(
                `Reply saved to website, but email failed: ${res.emailError || "Check SMTP configuration"}`,
                "warning"
              )
            );
          }
        } else {
          dispatch(triggerToast("Reply posted to conversation thread", "success"));
        }
        setReplyText("");
        fetchTicket();
      }
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to post reply", "error"));
    } finally {
      setSendingReply(false);
    }
  };

  const [testingEmail, setTestingEmail] = useState(false);
  const handleTestEmail = async () => {
    if (!ticket?.email) return;
    setTestingEmail(true);
    try {
      const res = await supportApi.sendAdminTestEmail(ticket.email);
      if (res.success) {
        dispatch(triggerToast(`Live test email successfully dispatched to ${ticket.email}!`, "success"));
      }
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to send test email. Verify SMTP settings in backend/.env", "error"));
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSaveInternalNote = async (e) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;

    setSavingNote(true);
    try {
      const res = await supportApi.adminAddInternalNote(id, {
        note: internalNoteText.trim(),
      });

      if (res.success) {
        dispatch(triggerToast("Private internal note saved", "success"));
        setInternalNoteText("");
        fetchTicket();
      }
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to save internal note", "error"));
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveCallLog = async (e) => {
    e.preventDefault();
    if (!callNoteText.trim()) return;

    setSavingCall(true);
    try {
      const res = await supportApi.adminLogCall(id, {
        phoneNumber: callPhoneNumber,
        durationMinutes: callDuration,
        outcome: callOutcome,
        note: callNoteText.trim(),
      });

      if (res.success) {
        dispatch(triggerToast("Phone call logged into timeline", "success"));
        setCallNoteText("");
        fetchTicket();
      }
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to log phone call", "error"));
    } finally {
      setSavingCall(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await supportApi.adminUpdateStatus(id, newStatus);
      if (res.success) {
        setTicket((prev) => ({ ...prev, status: newStatus }));
        dispatch(triggerToast(`Status updated to ${newStatus.toUpperCase()}`, "success"));
        fetchTicket();
      }
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to update status", "error"));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    setUpdatingPriority(true);
    try {
      const res = await supportApi.adminUpdatePriority(id, newPriority);
      if (res.success) {
        setTicket((prev) => ({ ...prev, priority: newPriority }));
        dispatch(triggerToast(`Priority set to ${newPriority.toUpperCase()}`, "success"));
        fetchTicket();
      }
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to update priority", "error"));
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleAssigneeChange = async (assignedTo) => {
    setUpdatingAssignee(true);
    try {
      const res = await supportApi.adminAssignTicket(id, assignedTo || null);
      if (res.success) {
        dispatch(triggerToast(`Ticket assigned to ${res.ticket.assigneeName}`, "success"));
        fetchTicket();
      }
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to assign ticket", "error"));
    } finally {
      setUpdatingAssignee(false);
    }
  };

  const handleTriggerPhoneCall = () => {
    setComposerTab("call");
    window.location.href = `tel:${ticket.phone.replace(/\s+/g, "")}`;
  };

  const filteredMessages = messages.filter((msg) => {
    if (timelineFilter === "all") return true;
    if (timelineFilter === "messages") return msg.noteType === "message";
    if (timelineFilter === "internal") return msg.isInternal && msg.noteType === "internal_note";
    if (timelineFilter === "calls") return msg.noteType === "call_note";
    if (timelineFilter === "system") return msg.noteType === "system_event";
    return true;
  });

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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg}`}>
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

  if (loading && !ticket) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-36 bg-slate-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Failed to Load Ticket</h2>
        <p className="text-xs text-slate-500">{error}</p>
        <Link
          href="/admin/support"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Support Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/support"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
            title="Back to Tickets"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                #{ticket.ticketNumber}
              </span>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1 leading-tight">{ticket.subject}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchTicket}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {/* Quick Resolve Button */}
          {ticket.status !== "resolved" && (
            <button
              onClick={() => handleStatusChange("resolved")}
              disabled={updatingStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Resolved</span>
            </button>
          )}

          {ticket.status === "resolved" && (
            <button
              onClick={() => handleStatusChange("open")}
              disabled={updatingStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-700 shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reopen Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace (PART 11: Two-column layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* LEFT / MAIN AREA: Timeline & Composer */}
        <div className="space-y-6">
          {/* Timeline Filter Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1">
              {[
                { key: "all", label: "All History", count: messages.length },
                {
                  key: "messages",
                  label: "Messages",
                  count: messages.filter((m) => m.noteType === "message").length,
                },
                {
                  key: "internal",
                  label: "Internal Notes",
                  count: messages.filter((m) => m.isInternal && m.noteType === "internal_note").length,
                },
                {
                  key: "calls",
                  label: "Call Logs",
                  count: messages.filter((m) => m.noteType === "call_note").length,
                },
                {
                  key: "system",
                  label: "Audit Events",
                  count: messages.filter((m) => m.noteType === "system_event").length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTimelineFilter(tab.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    timelineFilter === tab.key
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="ml-1 text-[10px] opacity-75">({tab.count})</span>
                </button>
              ))}
            </div>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Audit trail ordered chronologically
            </span>
          </div>

          {/* Conversation Stream & Audit Timeline (PART 14) */}
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                No items match this filter tab.
              </div>
            ) : (
              filteredMessages.map((msg, idx) => {
                // System Audit Event
                if (msg.noteType === "system_event") {
                  return (
                    <div key={msg._id || idx} className="my-2 flex items-center justify-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-100/80 text-[11px] text-slate-600">
                        <Info className="w-3 h-3 text-emerald-600" />
                        <span>{msg.message}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Internal Private Note (PART 13)
                if (msg.isInternal && msg.noteType === "internal_note") {
                  return (
                    <div
                      key={msg._id || idx}
                      className="p-4 rounded-2xl border border-amber-200 bg-amber-50/70 shadow-xs space-y-2 relative"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-amber-900">
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Private Internal Note</span>
                          <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.2 rounded-full font-mono">
                            Team Only
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-800">
                          By <strong>{msg.senderName}</strong> &bull;{" "}
                          {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <p className="text-xs text-amber-950 whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  );
                }

                // Phone Call Log Record (PART 12)
                if (msg.noteType === "call_note") {
                  return (
                    <div
                      key={msg._id || idx}
                      className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-emerald-950">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Phone Call Recorded</span>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full capitalize">
                            {msg.callDetails?.outcome?.replace(/_/g, " ") || "Answered"}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-800">
                          {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      <div className="text-xs text-slate-800 bg-white/80 p-3 rounded-xl border border-emerald-100">
                        <p className="font-medium">{msg.message}</p>
                        <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-4">
                          <span>Phone: {msg.callDetails?.phoneNumber || ticket.phone}</span>
                          <span>Duration: {msg.callDetails?.durationMinutes || 0} minutes</span>
                          <span>Logged by: {msg.senderName}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Standard Message (Customer vs Admin)
                const isCustomer = msg.senderType === "customer";

                return (
                  <div
                    key={msg._id || idx}
                    className={`flex items-start gap-3.5 ${isCustomer ? "flex-row" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs ${
                        isCustomer
                          ? "bg-slate-700 text-white"
                          : "bg-emerald-600 text-white"
                      }`}
                    >
                      {isCustomer ? <User className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-5 shadow-xs border ${
                        isCustomer
                          ? "bg-white border-slate-200 rounded-tl-none"
                          : "bg-emerald-950 text-white border-emerald-900 rounded-tr-none"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between gap-4 border-b pb-2 text-xs ${
                          isCustomer ? "border-slate-100 text-slate-600" : "border-emerald-900/60 text-emerald-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {msg.senderName}
                          </span>
                          {!isCustomer && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 font-medium">
                              Staff
                            </span>
                          )}
                          {isCustomer && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              Customer
                            </span>
                          )}
                        </div>
                        <span className="text-[10px]">
                          {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p
                        className={`mt-3 text-xs leading-relaxed whitespace-pre-wrap ${
                          isCustomer ? "text-slate-800" : "text-emerald-50"
                        }`}
                      >
                        {msg.message}
                      </p>

                      {msg.channel && msg.channel !== "website" && (
                        <div
                          className={`mt-2 text-[10px] italic ${
                            isCustomer ? "text-slate-400" : "text-emerald-400"
                          }`}
                        >
                          Channel: {msg.channel}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Unified Composer System (PART 12: Website, Email, Phone call, Internal Notes) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50/70 p-2 gap-2">
              <button
                type="button"
                onClick={() => setComposerTab("reply")}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  composerTab === "reply"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reply to Customer</span>
              </button>

              <button
                type="button"
                onClick={() => setComposerTab("note")}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  composerTab === "note"
                    ? "bg-white text-amber-900 shadow-xs border border-amber-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Private Note</span>
              </button>

              <button
                type="button"
                onClick={() => setComposerTab("call")}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  composerTab === "call"
                    ? "bg-white text-emerald-900 shadow-xs border border-emerald-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                <span>Log Phone Call</span>
              </button>
            </div>

            {/* Tab 1: Customer Reply */}
            {composerTab === "reply" && (
              <form onSubmit={handleSendReply} className="p-5 space-y-4">
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your response to the customer…"
                  disabled={sendingReply}
                  className="w-full text-xs rounded-xl border border-slate-200 p-3.5 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800"
                />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={sendEmailNotification}
                        onChange={(e) => setSendEmailNotification(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Send Email Notification to {ticket.email}</span>
                    </label>

                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="text-[11px]">Via:</span>
                      <select
                        value={replyChannel}
                        onChange={(e) => setReplyChannel(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50"
                      >
                        <option value="website">Website Thread</option>
                        <option value="email">Direct Email</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 shadow-sm transition-all disabled:opacity-40"
                  >
                    {sendingReply ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching Reply…</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Response</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Internal Note */}
            {composerTab === "note" && (
              <form onSubmit={handleSaveInternalNote} className="p-5 space-y-4 bg-amber-50/40">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Internal Note (Strictly Private &mdash; not visible to customer)</span>
                </div>

                <textarea
                  rows={3}
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                  placeholder="e.g. Spoke with warehouse manager. Order will be dispatched with batch #4 tomorrow..."
                  disabled={savingNote}
                  className="w-full text-xs rounded-xl border border-amber-200 bg-white p-3.5 outline-none focus:border-amber-500 text-slate-800"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingNote || !internalNoteText.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-500 shadow-sm transition-all disabled:opacity-40"
                  >
                    {savingNote ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                    <span>Save Internal Note</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Log Phone Call */}
            {composerTab === "call" && (
              <form onSubmit={handleSaveCallLog} className="p-5 space-y-4 bg-emerald-50/40">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Record Phone Conversation Summary</span>
                  </div>
                  <a
                    href={`tel:${ticket.phone.replace(/\s+/g, "")}`}
                    className="text-emerald-700 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Customer Now</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Phone Number</label>
                    <input
                      type="text"
                      value={callPhoneNumber}
                      onChange={(e) => setCallPhoneNumber(e.target.value)}
                      className="mt-1 w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Call Duration (min)</label>
                    <input
                      type="number"
                      min="0"
                      value={callDuration}
                      onChange={(e) => setCallDuration(e.target.value)}
                      className="mt-1 w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Call Outcome</label>
                    <select
                      value={callOutcome}
                      onChange={(e) => setCallOutcome(e.target.value)}
                      className="mt-1 w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white"
                    >
                      <option value="answered">Answered / Discussed</option>
                      <option value="resolved">Resolved on Call</option>
                      <option value="voicemail">Left Voicemail</option>
                      <option value="callback_requested">Callback Requested</option>
                      <option value="busy">Busy / Disconnected</option>
                      <option value="no_answer">No Answer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Call Notes & Agreement</label>
                  <textarea
                    rows={3}
                    value={callNoteText}
                    onChange={(e) => setCallNoteText(e.target.value)}
                    placeholder="Summarize the phone conversation: customer agreement, commitments made, delivery expectations..."
                    disabled={savingCall}
                    className="mt-1 w-full text-xs rounded-xl border border-emerald-200 bg-white p-3.5 outline-none focus:border-emerald-600 text-slate-800"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingCall || !callNoteText.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-600 shadow-sm transition-all disabled:opacity-40"
                  >
                    {savingCall ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <PhoneCall className="w-3.5 h-3.5" />
                    )}
                    <span>Save Call Record</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR: Customer Info & Ticket Control Center (PART 11) */}
        <div className="space-y-5">
          {/* Customer Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Customer Information</span>
              {customerProfile?.isRegistered ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                  Registered Member
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  Guest Enquiry
                </span>
              )}
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-amber-500 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                {ticket.name ? ticket.name[0].toUpperCase() : "C"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">{ticket.name}</p>
                <p className="text-xs text-slate-500 truncate">{ticket.email}</p>
                <p className="text-xs text-slate-500">{ticket.phone}</p>
              </div>
            </div>

            {/* Direct Quick Action CTAs (PART 12) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleTriggerPhoneCall}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Customer</span>
              </button>

              <a
                href={`mailto:${ticket.email}?subject=RE: [SUP-${ticket.ticketNumber}] ${ticket.subject}`}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white transition-all border border-sky-200 shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Client</span>
              </a>

              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white transition-all border border-amber-200 shadow-xs disabled:opacity-50"
              >
                {testingEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Test Email…</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    <span>Send Test Email via Gmail SMTP</span>
                  </>
                )}
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Total Support Tickets:</span>
                <span className="font-semibold text-slate-800">{customerProfile?.totalTickets || 1}</span>
              </div>
              {customerProfile?.registeredAt && (
                <div className="flex justify-between text-slate-500">
                  <span>Customer Since:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(customerProfile.registeredAt).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Other Tickets History by this customer */}
            {customerProfile?.otherRecentTickets?.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Past Enquiries
                </span>
                <div className="mt-2 space-y-1.5">
                  {customerProfile.otherRecentTickets.map((ot) => (
                    <Link
                      key={ot._id}
                      href={`/admin/support/${ot._id}`}
                      className="block p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-xs"
                    >
                      <div className="flex justify-between font-mono font-semibold text-emerald-700">
                        <span>#{ot.ticketNumber}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{ot.status}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate mt-0.5">{ot.subject}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ticket Properties Management Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Ticket Settings
            </h3>

            {/* Status Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Status</label>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className="mt-1 w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-800 outline-none focus:border-emerald-600"
              >
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_customer">Waiting for Customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Priority Level</label>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                disabled={updatingPriority}
                className="mt-1 w-full text-xs font-semibold rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-800 outline-none focus:border-emerald-600"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Assignee Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Assigned Staff</label>
              <select
                value={ticket.assignedTo?._id || ticket.assignedTo || ""}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                disabled={updatingAssignee}
                className="mt-1 w-full text-xs font-medium rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-800 outline-none focus:border-emerald-600"
              >
                <option value="">Unassigned</option>
                {staffList.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.name} ({st.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Display */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Category:</span>
              <span className="font-semibold text-slate-800 capitalize">
                {ticket.category.replace(/_/g, " ")}
              </span>
            </div>

            {/* Origin Channel */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Source Channel:</span>
              <span className="font-semibold text-slate-800 capitalize">
                {ticket.channel || "Website Form"}
              </span>
            </div>

            {/* Created At */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Created:</span>
              <span className="text-slate-700">
                {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quick Actions
            </h3>

            <div className="space-y-2">
              {ticket.status !== "resolved" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange("resolved")}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark as Resolved</span>
                </button>
              )}

              {ticket.status !== "closed" ? (
                <button
                  type="button"
                  onClick={() => handleStatusChange("closed")}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Close Ticket</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStatusChange("open")}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reopen Ticket</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
