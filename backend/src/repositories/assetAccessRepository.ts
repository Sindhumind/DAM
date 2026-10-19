import pool from "../config/db";
import { validateAccess, type AssetAccess } from "./assetRepositoryUtils";

/**
 * Owner/admin-only lookup for operations that require ownership.
 */
export const getAssetByIdForAccess = async (
  assetId: number,
  access: AssetAccess,
) => {
  validateAccess(access);

  const isAdmin = access.role === "admin";

  const result = await pool.query(
    `
    SELECT *
    FROM assets
    WHERE id = $1
      AND ($2::boolean = TRUE OR uploaded_by = $3)
    LIMIT 1
    `,
    [assetId, isAdmin, access.userId],
  );

  return result.rows[0] ?? null;
};

/**
 * Unrestricted-by-owner lookup for internal processing only.
 * Do not use this directly in user-facing endpoints.
 */
export const getAssetById = async (assetId: number) => {
  const result = await pool.query(
    `
    SELECT *
    FROM assets
    WHERE id = $1
    LIMIT 1
    `,
    [assetId],
  );

  return result.rows[0] ?? null;
};