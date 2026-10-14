import type { Asset } from "../../types/asset";

interface AssetMetadataProps {
  asset: Asset;
}

function formatDuration(seconds?: number): string {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return "";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function AssetMetadata({ asset }: AssetMetadataProps) {
  const metadata = asset.metadata;

  const dimensions =
    metadata?.width && metadata?.height
      ? `${metadata.width} × ${metadata.height}`
      : "";

  const duration = formatDuration(metadata?.duration);

  if (!dimensions && !duration) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      {dimensions && <span>{dimensions}</span>}
      {duration && <span>Duration: {duration}</span>}
    </div>
  );
}
