import pool from "../config/db";
import { validateAccess, type AssetAccess } from "./assetRepositoryUtils";

/**
 * Returns paginated assets with filename search and media-type filtering.
 * All authenticated users can view all assets.
 */
export const getAllAssets = async (
  page: number = 1,
  limit: number = 8,
  search: string = "",
  filter: "all" | "image" | "video" = "all",
  access?: AssetAccess,
) => {
  if (!access) {
    throw new Error("Authenticated asset access is required");
  }

  validateAccess(access);

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1
  ) {
    throw new Error("Invalid pagination parameters");
  }

  const offset = (page - 1) * limit;
  const searchTerm = `%${search.trim()}%`;

  const result = await pool.query(
    `
    SELECT *
    FROM assets
    WHERE
      (
        COALESCE(NULLIF(metadata->>'title', ''), original_filename)
          ILIKE $1
        OR original_filename ILIKE $1
      )
      AND (
        $2 = 'all'
        OR ($2 = 'image' AND mime_type LIKE 'image/%')
        OR ($2 = 'video' AND mime_type LIKE 'video/%')
      )
    ORDER BY created_at DESC, id DESC
    LIMIT $3 OFFSET $4
    `,
    [searchTerm, filter, limit, offset],
  );

  const countResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM assets
    WHERE
      (
        COALESCE(NULLIF(metadata->>'title', ''), original_filename)
          ILIKE $1
        OR original_filename ILIKE $1
      )
      AND (
        $2 = 'all'
        OR ($2 = 'image' AND mime_type LIKE 'image/%')
        OR ($2 = 'video' AND mime_type LIKE 'video/%')
      )
    `,
    [searchTerm, filter],
  );

  const total = Number(countResult.rows[0].total);

  return {
    assets: result.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};