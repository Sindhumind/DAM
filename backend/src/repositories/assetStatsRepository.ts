import pool from "../config/db";
import { redisClient } from "../config/redis";
import {
  DASHBOARD_STATS_CACHE_KEY,
  validateAccess,
  type AssetAccess,
} from "./assetRepositoryUtils";

const DASHBOARD_STATS_CACHE_TTL = 60;

/**
 * All authenticated users see global dashboard statistics.
 */
export const getDashboardStats = async (access?: AssetAccess) => {
  if (!access) {
    throw new Error("Authenticated asset access is required");
  }

  validateAccess(access);

  try {
    if (redisClient.isReady) {
      const cachedStats = await redisClient.get(
        DASHBOARD_STATS_CACHE_KEY,
      );

      if (cachedStats !== null) {
        console.log("Dashboard stats cache HIT");
        return JSON.parse(cachedStats);
      }
    }
  } catch (error) {
    console.error("Redis dashboard cache read failed:", error);
  }

  const result = await pool.query(
    `
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
    `,
  );

  const stats = result.rows[0];

  try {
    if (redisClient.isReady) {
      await redisClient.set(
        DASHBOARD_STATS_CACHE_KEY,
        JSON.stringify(stats),
        { EX: DASHBOARD_STATS_CACHE_TTL },
      );
    }
  } catch (error) {
    console.error("Redis dashboard cache write failed:", error);
  }

  return stats;
};