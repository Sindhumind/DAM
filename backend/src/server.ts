import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db";
import assetRoutes from "./routes/assetRoutes";
import { connectRabbitMQ } from "./config/rabbitmq";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("DATABASE ERROR:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.use("/api/assets", assetRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`DAM API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();