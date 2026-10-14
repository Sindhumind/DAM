
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import pool from "./config/db";
import assetRoutes from "./routes/assetRoutes";
import { connectRabbitMQ } from "./config/rabbitmq";
import { redisClient } from "./config/redis";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  let database = "disconnected";
  let redis = "disconnected";

  try {
    await pool.query("SELECT 1");
    database = "connected";
  } catch (error) {
    console.error("DATABASE ERROR:", error);
  }

  try {
    if (redisClient.isReady) {
      await redisClient.ping();
      redis = "connected";
    }
  } catch (error) {
    console.error("REDIS ERROR:", error);
  }

  const status =
    database === "connected" && redis === "connected"
      ? "ok"
      : "error";

  res.status(status === "ok" ? 200 : 503).json({
    status,
    database,
    redis,
  });
});

app.use("/api/assets", assetRoutes);

// Centralized error handling for uploads and API requests.
// Keep this middleware after the routes.
app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          message: "File is too large. Maximum file size is 500 MB.",
        });
      }

      if (
        error.code === "LIMIT_FILE_COUNT" ||
        error.code === "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({
          message:
            "Invalid file selection. You can upload a maximum of 10 files at once.",
        });
      }

      return res.status(400).json({
        message: "Invalid file upload. Please check your selected files.",
      });
    }

    if (
      error.message.startsWith("Unsupported file type:")
    ) {
      return res.status(400).json({
        message:
          "Unsupported file type. Upload JPG, PNG, WEBP, MP4, MOV, or WEBM files.",
      });
    }

    console.error("Unhandled API error:", error.message);

    return res.status(500).json({
      message:
        "An unexpected server error occurred. Please try again later.",
    });
  },
);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await redisClient.connect();
    console.log("Redis initialization complete");

    await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`DAM API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    if (redisClient.isOpen) {
      await redisClient.quit().catch(() => {});
    }

    process.exit(1);
  }
};

startServer();
