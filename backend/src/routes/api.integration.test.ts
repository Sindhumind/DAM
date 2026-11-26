import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock external infrastructure dependencies before importing routes
vi.mock("../config/db", () => ({
  default: {
    query: vi.fn(),
  },
}));

vi.mock("../config/redis", () => ({
  redisClient: {
    isOpen: false,
    isReady: false,
    sendCommand: vi.fn(),
  },
}));

vi.mock("rate-limit-redis", () => {
  return {
    RedisStore: class MockRedisStore {
      init() {}
      async increment() {
        return { totalHits: 1, resetTime: new Date(Date.now() + 60_000) };
      }
      async decrement() {}
      async resetKey() {}
    },
  };
});

vi.mock("../config/rabbitmq", () => ({
  publishAssetUploaded: vi.fn(),
}));

vi.mock("../services/authService", () => ({
  loginUser: vi.fn(),
}));

vi.mock("../services/assetService", () => ({
  getAssetsService: vi.fn(),
  getDashboardStatsService: vi.fn(),
  createAssetService: vi.fn(),
  updateAssetMetadataService: vi.fn(),
  deleteAssetService: vi.fn(),
}));

import authRoutes from "./authRoutes";
import assetRoutes from "./assetRoutes";
import { openApiSpec } from "../config/swagger";
import { loginUser } from "../services/authService";
import { getAssetsService } from "../services/assetService";

const TEST_JWT_SECRET = "test-secret-key-for-integration-tests";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.get("/api-docs.json", (_req, res) => res.json(openApiSpec));
  app.use("/api/auth", authRoutes);
  app.use("/api/assets", assetRoutes);
  return app;
}

describe("Backend API Integration Tests", () => {
  const app = createTestApp();

  beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  });

  it("serves OpenAPI specification at GET /api-docs.json", async () => {
    const res = await request(app).get("/api-docs.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.paths["/api/assets"]).toBeDefined();
  });

  it("rejects unauthenticated requests to GET /api/assets with 401", async () => {
    const res = await request(app).get("/api/assets");

    expect(res.status).toBe(401);
  });

  it("sets HttpOnly accessToken cookie on valid POST /api/auth/login", async () => {
    vi.mocked(loginUser).mockResolvedValueOnce({
      user: { id: 1, email: "user@example.com", role: "user" },
      token: "mock-jwt-token",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("user@example.com");
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const authCookie = Array.isArray(cookies) ? cookies[0] : String(cookies);
     expect(authCookie).toContain("accessToken=mock-jwt-token");
     expect(authCookie).toContain("HttpOnly");
  });

  it("returns 401 on invalid credentials at POST /api/auth/login", async () => {
    vi.mocked(loginUser).mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("allows authenticated users to list assets at GET /api/assets", async () => {
    const validToken = jwt.sign(
      { email: "user@example.com", role: "user" },
      TEST_JWT_SECRET,
      { subject: "1", expiresIn: "1h" },
    );

    vi.mocked(getAssetsService).mockResolvedValueOnce({
      assets: [],
      total: 0,
      page: 1,
      limit: 8,
      totalPages: 0,
    });

    const res = await request(app)
      .get("/api/assets")
      .set("Cookie", [`accessToken=${validToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.assets).toEqual([]);
    expect(getAssetsService).toHaveBeenCalledWith(1, 8, "", "all", {
      userId: 1,
      role: "user",
    });
  });
});