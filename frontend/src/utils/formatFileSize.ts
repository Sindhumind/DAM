
export default function formatFileSize(
  size: number | string,
): string {
  const bytes = Number(size);

  if (!Number.isFinite(bytes) || bytes < 0) {
    return "Unknown size";
  }

  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const formattedSize = bytes / Math.pow(1024, unitIndex);

  return `${formattedSize.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}
