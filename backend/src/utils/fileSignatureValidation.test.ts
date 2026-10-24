
import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { validateFileSignature } from "./fileSignatureValidation";

let tempDir = "";

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = "";
  }
});

async function createFile(
  name: string,
  bytes: number[],
): Promise<string> {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "dam-test-"));
  const filePath = path.join(tempDir, name);
  await writeFile(filePath, Buffer.from(bytes));
  return filePath;
}

describe("validateFileSignature", () => {
  it("accepts a valid PNG signature", async () => {
    const file = await createFile("image.png", [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);

    await expect(
      validateFileSignature(file, "image/png", "image.png"),
    ).resolves.toBe(true);
  });

  it("rejects a PNG declared as JPEG", async () => {
    const file = await createFile("image.png", [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);

    await expect(
      validateFileSignature(file, "image/jpeg", "image.png"),
    ).resolves.toBe(false);
  });

  it("rejects an unsupported extension", async () => {
    const file = await createFile("image.txt", [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);

    await expect(
      validateFileSignature(file, "image/png", "image.txt"),
    ).resolves.toBe(false);
  });

  it("rejects an unrecognized signature", async () => {
    const file = await createFile("unknown.png", [
      0x00, 0x01, 0x02, 0x03, 0x04,
    ]);

    await expect(
      validateFileSignature(file, "image/png", "unknown.png"),
    ).resolves.toBe(false);
  });
});
