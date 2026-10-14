
import { useCallback, useEffect, useState } from "react";
import { getAssetStats } from "../services/assetService";
import type { AssetStats } from "../types/asset";

interface UseAssetStatsResult {
  stats: AssetStats | null;
  loading: boolean;
  error: string;
  refreshStats: () => Promise<void>;
}

export default function useAssetStats(): UseAssetStatsResult {
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    try {
      const result = (await getAssetStats()) as AssetStats;
      setStats(result);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load asset statistics.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    setError("");
    await loadStats();
  }, [loadStats]);

  useEffect(() => {
    let cancelled = false;

    const fetchInitialStats = async () => {
      try {
        const result = (await getAssetStats()) as AssetStats;

        if (!cancelled) {
          setStats(result);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load asset statistics.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchInitialStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}
