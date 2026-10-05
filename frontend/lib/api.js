const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include", // sends/receives the HttpOnly accessToken cookie
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`);
    err.statusCode = res.status;
    err.retryAfterSeconds = data?.retryAfterSeconds;
    throw err;
  }

  return data;
}

export const api = {
  sendOtp: (phone) => request("/auth/send-otp", { method: "POST", body: JSON.stringify({ phone }) }),
  verifyOtp: (phone, otp) =>
    request("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, otp }) }),
  getMe: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
};