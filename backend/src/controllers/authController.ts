
import type { Request, Response, NextFunction } from "express";
import { loginUser } from "../services/authService";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";

const COOKIE_NAME = "accessToken";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const result = await loginUser(email, password);

    if (!result) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    // Store the JWT in an HttpOnly cookie.
    // JavaScript running in the browser cannot read this cookie.
    res.cookie(COOKIE_NAME, result.token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.status(200).json({
      message: "Login successful",
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export function logout(
  _req: Request,
  res: Response,
): void {
  res.clearCookie(COOKIE_NAME, cookieOptions);

  res.status(200).json({
    message: "Logout successful",
  });
}

export function getCurrentSession(
  req: AuthenticatedRequest,
  res: Response,
): void {
  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
    });
    return;
  }

  res.status(200).json({
    user: req.user,
  });
}
