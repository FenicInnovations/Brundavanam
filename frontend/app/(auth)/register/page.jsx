import PhoneAuthFlow from "@/components/auth/PhoneAuthFlow";

// No separate registration flow — mobile OTP verification automatically
// creates the account if the number is new. Kept as its own route so
// existing links to /register still work.
export default function RegisterPage() {
  return <PhoneAuthFlow />;
}