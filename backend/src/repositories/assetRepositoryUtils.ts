import { redisClient } from "../config/redis";

const ASSET_LIST_CACHE_KEY = "assets:all";
const DASHBOARD_STATS_CACHE_KEY = "dashboard:stats";

export interface AssetAccess {
  userId: number;
  role: "admin" | "user";
}

export const invalidateAssetListCache = async (): Promise<void> => {
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

export const validateAccess = (access: AssetAccess): void => {
  if (
    !access ||
    !Number.isSafeInteger(access.userId) ||
    access.userId <= 0 ||
    (access.role !== "admin" && access.role !== "user")
  ) {
    throw new Error("Authenticated asset access is required");
  }
};

export { DASHBOARD_STATS_CACHE_KEY };