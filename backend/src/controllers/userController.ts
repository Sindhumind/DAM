
import type { Request, Response, NextFunction } from "express";
import { createUser } from "../services/userService";

export async function createUserAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      normalizedEmail.length > 255 ||
      !emailPattern.test(normalizedEmail)
    ) {
      res.status(400).json({
        message: "Please provide a valid email address",
      });
      return;
    }

    if (password.length < 12 || password.length > 128) {
      res.status(400).json({
        message: "Password must be between 12 and 128 characters",
      });
      return;
    }

    const user = await createUser(normalizedEmail, password);

    res.status(201).json({
      message: "User account created successfully",
      user,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({
        message: "An account with this email already exists",
      });
      return;
    }

    next(error);
  }
}
