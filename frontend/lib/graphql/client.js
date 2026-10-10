function getGraphqlEndpoint() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const baseUrl = envUrl.replace(/\/api\/?$/, "");

  if (typeof window === "undefined") {
    // SSR / Server Components: use 127.0.0.1 to avoid IPv6 Windows delay
    const internal = (process.env.INTERNAL_API_URL || envUrl).replace("//localhost:", "//127.0.0.1:");
    const internalBase = internal.replace(/\/api\/?$/, "");
    return `${internalBase}/api/graphql`;
  }

  return `${baseUrl}/api/graphql`;
}

/**
 * Lightweight, zero-dependency GraphQL request client.
 * Sends optimized POST requests with HttpOnly cookie credentials and parses errors.
 */
export async function gqlRequest(query, variables = {}, options = {}) {
  const endpoint = getGraphqlEndpoint();

  const config = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    credentials: "include",
    cache: options.cache || "no-store",
    body: JSON.stringify({
      query,
      variables,
      operationName: options.operationName || undefined,
    }),
  };

  try {
    const res = await fetch(endpoint, config);
    const result = await res.json();

    if (result.errors && result.errors.length > 0) {
      const firstError = result.errors[0];
      const err = new Error(firstError.message || "GraphQL execution failed");
      err.errors = result.errors;
      err.data = result.data;
      throw err;
    }

    return result.data;
  } catch (err) {
    console.error("GraphQL Network Error:", err.message);
    throw err;
  }
}
