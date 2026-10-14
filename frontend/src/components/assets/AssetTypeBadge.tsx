import { FileImage, Film, File as FileIcon } from "lucide-react";

interface AssetTypeBadgeProps {
  mimeType: string;
}

export default function AssetTypeBadge({ mimeType }: AssetTypeBadgeProps) {
  const normalizedType = mimeType?.toLowerCase() ?? "";

  let label = "Other";
  let styles = "bg-slate-100 text-slate-600";
  let Icon = FileIcon;

  if (normalizedType.startsWith("image/")) {
    label = "Image";
    styles = "bg-blue-50 text-blue-700";
    Icon = FileImage;
  } else if (normalizedType.startsWith("video/")) {
    label = "Video";
    styles = "bg-purple-50 text-purple-700";
    Icon = Film;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
}
