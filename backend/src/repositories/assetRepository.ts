import pool from "../config/db";

export interface CreateAssetData {
  originalFilename: string;
  storedFilename: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: number;
}

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

  return result.rows[0];
};

export const getAllAssets = async () => {
  const result = await pool.query(
    `
    SELECT *
    FROM assets
    ORDER BY created_at DESC
    `
  );

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

  return result.rows[0];
};