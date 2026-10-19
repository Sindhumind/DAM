
import { Client } from "minio";
import dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.MINIO_ENDPOINT || "localhost";
const port = Number(process.env.MINIO_PORT || 9000);
const useSSL = process.env.MINIO_USE_SSL === "true";
export const bucketName = process.env.MINIO_BUCKET || "dam-assets";

export const minioClient = new Client({
  endPoint: endpoint,
  port,
  useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
});

export async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(bucketName);

  if (!exists) {
    await minioClient.makeBucket(bucketName);
    console.log(`MinIO bucket created: ${bucketName}`);
  }
}