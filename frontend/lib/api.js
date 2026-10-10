function getApiUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  if (typeof window === "undefined") {
    return (process.env.INTERNAL_API_URL || envUrl).replace("//localhost:", "//127.0.0.1:");
  }
  return envUrl;
}

function getAuthHeaders() {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request(path, options = {}) {
  const baseUrl = getApiUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    credentials: "include", // sends/receives the HttpOnly accessToken cookie when supported
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    cache: options.cache || "no-store",
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
  getAddresses: () => request("/auth/addresses"),
  addAddress: (data) => request("/auth/addresses", { method: "POST", body: JSON.stringify(data) }),
  updateAddress: (id, data) => request(`/auth/addresses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAddress: (id) => request(`/auth/addresses/${id}`, { method: "DELETE" }),
  setDefaultAddress: (id) => request(`/auth/addresses/${id}/default`, { method: "PATCH" }),
};

const axiosLikeRequest = async (path, options = {}) => {
  try {
    const data = await request(path, options);
    return { data };
  } catch (err) {
    const axiosErr = new Error(err.message);
    axiosErr.response = { data: { message: err.message } };
    throw axiosErr;
  }
};

const defaultApi = {
  get: (path) => axiosLikeRequest(path, { method: "GET" }),
  post: (path, body) => axiosLikeRequest(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => axiosLikeRequest(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) => axiosLikeRequest(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => axiosLikeRequest(path, { method: "DELETE" }),
};

export default defaultApi;