import { ApiError } from "./api-error";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiClient(path, options = {}) {
  const { params, body, headers, ...init } = options;

  const url = new URL(`${API_URL}${path}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  const isFormData = body instanceof FormData;

  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData
        ? {}
        : body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      ...headers,
    },
    body:
      body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new ApiError(
      response.status,
      error?.message ?? "Request failed",
      error,
    );
  }

  if (response.status === 204) {
    return undefined;
  }

  return response.json();
}
