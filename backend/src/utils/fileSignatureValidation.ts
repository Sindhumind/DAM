
import path from "node:path";

const allowedTypes: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/webm": [".webm"],
};

export async function validateFileSignature(
  filePath: string,
  declaredMimeType: string,
  originalName: string,
): Promise<boolean> {
  const { fileTypeFromFile } = await import("file-type");
  const detected = await fileTypeFromFile(filePath);

  if (!detected || detected.mime !== declaredMimeType) {
    return false;
  }

  const extensions = allowedTypes[detected.mime];

  return Boolean(
    extensions?.includes(
      path.extname(originalName).toLowerCase(),
    ),
  );
}