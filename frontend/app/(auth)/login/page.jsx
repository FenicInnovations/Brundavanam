"use client";

import { useState } from "react";
import Link from "next/link";
import FormField from "@/components/forms/FormField";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | pending-backend

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // No auth backend yet — this intentionally doesn't fake a successful
    // login. Swaps for a real POST /api/auth/login once the backend
    // stage is built.
    setStatus("submitting");
    setTimeout(() => setStatus("pending-backend"), 500);
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-14 md:py-20">
      <h1 className="font-display text-2xl text-ink">Log In</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Welcome back to Brundavanam Goshala.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
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
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-accent-deep hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={status === "submitting"}>
          {status === "submitting" ? "Logging in…" : "Log In"}
        </Button>

        {status === "pending-backend" && (
          <p className="rounded border bg-surface px-3.5 py-2.5 text-xs text-ink-soft">
            Account sign-in isn't connected to a backend yet — this page is
            ready for that wiring in a later stage.
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href="/register" className="font-medium text-accent-deep hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
