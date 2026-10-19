
import { logout } from "./authService";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const REQUEST_OPTIONS = {
  credentials: "include" as const,
};

export async function handleResponse<T>(
  response: Response,
): Promise<T> {
  if (response.status === 401) {
    void logout().catch(() => {
      // Local session data is cleared by logout even if the request fails.
    });

    window.location.reload();

    throw new Error(
      "Your session has expired. Please sign in again.",
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;

    try {
      const contentType =
        response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const result = await response.json();
        message = result.message || message;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "The server returned an unexpected response.",
    );
  }

  return (await response.json()) as T;
}
