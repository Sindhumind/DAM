
import pool from "../config/db";
import { redisClient } from "../config/redis";

const ASSET_LIST_CACHE_KEY = "assets:all";
const ASSET_LIST_CACHE_TTL = 60; // seconds

const DASHBOARD_STATS_CACHE_KEY = "dashboard:stats";
const DASHBOARD_STATS_CACHE_TTL = 60; // seconds

export interface CreateAssetData {
  originalFilename: string;
  storedFilename: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: number;
}

const invalidateAssetListCache = async () => {
  try {
    if (redisClient.isReady) {
      await redisClient.del([
        ASSET_LIST_CACHE_KEY,
        DASHBOARD_STATS_CACHE_KEY,
      ]);

      console.log("Asset list and dashboard caches invalidated");
    }
  } catch (error) {
    console.error("Failed to invalidate Redis cache:", error);
  }
};

export const createAsset = async (data: CreateAssetData) => {
  const result = await pool.query(
    `
    INSERT INTO assets (
      original_filename,
      stored_filename,
      storage_key,
      mime_type,
      file_size,
      uploaded_by
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      data.originalFilename,
      data.storedFilename,
      data.storageKey,
      data.mimeType,
      data.fileSize,
      data.uploadedBy ?? null,
    ]
  );

  await invalidateAssetListCache();

  return result.rows[0];
};


export const getAllAssets = async (
  page: number = 1,
  limit: number = 8,
  search: string = "",
  filter: "all" | "image" | "video" = "all"
) => {
  const offset = (page - 1) * limit;
  const searchTerm = `%${search.trim()}%`;

  const result = await pool.query(
    `
    SELECT *
    FROM assets
    WHERE
      original_filename ILIKE $1
      AND (
        $2 = 'all'
        OR ($2 = 'image' AND mime_type LIKE 'image/%')
        OR ($2 = 'video' AND mime_type LIKE 'video/%')
      )
    ORDER BY created_at DESC, id DESC
    LIMIT $3 OFFSET $4
    `,
    [searchTerm, filter, limit, offset]
  );

  const countResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM assets
    WHERE
      original_filename ILIKE $1
      AND (
        $2 = 'all'
        OR ($2 = 'image' AND mime_type LIKE 'image/%')
        OR ($2 = 'video' AND mime_type LIKE 'video/%')
      )
    `,
    [searchTerm, filter]
  );

  const total = countResult.rows[0].total as number;

  return {
    assets: result.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};



export const updateAssetMetadata = async (
  assetId: number,
  metadata: object
) => {
  const result = await pool.query(
    `
    UPDATE assets
    SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
    `,
    [JSON.stringify(metadata), assetId]
  );

  if (result.rows.length > 0) {
    await invalidateAssetListCache();
  }

  return result.rows[0];
};


export const getDashboardStats = async () => {
  // Try Redis first.
  try {
    if (redisClient.isReady) {
      const cachedStats = await redisClient.get(
        DASHBOARD_STATS_CACHE_KEY
      );

      if (cachedStats !== null) {
        console.log("Dashboard stats cache HIT");
        return JSON.parse(cachedStats);
      }
    }
  } catch (error) {
    console.error("Redis dashboard cache read failed:", error);
  }

  console.log("Dashboard stats cache MISS");

  // Calculate statistics using PostgreSQL.
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS "totalAssets",
      COUNT(*) FILTER (
        WHERE mime_type LIKE 'image/%'
      )::int AS "imageCount",
      COUNT(*) FILTER (
        WHERE mime_type LIKE 'video/%'
      )::int AS "videoCount",
      COALESCE(SUM(file_size), 0)::text AS "totalStorageBytes"
    FROM assets
  `);

  const stats = result.rows[0];

  // Cache dashboard statistics for 60 seconds.
  try {
    if (redisClient.isReady) {
      await redisClient.set(
        DASHBOARD_STATS_CACHE_KEY,
        JSON.stringify(stats),
        { EX: DASHBOARD_STATS_CACHE_TTL }
      );
    }
  } catch (error) {
    console.error("Redis dashboard cache write failed:", error);
  }

  return stats;
};

export const deleteAsset = async (assetId: number): Promise<boolean> => {
  const result = await pool.query(
    `
    DELETE FROM assets
    WHERE id = $1
    RETURNING id
    `,
    [assetId]
  );

  if (result.rows.length > 0) {
    await invalidateAssetListCache();
    return true;
  }

  return false;
};


export const getAssetById = async (assetId: number) => {
  const result = await pool.query(
    `SELECT * FROM assets WHERE id = $1`,
    [assetId]
  );

  return result.rows[0] ?? null;
};

