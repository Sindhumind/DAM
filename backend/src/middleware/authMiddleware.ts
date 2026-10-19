
import type {
  Request,
  Response,
  NextFunction,
} from "express";
import jwt from "jsonwebtoken";

export type UserRole = "admin" | "user";

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

function isValidRole(role: unknown): role is UserRole {
  return role === "admin" || role === "user";
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    res.status(500).json({
      message: "Authentication is not configured",
    });
    return;
  }

  // Prefer the HttpOnly cookie.
  // Bearer-token support remains temporarily for migration.
  const cookieToken = req.cookies?.accessToken;

  const authorization = req.headers.authorization;
  const [scheme, bearerToken, ...extraParts] =
    authorization?.trim().split(/\s+/) ?? [];

  const token =
    typeof cookieToken === "string" && cookieToken.length > 0
      ? cookieToken
      : scheme === "Bearer" &&
          typeof bearerToken === "string" &&
          bearerToken.length > 0 &&
          extraParts.length === 0
        ? bearerToken
        : undefined;

  if (!token) {
    res.status(401).json({
      message: "Authentication required",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      !/^[1-9]\d*$/.test(decoded.sub) ||
      !isValidRole(decoded.role) ||
      typeof decoded.email !== "string" ||
      !decoded.email.trim()
    ) {
      res.status(401).json({
        message: "Invalid authentication token",
      });
      return;
    }

    const userId = Number(decoded.sub);

    if (!Number.isSafeInteger(userId)) {
      res.status(401).json({
        message: "Invalid authentication token",
      });
      return;
    }

    req.user = {
      id: userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired authentication token",
    });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      message: "Administrator access required",
    });
    return;
  }

  next();
}
