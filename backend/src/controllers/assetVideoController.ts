
import type { Response, NextFunction } from "express";
import pool from "../config/db";
import minioClient, { bucketName } from "../config/minio";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";

export async function streamAssetVideo(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    // This route requires authentication, but all authenticated
    // users can stream any asset.
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const result = await pool.query(
      `SELECT storage_key, mime_type
       FROM assets
       WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }

    const asset = result.rows[0];

    if (!asset.mime_type?.startsWith("video/")) {
      res.status(415).json({ message: "Asset is not a video" });
      return;
    }

    if (!asset.storage_key) {
      res.status(404).json({ message: "Video file not found" });
      return;
    }

    const objectName = asset.storage_key;

    const stat = await minioClient.statObject(
      bucketName,
      objectName
    );

    const fileSize = stat.size;
    const range = req.headers.range;

    res.setHeader("Content-Type", asset.mime_type);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);

      if (!match || (!match[1] && !match[2])) {
        res.status(416).setHeader(
          "Content-Range",
          `bytes */${fileSize}`
        );
        res.end();
        return;
      }

      let start: number;
      let end: number;

      if (!match[1]) {
        const suffixLength = Number(match[2]);

        if (
          !Number.isSafeInteger(suffixLength) ||
          suffixLength <= 0
        ) {
          res.status(416).setHeader(
            "Content-Range",
            `bytes */${fileSize}`
          );
          res.end();
          return;
        }

        start = Math.max(0, fileSize - suffixLength);
        end = fileSize - 1;
      } else {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : fileSize - 1;
      }

      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start >= fileSize ||
        end < start ||
        start < 0
      ) {
        res.status(416).setHeader(
          "Content-Range",
          `bytes */${fileSize}`
        );
        res.end();
        return;
      }

      end = Math.min(end, fileSize - 1);

      res.status(206);
      res.setHeader(
        "Content-Range",
        `bytes ${start}-${end}/${fileSize}`
      );
      res.setHeader("Content-Length", end - start + 1);

      const stream = await minioClient.getPartialObject(
        bucketName,
        objectName,
        start,
        end - start + 1
      );

      stream.on("error", (error) => {
        if (!res.headersSent) {
          next(error);
        } else {
          res.destroy(error);
        }
      });

      stream.pipe(res);
      return;
    }

    res.setHeader("Content-Length", fileSize);

    const stream = await minioClient.getObject(
      bucketName,
      objectName
    );

    stream.on("error", (error) => {
      if (!res.headersSent) {
        next(error);
      } else {
        res.destroy(error);
      }
    });

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}