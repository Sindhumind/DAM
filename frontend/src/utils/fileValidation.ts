
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/webm": [".webm"],
};

export const ACCEPTED_FILE_EXTENSIONS = Object.values(
  ACCEPTED_FILE_TYPES,
)
  .flat()
  .join(",");

export function validateFile(file: File): string | null {
  if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
    return "Unsupported file type. Upload JPG, PNG, WEBP, MP4, MOV, or WEBM files.";
  }

  if (file.size === 0) {
    return "The selected file is empty.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "File size must not exceed 500 MB.";
  }

  return null;
}
