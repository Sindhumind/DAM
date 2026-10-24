
import sharp from "sharp";
import path from "node:path";
import { promises as fs } from "node:fs";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { minioClient, bucketName } from "../minio";
import { saveMetadata } from "./metadataService";
import {
  createTempFilePath,
  removeTempFile,
} from "../utils/tempFileUtils";
import type { AssetJob } from "./assetProcessor";

export async function processImage(
  job: AssetJob,
  leaseToken: string,
): Promise<void> {
  const originalPath = createTempFilePath(
    path.extname(job.storageKey) || ".img"
  );
  const thumbnailPath = createTempFilePath(".jpg");

  try {
    const stream = await minioClient.getObject(
      bucketName,
      job.storageKey
    );

    await pipeline(
      stream,
      createWriteStream(originalPath)
    );

    const image = sharp(originalPath);
    const imageInfo = await image.metadata();

    await sharp(originalPath)
      .rotate()
      .resize({
        width: 400,
        height: 400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    const thumbnailKey = `thumbnails/thumb-${job.assetId}.jpg`;

    await minioClient.fPutObject(
      bucketName,
      thumbnailKey,
      thumbnailPath,
      { "Content-Type": "image/jpeg" }
    );

    await saveMetadata(
      job.assetId,
      {
        width: imageInfo.width ?? null,
        height: imageInfo.height ?? null,
        format: imageInfo.format ?? null,
        thumbnailKey,
        processed: true,
      },
      leaseToken,
    );

    console.log(`Image asset ${job.assetId} processed`);
  } finally {
    await Promise.all([
      removeTempFile(originalPath),
      removeTempFile(thumbnailPath),
    ]);
  }
}