import { redisClient } from "../config/redis";

const ASSET_LIST_VERSION_KEY = "assets:list:version";
const DASHBOARD_STATS_CACHE_KEY = "dashboard:stats";

export interface AssetAccess {
  userId: number;
  role: "admin" | "user";
}

export const getAssetListCacheVersion = async (): Promise<string> => {
  try {
    if (redisClient.isReady) {
      const version = await redisClient.get(ASSET_LIST_VERSION_KEY);
      return version || "1";
    }
  } catch (error) {
    console.error("Failed to read asset list cache version:", error);
  }
  return "1";
};

export const invalidateAssetListCache = async (): Promise<void> => {
  try {
    if (redisClient.isReady) {
      // Incrementing the version key invalidates all paginated/filtered list keys atomically
      await Promise.all([
        redisClient.incr(ASSET_LIST_VERSION_KEY),
        redisClient.del(DASHBOARD_STATS_CACHE_KEY),
      ]);

      console.log("Asset list version incremented and dashboard cache invalidated");
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
