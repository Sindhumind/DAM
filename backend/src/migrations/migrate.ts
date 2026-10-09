import fs from "fs";
import path from "path";
import pool from "../config/db";

const migrationsPath = path.join(process.cwd(), "migrations");

async function migrate() {
  const client = await pool.connect();

  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const files = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const result = await client.query(
        "SELECT id FROM migrations WHERE filename = $1",
        [file]
      );

      if (result.rowCount && result.rowCount > 0) {
        console.log(`Skipping: ${file}`);
        continue;
      }

      const filePath = path.join(migrationsPath, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`Running: ${file}`);

      await client.query("BEGIN");

      try {
        await client.query(sql);

        await client.query(
          "INSERT INTO migrations (filename) VALUES ($1)",
          [file]
        );

        await client.query("COMMIT");

        console.log(`Completed: ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("All migrations completed.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();