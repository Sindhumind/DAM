import pool from "../config/db";
import { invalidateAssetListCache } from "./assetRepositoryUtils";

export type AssetProcessingStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

/**
 * Internal processing status update.
 * Protect the route that exposes this function with worker authentication.
 */
export const updateAssetStatus = async (
  assetId: number,
  status: AssetProcessingStatus,
) => {
  const result = await pool.query(
    `
    UPDATE assets
    SET status = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
    `,
    [status, assetId],
  );

  if (result.rows.length > 0) {
    await invalidateAssetListCache();
  }

  return result.rows[0] ?? null;
};

/**
 * Atomically claims an uploaded asset for background processing.
 * Protect the route that exposes this function with worker authentication.
 */
export const claimAssetForProcessing = async (
  assetId: number,
) => {
  const result = await pool.query(
    `
    UPDATE assets
    SET status = 'PROCESSING',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status = 'UPLOADED'
    RETURNING id
    `,
    [assetId],
  );

  if (result.rows.length > 0) {
    await invalidateAssetListCache();
    return true;
  }

  return false;
};