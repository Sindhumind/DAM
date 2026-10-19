import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";

export function authenticateWorker(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const expectedToken = process.env.WORKER_API_TOKEN;
  const authorization = req.headers.authorization;

  if (!expectedToken) {
    res.status(500).json({
      message: "Worker authentication is not configured",
    });
    return;
  }

  const match = /^Bearer ([^\s]+)$/.exec(
    authorization ?? ""
  );

  if (!match) {
    res.status(401).json({
      message: "Worker authentication required",
    });
    return;
  }

  const providedToken = match[1];

  const expectedBuffer = Buffer.from(expectedToken, "utf8");
  const providedBuffer = Buffer.from(providedToken, "utf8");

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    res.status(401).json({
      message: "Invalid worker credentials",
    });
    return;
  }

  next();
}
