
import fs from "fs/promises";
import minioClient, {
  bucketName,
  ensureBucketExists,
} from "../config/minio";

export const saveFile = async (file: Express.Multer.File) => {
  const storageKey = `originals/${file.filename}`;

  try {
    await ensureBucketExists();

    const result = await minioClient.fPutObject(
      bucketName,
      storageKey,
      file.path,
      {
        "Content-Type": file.mimetype,
      }
    );

    console.log("File uploaded to MinIO:", {
      bucket: bucketName,
      storageKey,
      etag: result.etag,
    });

    // Delete the temporary local file after MinIO upload succeeds.
    await fs.unlink(file.path);

    return {
      storedFilename: file.filename,
      storageKey,
      bucketName,
      etag: result.etag,
    };
  } catch (error) {
    console.error("MinIO upload failed:", error);
    throw error;
  }
};
