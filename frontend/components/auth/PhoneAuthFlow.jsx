"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SITE_NAME } from "@/lib/constants";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Button from "@/components/ui/Button";

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const RESEND_COOLDOWN = 60;

export default function PhoneAuthFlow() {
  const router = useRouter();
  const { user, status, refresh } = useAuth();

  const [step, setStep] = useState("phone"); // phone | otp
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef([]);

  // Authenticated users cannot navigate to login or register page
  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace("/account");
    }
  }, [status, user, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError("");

    if (!INDIAN_MOBILE_REGEX.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    try {
      await api.sendOtp(phone);
      setStep("otp");
      setOtpDigits(Array(6).fill(""));
      setCooldown(RESEND_COOLDOWN);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      if (err.statusCode === 429) {
        setError(err.message);
        setCooldown(err.retryAfterSeconds || RESEND_COOLDOWN);
        setStep("otp"); // an already-sent OTP may still be valid
      } else {
        setError(err.message || "Couldn't send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    setOtpDigits((digits) => {
      const next = [...digits];
      next[index] = value;
      return next;
    });
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setError("Enter the full 6-digit code.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.verifyOtp(phone, otp);
      await refresh();
      router.push("/");
    } catch (err) {
      setError(err.message || "Couldn't verify OTP. Please try again.");
      if (err.statusCode === 429) {
        // OTP was invalidated server-side — start over.
        setStep("phone");
        setOtpDigits(Array(6).fill(""));
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && user)) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center justify-center px-6 py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-xs font-medium text-ink-soft">
          {status === "authenticated" ? "Already logged in. Redirecting to your account..." : "Checking authentication..."}
        </p>
      </div>
    );
  }

  if (step === "phone") {
    return (
      <div className="mx-auto flex max-w-sm flex-col px-6 py-14 text-center md:py-20">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white p-1.5 shadow-md ring-2 ring-amber-300">
          <Image
            src="/images/logo.png"
            alt="Brundavanam Goshala Logo"
            width={72}
            height={72}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        <p className="font-display text-2xl text-ink">{SITE_NAME}</p>
        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
          Ahar.am • Arogy.am • Soundary.am
        </p>
        <h1 className="mt-2 text-base font-medium text-ink">Log In / Create Account</h1>

        <form onSubmit={handleSendOtp} className="mt-8 flex flex-col gap-4 text-left">
          <div>
            <label htmlFor="phone" className="text-sm font-medium text-ink">
              Mobile Number
            </label>
            <div className="mt-1.5 flex items-center rounded border focus-within:border-accent">
              <span className="border-r px-3 py-2.5 text-sm text-ink-soft">+91</span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                autoComplete="tel-national"
                className="w-full flex-1 rounded-r px-3.5 py-2.5 text-sm text-ink outline-none"
              />
            </div>
          </div>

          {error && <p className="text-xs text-accent-deep">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send OTP"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col px-6 py-14 text-center md:py-20">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white p-1.5 shadow-md ring-2 ring-amber-300">
        <Image
          src="/images/logo.png"
          alt="Brundavanam Goshala Logo"
          width={72}
          height={72}
          className="h-full w-full object-contain"
          priority
        />
      </div>
      <p className="font-display text-2xl text-ink">{SITE_NAME}</p>
      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
        Ahar.am • Arogy.am • Soundary.am
      </p>
      <h1 className="mt-2 text-base font-medium text-ink">Enter OTP</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Sent to +91 {phone}.{" "}
        <button
          type="button"
          onClick={() => setStep("phone")}
          className="font-medium text-accent-deep hover:underline"
        >
          Change number
        </button>
      </p>

      <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-5">
        <div className="flex justify-center gap-2">
          {otpDigits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (otpRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleDigitKeyDown(i, e)}
              className="h-12 w-10 rounded border text-center text-lg font-medium text-ink outline-none focus:border-accent"
            />
          ))}
        </div>

        {error && <p className="text-xs text-accent-deep">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Verifying…" : "Verify OTP"}
        </Button>

        <p className="text-sm text-ink-soft">
          {cooldown > 0 ? (
            `Resend OTP in ${cooldown}s`
          ) : (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="font-medium text-accent-deep hover:underline"
            >
              Resend OTP
            </button>
          )}
        </p>
      </form>
    </div>
  );
}