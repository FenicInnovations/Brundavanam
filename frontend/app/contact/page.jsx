"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube } from "lucide-react";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";
import {
  CONTACT_PHONE,
  CONTACT_EMAIL,
  CONTACT_ADDRESS,
  BUSINESS_HOURS,
} from "@/lib/constants";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.message.trim()) next.message = "Please write a message.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // No backend endpoint yet — swaps for POST /api/contact later.
    setStatus("sent");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
      <h1 className="font-display text-2xl text-ink md:text-3xl">Contact Us</h1>
      <p className="mt-2 max-w-lg text-sm text-ink-soft">
        Questions about an order, a product, or the goshala itself — we'd
        love to hear from you.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <ul className="flex flex-col gap-5">
            <li className="flex items-start gap-3">
              <Phone size={18} className="mt-0.5 text-accent" />
              <div>
                <p className="text-sm font-medium text-ink">Call Us</p>
                <p className="text-sm text-ink-soft">{CONTACT_PHONE}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={18} className="mt-0.5 text-accent" />
              <div>
                <p className="text-sm font-medium text-ink">Email Us</p>
                <p className="text-sm text-ink-soft">{CONTACT_EMAIL}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 text-accent" />
              <div>
                <p className="text-sm font-medium text-ink">Visit Us</p>
                <p className="text-sm text-ink-soft">{CONTACT_ADDRESS}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Clock size={18} className="mt-0.5 text-accent" />
              <div>
                <p className="text-sm font-medium text-ink">Business Hours</p>
                <p className="text-sm text-ink-soft">{BUSINESS_HOURS}</p>
              </div>
            </li>
          </ul>

          <div className="mt-6 flex gap-2.5">
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-line text-ink-soft"
              >
                <Icon size={16} />
              </span>
            ))}
          </div>

          {/* Placeholder until a real Google Maps API key is wired in */}
          <div className="mt-8 flex h-48 flex-col items-center justify-center gap-2 rounded-xl border bg-surface text-ink-soft">
            <MapPin size={22} />
            <p className="text-xs">Map integration pending</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              label="Your Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Your name"
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
            />
          </div>
          <FormField
            label="Subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="What's this about?"
          />
          <FormField
            label="Message"
            name="message"
            as="textarea"
            rows={5}
            value={form.message}
            onChange={handleChange}
            error={errors.message}
            placeholder="Write your message here…"
          />

          <Button type="submit" className="self-start">
            Send Message
          </Button>

          {status === "sent" && (
            <p className="rounded border bg-surface px-3.5 py-2.5 text-xs text-support">
              Thanks for reaching out — this form isn't connected to email
              delivery yet, but it's ready for that wiring in a later stage.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
