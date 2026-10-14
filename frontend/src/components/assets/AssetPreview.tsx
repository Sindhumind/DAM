import { Download, X } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import type { Asset } from "../../types/asset";

interface AssetPreviewProps {
  asset: Asset | null;
  previewUrl: string;
  videoUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AssetPreview({
  asset,
  previewUrl,
  videoUrl,
  isOpen,
  onClose,
}: AssetPreviewProps) {
  if (!asset) {
    return null;
  }

  const isVideo = asset.mime_type?.toLowerCase().startsWith("video/");

  const mediaUrl = isVideo ? videoUrl || previewUrl : previewUrl;

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl);

      if (!response.ok) {
        throw new Error("Download failed.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = asset.original_filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(mediaUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={asset.original_filename}
      size="xl"
    >
      <div className="flex max-h-[75vh] flex-col">
        <div className="flex min-h-64 flex-1 items-center justify-center overflow-hidden rounded-lg bg-slate-950">
          {isVideo ? (
            <video
              key={mediaUrl}
              src={mediaUrl}
              controls
              autoPlay
              className="max-h-[65vh] w-full object-contain"
            >
              Your browser does not support video playback.
            </video>
          ) : (
            <img
              src={mediaUrl}
              alt={asset.original_filename}
              className="max-h-[65vh] w-full object-contain"
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {asset.original_filename}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {asset.mime_type} · {asset.status}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              leftIcon={<Download size={16} />}
              onClick={() => void handleDownload()}
            >
              Download
            </Button>

            <Button
              type="button"
              variant="ghost"
              leftIcon={<X size={16} />}
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
