function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  if (typeof window === "undefined") {
    // In server environment (SSR / Server Components):
    // Use 127.0.0.1 instead of localhost to prevent IPv6 (::1) ECONNREFUSED issues on Windows
    return (process.env.INTERNAL_API_URL || envUrl).replace("//localhost:", "//127.0.0.1:");
  }
  return envUrl;
}

/**
 * Custom fetch wrapper with credentials and error parsing
 */
async function request(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include", // Send HttpOnly cookie
    cache: options.cache || "no-store",
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const apiClient = {
  get: (endpoint, params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request(url, { method: "GET" });
  },
  post: (endpoint, body) => request(endpoint, { method: "POST", body }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body }),
  patch: (endpoint, body) => request(endpoint, { method: "PATCH", body }),
  delete: (endpoint, params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request(url, { method: "DELETE" });
  },
};
