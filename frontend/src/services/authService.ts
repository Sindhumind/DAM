
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type User = {
  id: number;
  email: string;
  role: "admin" | "user";
};

type LoginResponse = {
  message: string;
  user: User;
};

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed.");
  }

  if (!data.user) {
    throw new Error("Invalid login response from server.");
  }

  // Store only non-secret user information.
  // The JWT is managed by the browser's HttpOnly cookie.
  localStorage.removeItem("token");
  localStorage.setItem("user", JSON.stringify(data.user));

  return data as LoginResponse;
}

export function getToken(): null {
  // HttpOnly cookies cannot and should not be read by JavaScript.
  return null;
}

export function getCurrentUser(): User | null {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    const user: unknown = JSON.parse(storedUser);

    if (
      typeof user !== "object" ||
      user === null ||
      !("id" in user) ||
      !("email" in user) ||
      !("role" in user) ||
      typeof user.id !== "number" ||
      typeof user.email !== "string" ||
      (user.role !== "admin" && user.role !== "user")
    ) {
      return null;
    }

    return user as User;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout request failed.");
    }
  } finally {
    // Clear local UI state even if the request fails.
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

export function getAuthHeaders(): Record<string, string> {
  // Authentication is sent automatically through the HttpOnly cookie.
  return {};
}
