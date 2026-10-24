import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import multer from "multer";
import type { Server } from "http";
import helmet from "helmet";

import pool from "./config/db";
import assetRoutes from "./routes/assetRoutes";
import authRoutes from "./routes/authRoutes";
import workerRoutes from "./routes/workerRoutes";

import { connectRabbitMQ, closeRabbitMQ } from "./config/rabbitmq";
import { redisClient } from "./config/redis";

dotenv.config();

const app = express();
app.use(helmet());
const frontendUrl =
  process.env.FRONTEND_URL || "http://localhost:5173";

const trustedOrigins = new Set([frontendUrl]);

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Internal worker routes.
app.use("/internal/worker/assets", workerRoutes);

// CSRF protection for browser state-changing requests.
app.use((req, res, next) => {
  const stateChangingMethods = new Set([
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ]);

  if (!stateChangingMethods.has(req.method)) {
    return next();
  }

  const origin = req.get("Origin");

  if (!origin || !trustedOrigins.has(origin)) {
    return res.status(403).json({
      message: "Request origin is not allowed.",
    });
  }

  next();
});

// Health check.
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

// API routes.
app.use("/api/assets", assetRoutes);
app.use("/api/auth", authRoutes);

// Centralized error handling.
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
          message:
            "File is too large. Maximum file size is 500 MB.",
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

    if (error.message.startsWith("Unsupported file type:")) {
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

let httpServer: Server | undefined;
let isShuttingDown = false;

const shutdown = async (
  reason: string,
  exitCode = 0,
): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Shutting down (${reason})...`);

  const forceExit = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10_000);

  forceExit.unref();

  try {
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer!.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await closeRabbitMQ();

    if (redisClient.isOpen) {
      await redisClient.quit();
    }

    await pool.end();
  } catch (error) {
    console.error("Error during shutdown:", error);
    exitCode = 1;
  } finally {
    clearTimeout(forceExit);
    process.exit(exitCode);
  }
};

const startServer = async (): Promise<void> => {
  try {
    console.log("Connecting to Redis...");

    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    console.log("Redis initialization complete");
    console.log("Connecting to RabbitMQ...");

    await connectRabbitMQ();

    console.log("RabbitMQ initialization complete");

    httpServer = app.listen(PORT, () => {
      console.log(`DAM API running on port ${PORT}`);
    });

    httpServer.on("error", (error) => {
      console.error("HTTP server error:", error);
      void shutdown("HTTP server error", 1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await shutdown("startup failure", 1);
  }
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

void startServer();