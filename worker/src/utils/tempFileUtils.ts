
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";

export function createTempFilePath(extension: string): string {
  const safeExtension = extension.startsWith(".")
    ? extension
    : `.${extension}`;

  return path.join(
    os.tmpdir(),
    `dam-${randomUUID()}${safeExtension}`
  );
}

export async function removeTempFile(
  filePath: string | undefined
): Promise<void> {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code !== "ENOENT") {
      console.error(`Could not remove temporary file ${filePath}:`, error);
    }
  }
}
