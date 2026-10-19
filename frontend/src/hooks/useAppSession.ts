
import { useCallback, useEffect, useState } from "react";
import { getCurrentUser, logout, type User } from "../services/authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function useAppSession(onAuthenticated: () => void) {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = useCallback(async () => {
    setUser(null);
    setError("");
    localStorage.removeItem("user");
    window.location.hash = "dashboard";

    try {
      await logout();
    } catch (logoutError) {
      console.error("Logout failed:", logoutError);
    }
  }, []);

  const handleLoginSuccess = useCallback(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setError("");

    if (currentUser) onAuthenticated();
  }, [onAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          localStorage.removeItem("user");
          if (!cancelled) setUser(null);
          return;
        }

        const data = await response.json();
        const currentUser = data.user;

        const isValidUser =
          currentUser &&
          typeof currentUser.id === "number" &&
          typeof currentUser.email === "string" &&
          (currentUser.role === "admin" || currentUser.role === "user");

        if (!isValidUser) {
          localStorage.removeItem("user");
          if (!cancelled) setUser(null);
          return;
        }

        localStorage.setItem("user", JSON.stringify(currentUser));

        if (!cancelled) {
          setUser(currentUser as User);
          onAuthenticated();
        }
      } catch (sessionError) {
        console.error("Session verification failed:", sessionError);

        if (!cancelled) {
          setUser(null);
          setError("Unable to verify your session. Please log in again.");
        }
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [onAuthenticated]);

  return {
    user,
    checkingSession,
    error,
    setError,
    handleLogout,
    handleLoginSuccess,
  };
}
