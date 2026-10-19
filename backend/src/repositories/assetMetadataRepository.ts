import pool from "../config/db";
import {
  invalidateAssetListCache,
  validateAccess,
  type AssetAccess,
} from "./assetRepositoryUtils";

/**
 * Users can update metadata on their own assets.
 * Admins can update metadata on any asset.
 */
export const updateAssetMetadata = async (
  assetId: number,
  metadata: object,
  access: AssetAccess,
) => {
  validateAccess(access);

  const isAdmin = access.role === "admin";

  const result = await pool.query(
    `
    UPDATE assets
    SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
      AND ($3::boolean = TRUE OR uploaded_by = $4)
    RETURNING *
    `,
    [
      JSON.stringify(metadata),
      assetId,
      isAdmin,
      access.userId,
    ],
  );

  if (result.rows.length > 0) {
    await invalidateAssetListCache();
  }

  return result.rows[0] ?? null;
};