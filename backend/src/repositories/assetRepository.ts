
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

export const getAllAssets = async () => {
  // Try Redis first.
  try {
    if (redisClient.isReady) {
      const cachedAssets = await redisClient.get(
        ASSET_LIST_CACHE_KEY
      );

      if (cachedAssets !== null) {
        console.log("Asset list cache HIT");
        return JSON.parse(cachedAssets);
      }
    }
  } catch (error) {
    console.error("Redis asset-list cache read failed:", error);
  }

  console.log("Asset list cache MISS");

  // PostgreSQL remains the source of truth.
  const result = await pool.query(
    `
    SELECT *
    FROM assets
    ORDER BY created_at DESC
    `
  );

  // Cache the result for 60 seconds.
  try {
    if (redisClient.isReady) {
      await redisClient.set(
        ASSET_LIST_CACHE_KEY,
        JSON.stringify(result.rows),
        { EX: ASSET_LIST_CACHE_TTL }
      );
    }
  } catch (error) {
    console.error("Redis asset-list cache write failed:", error);
  }

  return result.rows;
};

export const updateAssetMetadata = async (
  assetId: number,
  metadata: object
) => {
  const result = await pool.query(
    `
    UPDATE assets
    SET metadata = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
    `,
    [metadata, assetId]
  );

  // Invalidate caches only if an asset was updated.
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
