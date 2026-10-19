
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db";

export interface AuthUser {
  id: number;
  email: string;
  role: "admin" | "user";
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string } | null> {
  const result = await pool.query(
    `SELECT id, email, password_hash, role
     FROM users
     WHERE email = $1`,
    [email.trim().toLowerCase()]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  const passwordMatches = await bcrypt.compare(
    password,
    row.password_hash
  );

  if (!passwordMatches) {
    return null;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const user: AuthUser = {
    id: Number(row.id),
    email: row.email,
    role: row.role,
  };

  const token = jwt.sign(
    {
      email: user.email,
      role: user.role,
    },
    secret,
    {
      subject: String(user.id),
      expiresIn: "30m",
    }
  );

  return { user, token };
}
