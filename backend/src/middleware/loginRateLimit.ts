import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis";

// Helper to create a Redis store with a unique prefix per limiter
const createRedisStore = (prefix: string) =>
  new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  });

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore("login"),
  message: {
    message: "Too many login attempts. Please try again later.",
  },
});

export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore("upload"),
  message: {
    message: "Too many upload requests. Please try again later.",
  },
});

export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: createRedisStore("search"),
  message: {
    message: "Too many search requests. Please slow down.",
  },
});
