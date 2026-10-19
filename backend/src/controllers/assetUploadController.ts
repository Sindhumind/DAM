import type { Response } from "express";
import { saveFile } from "../services/storageService";
import minioClient, { bucketName } from "../config/minio";
import { createAssetService } from "../services/assetService";
import { publishAssetProcessingJob } from "../services/queueService";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";

type UploadMetadata = {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
};

const ALLOWED_METADATA_FIELDS = new Set([
  "title",
  "description",
  "category",
  "tags",
]);

const parseUploadMetadata = (
  rawMetadata: unknown,
): Record<string, unknown> => {
  if (rawMetadata === undefined || rawMetadata === null || rawMetadata === "") {
    return {};
  }

  let parsed: unknown;

  if (typeof rawMetadata === "string") {
    try {
      parsed = JSON.parse(rawMetadata);
    } catch {
      throw new Error("Invalid metadata JSON.");
    }
  } else {
    parsed = rawMetadata;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error("Metadata must be a JSON object.");
  }

  const metadata = parsed as Record<string, unknown>;
  const entries = Object.entries(metadata);

  if (entries.length === 0) {
    throw new Error("At least one metadata field is required.");
  }

  for (const [key, value] of entries) {
    if (!ALLOWED_METADATA_FIELDS.has(key)) {
      throw new Error(`Metadata field '${key}' is not allowed.`);
    }

    if (key === "tags") {
      if (
        !Array.isArray(value) ||
        value.length > 20 ||
        !value.every(
          (tag) =>
            typeof tag === "string" &&
            tag.trim().length > 0 &&
            tag.trim().length <= 50,
        )
      ) {
        throw new Error(
          "Tags must be an array of up to 20 non-empty strings, each no longer than 50 characters.",
        );
      }

      continue;
    }

    const maxLength = key === "description" ? 2000 : 150;

    if (typeof value !== "string" || value.length > maxLength) {
      throw new Error(`Invalid value for metadata field '${key}'.`);
    }
  }

  return metadata;
};

const isMetadataValidationError = (error: unknown): error is Error => {
  if (!(error instanceof Error)) {
    return false;
  }

  return [
    "Invalid metadata JSON.",
    "Metadata must be a JSON object.",
    "At least one metadata field is required.",
    "is not allowed.",
    "Tags must be an array",
    "Invalid value for metadata field",
  ].some((message) => error.message.includes(message));
};

export const uploadAsset = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const assets = [];

  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded",
      });
    }

    let metadata: Record<string, unknown>;

    try {
      metadata = parseUploadMetadata(req.body?.metadata);
    } catch (error) {
      if (isMetadataValidationError(error)) {
        return res.status(400).json({
          message: error.message,
        });
      }

      throw error;
    }

    for (const file of files) {
      const storageResult = await saveFile(file);

      let asset;

      try {
        asset = await createAssetService({
          originalFilename: file.originalname,
          storedFilename: storageResult.storedFilename,
          storageKey: storageResult.storageKey,
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedBy: req.user.id,
          metadata: { ...metadata } as UploadMetadata,
        });
      } catch (databaseError) {
        try {
          await minioClient.removeObject(
            bucketName,
            storageResult.storageKey,
          );
        } catch (cleanupError) {
          console.error("Failed to clean up MinIO object:", cleanupError);
        }

        throw databaseError;
      }

      await publishAssetProcessingJob({
        id: asset.id,
        storageKey: asset.storage_key,
        mimeType: asset.mime_type,
      });

      assets.push(asset);
    }

    return res.status(201).json({
      message: "Files uploaded successfully",
      count: assets.length,
      assets,
    });
  } catch (error) {
    console.error("Upload assets error:", error);

    return res.status(500).json({
      message: "Failed to upload files",
    });
  }
};