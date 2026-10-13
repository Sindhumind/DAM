
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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
