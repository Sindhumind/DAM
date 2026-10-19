
import { useCallback, useRef, useState } from "react";

export type DashboardStats = {
  totalAssets: number;
  imageCount: number;
  videoCount: number;
  totalStorageBytes: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const logoutRef = useRef<(() => void) | null>(null);

  const setUnauthorizedHandler = useCallback(
    (handler: () => void) => {
      logoutRef.current = handler;
    },
    []
  );

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/stats`, {
        credentials: "include",
      });

      if (response.status === 401) {
        logoutRef.current?.();
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load dashboard statistics (${response.status}).`);
      }

      setStats(await response.json());
    } catch (statsError) {
      console.error("Failed to load dashboard statistics:", statsError);
      setError("Unable to load dashboard statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    loadStats,
    setUnauthorizedHandler,
  };
}
