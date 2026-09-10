"use client";

import { useState } from "react";
import Link from "next/link";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (!form.password) next.password = "Password is required.";
    else if (form.password.length < 8) next.password = "Use at least 8 characters.";
    if (form.confirmPassword !== form.password)
      next.confirmPassword = "Passwords don't match.";
    if (!agreed) next.agreed = "Please accept the Terms & Privacy Policy.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // No auth backend yet — intentionally not faking a successful
    // registration. Swaps for a real POST /api/auth/register later.
    setStatus("submitting");
    setTimeout(() => setStatus("pending-backend"), 500);
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-14 md:py-20">
      <h1 className="font-display text-2xl text-ink">Create an Account</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Join Brundavanam Goshala for faster checkout and order tracking.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
        <FormField
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Your name"
          autoComplete="name"
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <FormField
          label="Phone Number"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="10-digit mobile number"
          autoComplete="tel"
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <FormField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />

        <div>
          <label className="flex items-start gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-sm accent-accent"
            />
            I agree to the{" "}
            <Link href="/policies/terms" className="text-accent-deep hover:underline">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href="/policies/privacy" className="text-accent-deep hover:underline">
              Privacy Policy
            </Link>
            .
          </label>
          {errors.agreed && (
            <p className="mt-1.5 text-xs text-accent-deep">{errors.agreed}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={status === "submitting"}>
          {status === "submitting" ? "Creating account…" : "Create Account"}
        </Button>

        {status === "pending-backend" && (
          <p className="rounded border bg-surface px-3.5 py-2.5 text-xs text-ink-soft">
            Account creation isn't connected to a backend yet — this page is
            ready for that wiring in a later stage.
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent-deep hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
