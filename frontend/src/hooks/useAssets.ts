import { useCallback, useEffect, useState } from "react";
import { getAssets } from "../services/assetService";
import type { Asset, AssetFilter } from "../types/asset";

const DEFAULT_PAGE_SIZE = 8;

interface UseAssetsResult {
  assets: Asset[];
  loading: boolean;
  error: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search: string;
  filter: AssetFilter;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setFilter: (filter: AssetFilter) => void;
  refreshAssets: () => Promise<void>;
}

export default function useAssets(): UseAssetsResult {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setCurrentPage] = useState(1);
  const [limit, setLimitValue] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearchValue] = useState("");
  const [filter, setFilterValue] = useState<AssetFilter>("all");
  const [reloadKey, setReloadKey] = useState(0);

  const setPage = useCallback((nextPage: number) => {
    setCurrentPage(Math.max(1, nextPage));
  }, []);

  const setLimit = useCallback((nextLimit: number) => {
    setLimitValue(Math.max(1, nextLimit));
    setCurrentPage(1);
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const setFilter = useCallback((value: AssetFilter) => {
    setFilterValue(value);
    setCurrentPage(1);
  }, []);

  const refreshAssets = useCallback(async () => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      setLoading(true);
      setError("");

      try {
        const result = await getAssets({
          page,
          limit,
          search,
          filter,
        });

        if (!cancelled) {
          setAssets(result.assets);
          setTotal(result.total);
          setTotalPages(result.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load assets.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, [page, limit, search, filter, reloadKey]);

  return {
    assets,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    search,
    filter,
    setPage,
    setLimit,
    setSearch,
    setFilter,
    refreshAssets,
  };
}