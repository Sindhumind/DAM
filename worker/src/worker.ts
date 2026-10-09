
import amqp from "amqplib";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

import minioClient, { bucketName } from "./minio";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;

if (!RABBITMQ_URL) {
  throw new Error("Missing required environment variable: RABBITMQ_URL");
}

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:3000";

const QUEUE_NAME = "asset-processing";

const startWorker = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    channel.prefetch(1);

    console.log("Worker connected to RabbitMQ");
    console.log(`Waiting for jobs on: ${QUEUE_NAME}`);
    console.log(`MinIO bucket: ${bucketName}`);

    channel.consume(QUEUE_NAME, async (message) => {
      if (!message) return;

      let tempDirectory: string | undefined;

      try {
        const job = JSON.parse(message.content.toString());

        // Support either property name for the asset ID.
        const assetId = job.assetId ?? job.id;

        if (!assetId || !job.storageKey || !job.mimeType) {
          throw new Error("Invalid asset-processing job");
        }

        console.log("Processing asset:", job);

        if (job.mimeType.startsWith("image/")) {
          tempDirectory = path.join(
            os.tmpdir(),
            `dam-${randomUUID()}`
          );

          await fs.mkdir(tempDirectory, { recursive: true });

          const originalPath = path.join(
            tempDirectory,
            "original"
          );

          const thumbnailPath = path.join(
            tempDirectory,
            "thumbnail.jpg"
          );

          // 1. Download the original image from MinIO.
          await minioClient.fGetObject(
            bucketName,
            job.storageKey,
            originalPath
          );

          console.log("Original downloaded from MinIO");

          // 2. Extract image metadata.
          const metadata = await sharp(originalPath).metadata();

          const assetMetadata = {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            channels: metadata.channels,
            space: metadata.space,
          };

          // 3. Generate a thumbnail locally in a temp directory.
          await sharp(originalPath)
            .resize(300, 300, { fit: "cover" })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

          // 4. Upload the thumbnail to MinIO.
          const thumbnailKey = `thumbnails/thumb-${assetId}.jpg`;

          const thumbnailResult = await minioClient.fPutObject(
            bucketName,
            thumbnailKey,
            thumbnailPath,
            { "Content-Type": "image/jpeg" }
          );

          console.log("Thumbnail uploaded to MinIO:", {
            bucket: bucketName,
            key: thumbnailKey,
            etag: thumbnailResult.etag,
          });

          // 5. Save metadata and thumbnail details through the API.
          const response = await fetch(
            `${BACKEND_URL}/api/assets/${assetId}/metadata`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                metadata: {
                  ...assetMetadata,
                  thumbnailKey,
                  thumbnailBucket: bucketName,
                },
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
              `Failed to save metadata: ${response.status} ${errorText}`
            );
          }

          console.log(`Metadata saved for asset ${assetId}`);
        } else {
          console.log(
            `Skipping image processing for ${job.mimeType}`
          );
        }

        // Acknowledge only after successful processing.
        channel.ack(message);

        console.log(`Asset ${assetId} processing completed`);
      } catch (error) {
        console.error("Worker processing error:", error);

        // Preserve the existing behavior: discard failed jobs.
        channel.nack(message, false, false);
      } finally {
        // Remove temporary files, even when processing fails.
        if (tempDirectory) {
          await fs.rm(tempDirectory, {
            recursive: true,
            force: true,
          }).catch((error) => {
            console.error("Temporary-file cleanup failed:", error);
          });
        }
      }
    });
  } catch (error) {
    console.error("Worker failed to start:", error);
    process.exit(1);
  }
};

startWorker();
