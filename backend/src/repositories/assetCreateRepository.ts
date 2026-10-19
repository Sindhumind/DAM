import pool from "../config/db";
import { invalidateAssetListCache } from "./assetRepositoryUtils";

export interface CreateAssetData {
  originalFilename: string;
  storedFilename: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Creates an asset and saves its initial metadata.
 */
export const createAsset = async (data: CreateAssetData) => {
  const result = await pool.query(
    `
    INSERT INTO assets (
      original_filename,
      stored_filename,
      storage_key,
      mime_type,
      file_size,
      uploaded_by,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    RETURNING *
    `,
    [
      data.originalFilename,
      data.storedFilename,
      data.storageKey,
      data.mimeType,
      data.fileSize,
      data.uploadedBy ?? null,
      JSON.stringify(data.metadata ?? {}),
    ],
  );

  await invalidateAssetListCache();

  return result.rows[0];
};