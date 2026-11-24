import pool from "../config/db";
import { redisClient } from "../config/redis";
import {
  getAssetListCacheVersion,
  validateAccess,
  type AssetAccess,
} from "./assetRepositoryUtils";

const ASSET_LIST_TTL_SECONDS = 30;

export const getAllAssets = async (
  page: number = 1,
  limit: number = 8,
  search: string = "",
  filter: "all" | "image" | "video" = "all",
  access?: AssetAccess,
) => {
  if (!access) {
    throw new Error("Authenticated asset access is required");
  }

  validateAccess(access);

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1
  ) {
    throw new Error("Invalid pagination parameters");
  }

  const trimmedSearch = search.trim();
  const version = await getAssetListCacheVersion();
  const cacheKey = `assets:list:v${version}:p${page}:l${limit}:f${filter}:s${encodeURIComponent(trimmedSearch.toLowerCase())}`;

  // 1. Return cached paginated response if available
  try {
    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error("Asset list Redis read failed:", error);
  }

  const offset = (page - 1) * limit;
  const hasSearch = trimmedSearch.length > 0;
  const searchTerm = `%${trimmedSearch}%`;

  // 2. Single query with COUNT(*) OVER() window function
  const result = await pool.query(
    `
    SELECT
      *,
      COUNT(*) OVER()::int AS total_count
    FROM assets
    WHERE
      (
        $1::boolean = false
        OR metadata->>'title' ILIKE $2
        OR original_filename ILIKE $2
      )
      AND (
        $3 = 'all'
        OR ($3 = 'image' AND mime_type LIKE 'image/%')
        OR ($3 = 'video' AND mime_type LIKE 'video/%')
      )
    ORDER BY created_at DESC, id DESC
    LIMIT $4 OFFSET $5
    `,
    [hasSearch, searchTerm, filter, limit, offset],
  );

  const total =
    result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;

  const assets = result.rows.map(({ total_count: _totalCount, ...asset }) => asset);

  const response = {
    assets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  // 3. Store result in Redis with short TTL
  try {
    if (redisClient.isReady) {
      await redisClient.set(cacheKey, JSON.stringify(response), {
        EX: ASSET_LIST_TTL_SECONDS,
      });
    }
  } catch (error) {
    console.error("Asset list Redis write failed:", error);
  }

  return response;
};