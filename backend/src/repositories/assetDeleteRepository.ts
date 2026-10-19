import pool from "../config/db";
import {
  invalidateAssetListCache,
  validateAccess,
  type AssetAccess,
} from "./assetRepositoryUtils";

/**
 * Users can delete their own assets.
 * Admins can delete any asset.
 */
export const deleteAsset = async (
  assetId: number,
  access: AssetAccess,
): Promise<boolean> => {
  validateAccess(access);

  const isAdmin = access.role === "admin";

  const result = await pool.query(
    `
    DELETE FROM assets
    WHERE id = $1
      AND ($2::boolean = TRUE OR uploaded_by = $3)
    RETURNING id
    `,
    [assetId, isAdmin, access.userId],
  );

  if (result.rows.length > 0) {
    await invalidateAssetListCache();
    return true;
  }

  return false;
};