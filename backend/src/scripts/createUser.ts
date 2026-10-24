import "dotenv/config";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import pool from "../config/db";

async function createUser() {
  const rl = readline.createInterface({ input, output });

  try {
    const email = (
      await rl.question("Enter user email: ")
    ).trim().toLowerCase();

    const password = await rl.question("Enter user password: ");

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    if (password.length < 12) {
      throw new Error("Password must be at least 12 characters.");
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rowCount && existingUser.rowCount > 0) {
      console.log("A user with this email already exists. No changes made.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'user')
       RETURNING id, email, role`,
      [email, passwordHash]
    );

    console.log("User account created successfully:");
    console.log(result.rows[0]);
  } finally {
    rl.close();
  }
}

createUser()
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    console.error("User creation failed:", message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });