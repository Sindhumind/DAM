
import bcrypt from "bcryptjs";
import pool from "../config/db";

export interface CreatedUser {
  id: number;
  email: string;
  role: "user";
}

export async function createUser(
  email: string,
  password: string
): Promise<CreatedUser> {
  const normalizedEmail = email.trim().toLowerCase();

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'user')
     RETURNING id, email, role`,
    [normalizedEmail, passwordHash]
  );

  return result.rows[0] as CreatedUser;
}
