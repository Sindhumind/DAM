import { useCallback } from "react";
import Modal from "../common/Modal";
import type { Asset } from "../../types/asset";
import AssetPreviewMedia from "./AssetPreviewMedia";
import AssetPreviewFooter from "./AssetPreviewFooter";

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
  const isVideo = asset?.mime_type?.toLowerCase().startsWith("video/") ?? false;

  const mediaUrl = isVideo ? videoUrl || previewUrl : previewUrl;

  const handleDownload = useCallback(async () => {
    if (!asset) return;

    let objectUrl: string | null = null;

    try {
      const response = await fetch(mediaUrl, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`,
        );
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("The downloaded file is empty.");
      }

      objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = asset.original_filename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }, 1000);

      objectUrl = null;
    } catch (error) {
      console.error("Asset download failed:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to download the asset. Please try again.",
      );
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }, [asset, mediaUrl]);

  if (!asset) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={asset.original_filename}
      size="xl"
    >
      <div className="flex max-h-[75vh] flex-col">
        <AssetPreviewMedia
          key={`${asset.id}-${mediaUrl}`}
          isVideo={isVideo}
          mediaUrl={mediaUrl}
          filename={asset.original_filename}
        />

        <AssetPreviewFooter
          asset={asset}
          onDownload={() => void handleDownload()}
          onClose={onClose}
        />
      </div>
    </Modal>
  );
}