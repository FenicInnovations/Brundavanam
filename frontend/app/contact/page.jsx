"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { supportApi } from "@/lib/api/supportApi";
import {
  CONTACT_PHONE,
  CONTACT_EMAIL,
  CONTACT_ADDRESS,
  BUSINESS_HOURS,
  WHATSAPP_NUMBER,
  WHATSAPP_URL,
} from "@/lib/constants";

const CATEGORIES = [
  { value: "general", label: "General Enquiry" },
  { value: "product", label: "Product Information & Ingredients" },
  { value: "order", label: "Order Status & Tracking" },
  { value: "shipping", label: "Shipping & Delivery" },
  { value: "payment", label: "Payment & Billing Issue" },
  { value: "return_refund", label: "Return / Refund Request" },
  { value: "complaint", label: "Product Quality Complaint" },
  { value: "partnership", label: "Partnership / Business Enquiry" },
  { value: "other", label: "Other Queries" },
];

export default function ContactPage() {
  const { user, status: authStatus } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "general",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [createdTicket, setCreatedTicket] = useState(null);

  // Quick ticket search state
  const [trackTicketNumber, setTrackTicketNumber] = useState("");

  // Populate authenticated user info automatically
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || (user.phone ? user.phone.replace(/\D/g, "").slice(-10) : ""),
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) {
      next.name = "Full name is required.";
    }
    if (!form.email.trim()) {
      next.email = "Email address is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    const cleanPhone = form.phone.replace(/\D/g, "");
    if (!cleanPhone) {
      next.phone = "Mobile number is required.";
    } else if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      next.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (!form.subject.trim()) {
      next.subject = "Please enter a subject.";
    } else if (form.subject.trim().length < 4) {
      next.subject = "Subject must be at least 4 characters.";
    }

    if (!form.message.trim()) {
      next.message = "Please write your message.";
    } else if (form.message.trim().length < 10) {
      next.message = "Please provide more details (at least 10 characters).";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await supportApi.createTicket({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      if (res.success && res.ticket) {
        setCreatedTicket(res.ticket);
      } else {
        setServerError("Failed to create ticket. Please try again.");
      }
    } catch (err) {
      setServerError(err.message || "Failed to submit enquiry. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCreatedTicket(null);
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone ? user.phone.replace(/\D/g, "").slice(-10) : "",
      category: "general",
      subject: "",
      message: "",
    });
    setErrors({});
    setServerError("");
  };

  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-16">
      {/* Hero Header */}
      <div className="max-w-2xl">
        <span className="inline-block rounded-full bg-accent/10 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-accent-deep">
          Customer Care & Enquiries
        </span>
        <h1 className="mt-3 font-display text-3xl text-ink md:text-4xl">
          How can we help you?
        </h1>
        <p className="mt-3 text-base text-ink-soft leading-relaxed">
          Have a question about our A2 dairy products, an existing order, delivery timings, or our indigenous cows?
          Our dedicated goshala care team is here to assist you.
        </p>

        {/* Authenticated user quick link to existing tickets */}
        {authStatus === "authenticated" && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-surface px-4 py-2.5 text-xs text-ink shadow-xs">
            <MessageSquare size={16} className="text-accent" />
            <span>Looking for your active support requests?</span>
            <Link
              href="/account/support"
              className="font-semibold text-accent-deep underline hover:text-accent"
            >
              View My Conversations &rarr;
            </Link>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.3fr]">
        {/* Left Column: Contact Cards & Business Info */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {/* Phone Card */}
            <a
              href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
              className="group flex items-start gap-4 rounded-xl border border-line bg-surface p-5 shadow-xs transition-all hover:border-accent hover:shadow-md"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-surface">
                <Phone size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Call Us</p>
                  <span className="text-xs text-accent-deep opacity-0 transition-opacity group-hover:opacity-100">
                    Dial &rarr;
                  </span>
                </div>
                <p className="text-xs text-ink-soft">Speak directly with our team</p>
                <p className="mt-1 text-sm font-medium text-ink">{CONTACT_PHONE}</p>
              </div>
            </a>

            {/* Email Card */}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="group flex items-start gap-4 rounded-xl border border-line bg-surface p-5 shadow-xs transition-all hover:border-accent hover:shadow-md"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-surface">
                <Mail size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Email Us</p>
                  <span className="text-xs text-accent-deep opacity-0 transition-opacity group-hover:opacity-100">
                    Write &rarr;
                  </span>
                </div>
                <p className="text-xs text-ink-soft">Send us your detailed enquiry</p>
                <p className="mt-1 text-sm font-medium text-ink truncate">{CONTACT_EMAIL}</p>
              </div>
            </a>

            {/* WhatsApp Card */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 rounded-xl border border-line bg-surface p-5 shadow-xs transition-all hover:border-emerald-600 hover:shadow-md"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <MessageCircle size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">WhatsApp</p>
                  <span className="text-xs text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-0.5">
                    Chat <ExternalLink size={11} />
                  </span>
                </div>
                <p className="text-xs text-ink-soft">Quick responses via WhatsApp</p>
                <p className="mt-1 text-sm font-medium text-ink">{WHATSAPP_NUMBER}</p>
              </div>
            </a>

            {/* Business Hours */}
            <div className="flex items-start gap-4 rounded-xl border border-line bg-surface p-5 shadow-xs">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Customer Support Hours</p>
                <p className="text-xs text-ink-soft">Average response time: 2–4 hours</p>
                <p className="mt-1 text-sm font-medium text-ink">{BUSINESS_HOURS}</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4 rounded-xl border border-line bg-surface p-5 shadow-xs">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Goshala Office</p>
                <p className="mt-1 text-xs text-ink-soft leading-relaxed">{CONTACT_ADDRESS}</p>
              </div>
            </div>
          </div>

          {/* Quick Ticket Lookup Box */}
          <div className="rounded-xl border border-line bg-surface/70 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Track Existing Ticket
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              Have a support reference number? Look up your conversation history.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={trackTicketNumber}
                onChange={(e) => setTrackTicketNumber(e.target.value.toUpperCase())}
                placeholder="e.g. SUP-2026-123456"
                className="w-full rounded border border-line bg-surface px-3 py-2 text-xs uppercase tracking-wider outline-none focus:border-accent"
              />
              <Link
                href={`/contact/track?ticket=${encodeURIComponent(trackTicketNumber)}`}
                className="inline-flex items-center justify-center rounded bg-ink px-4 py-2 text-xs font-medium text-surface transition-colors hover:bg-accent-deep"
              >
                Track
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Contact & Support Request Form */}
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-card">
          {createdTicket ? (
            /* Success State Confirmation */
            <div className="space-y-6 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Enquiry Received
                </span>
                <h2 className="mt-1 font-display text-2xl text-ink">
                  Your enquiry has been received
                </h2>
                <p className="mt-2 text-sm text-ink-soft leading-relaxed">
                  We've received your message and our team will get back to you shortly. A confirmation
                  has been dispatched to your email address.
                </p>
              </div>

              {/* Reference Number Box */}
              <div className="rounded-xl border border-accent/20 bg-bg p-5 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">
                    Support Reference Number
                  </p>
                  <p className="mt-1 font-mono text-xl font-bold text-accent-deep">
                    #{createdTicket.ticketNumber}
                  </p>
                </div>
                <div className="mt-3 sm:mt-0 flex items-center justify-center gap-1.5 text-xs text-support font-medium">
                  <ShieldCheck size={16} />
                  <span>Ticket Logged Securely</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  href={
                    user
                      ? `/account/support/${createdTicket.id}`
                      : `/contact/track?ticket=${createdTicket.ticketNumber}`
                  }
                  className="w-full sm:w-auto"
                >
                  View Conversation &rarr;
                </Button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="rounded border border-line px-6 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-bg"
                >
                  Submit Another Enquiry
                </button>
              </div>
            </div>
          ) : (
            /* Enquiry Form */
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <h2 className="font-display text-xl text-ink">Send an Enquiry</h2>
                <p className="mt-1 text-xs text-ink-soft">
                  Every enquiry creates a dedicated support ticket so you can track responses anytime.
                </p>
              </div>

              {serverError && (
                <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p>{serverError}</p>
                </div>
              )}

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  label="Full Name *"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  error={errors.name}
                  placeholder="e.g. Radhakrishnan"
                  disabled={submitting}
                />
                <FormField
                  label="Email Address *"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="name@example.com"
                  disabled={submitting}
                />
              </div>

              {/* Phone & Category Row */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="text-sm font-medium text-ink">
                    Mobile Number *
                  </label>
                  <div className="mt-1.5 flex items-center rounded border bg-surface focus-within:border-accent">
                    <span className="border-r border-line px-3 py-2.5 text-xs font-medium text-ink-soft bg-bg/50">
                      +91
                    </span>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      disabled={submitting}
                      className="w-full flex-1 rounded-r px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/60"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-accent-deep">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="category" className="text-sm font-medium text-ink">
                    Enquiry Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    disabled={submitting}
                    className="mt-1.5 w-full rounded border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <FormField
                label="Subject *"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                error={errors.subject}
                placeholder="What is your enquiry regarding?"
                disabled={submitting}
              />

              {/* Message */}
              <div>
                <FormField
                  label="Message *"
                  name="message"
                  as="textarea"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  error={errors.message}
                  placeholder="Provide all relevant details (order IDs, product queries, questions)..."
                  disabled={submitting}
                />
                <p className="mt-1 text-right text-[11px] text-ink-soft">
                  {form.message.length} characters
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-between">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Submitting Enquiry…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send size={15} />
                      Send Enquiry
                    </span>
                  )}
                </Button>

                <p className="hidden text-xs text-ink-soft sm:block">
                  Reference ID generated instantly
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
