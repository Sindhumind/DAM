
import { randomUUID } from "node:crypto";
import pool from "../config/db";
import { invalidateAssetListCache } from "./assetRepositoryUtils";

export type AssetProcessingStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

type WorkerResultStatus = "UPLOADED" | "COMPLETED" | "FAILED";

export const updateAssetStatus = async (
  assetId: number,
  status: WorkerResultStatus,
  leaseToken: string,
) => {
  const result = await pool.query(
    `
    UPDATE assets
    SET status = $1,
        processing_lease_token = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
      AND status = 'PROCESSING'
      AND processing_lease_token = $3::uuid
    RETURNING *
    `,
    [status, assetId, leaseToken],
  );

  if (result.rows.length > 0) {
    await invalidateAssetListCache();
  }

  return result.rows[0] ?? null;
};

export const claimAssetForProcessing = async (
  assetId: number,
) => {
  const leaseToken = randomUUID();

  const result = await pool.query(
    `
    UPDATE assets
    SET status = 'PROCESSING',
        processing_lease_token = $2::uuid,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND (
        status = 'UPLOADED'
        OR (
          status = 'PROCESSING'
          AND updated_at < CURRENT_TIMESTAMP - INTERVAL '15 minutes'
        )
      )
    RETURNING id, processing_lease_token
    `,
    [assetId, leaseToken],
  );

  if (result.rows.length > 0) {
    await invalidateAssetListCache();

    return {
      id: result.rows[0].id,
      leaseToken: result.rows[0].processing_lease_token,
    };
  }

  return null;
};

export const renewAssetProcessingLease = async (
  assetId: number,
  leaseToken: string,
): Promise<boolean> => {
  const result = await pool.query(
    `
    UPDATE assets
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status = 'PROCESSING'
      AND processing_lease_token = $2::uuid
    RETURNING id
    `,
    [assetId, leaseToken],
  );

  return result.rows.length > 0;
};

export const resetFailedAssetForRetry = async (
  assetId: number,
) => {
  const result = await pool.query(
    `
    UPDATE assets
    SET status = 'UPLOADED',
        processing_lease_token = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status = 'FAILED'
    RETURNING id, storage_key, mime_type
    `,
    [assetId],
  );

  if (result.rows.length > 0) {
    await invalidateAssetListCache();
  }

  return result.rows[0] ?? null;
};

export const restoreFailedAssetAfterRetryError = async (
  assetId: number,
) => {
  const result = await pool.query(
    `
    UPDATE assets
    SET status = 'FAILED',
        processing_lease_token = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status = 'UPLOADED'
    RETURNING id
    `,
    [assetId],
  );

  if (result.rows.length > 0) {
    await invalidateAssetListCache();
  }

  return result.rows[0] ?? null;
};