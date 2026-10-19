import { useState } from "react";
import { validateFile } from "../utils/fileValidation";
import { uploadAsset } from "../services/assetService";
import type { UploadMetadata } from "../components/assets/UploadMetadataForm";

const emptyMetadata: UploadMetadata = {
  title: "",
  description: "",
  category: "",
  tags: "",
};

interface UseAssetUploadOptions {
  onUploadComplete: () => void | Promise<void>;
  onClose: () => void;
}

export default function useAssetUpload({
  onUploadComplete,
  onClose,
}: UseAssetUploadOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<UploadMetadata>(emptyMetadata);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const selectFile = (file?: File) => {
    setUploadError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const error = validateFile(file);

    if (error) {
      setSelectedFile(null);
      setUploadError(error);
      return;
    }

    setSelectedFile(file);
    setMetadata((previous) => ({
      ...previous,
      title: previous.title || file.name.replace(/\.[^/.]+$/, ""),
    }));
  };

  const updateMetadata = (field: keyof UploadMetadata, value: string) => {
    setMetadata((previous) => ({ ...previous, [field]: value }));
  };

  const closeModal = () => {
    if (!uploading) onClose();
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;

    const tags = metadata.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!metadata.title.trim()) {
      setUploadError("Title is required.");
      return;
    }
    if (metadata.title.trim().length > 150) {
      setUploadError("Title must be 150 characters or fewer.");
      return;
    }
    if (metadata.category.trim().length > 150) {
      setUploadError("Category must be 150 characters or fewer.");
      return;
    }
    if (metadata.description.length > 2000) {
      setUploadError("Description must be 2000 characters or fewer.");
      return;
    }
    if (tags.length > 20 || tags.some((tag) => tag.length > 50)) {
      setUploadError("Use up to 20 tags, each no longer than 50 characters.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      await uploadAsset(selectedFile, {
        title: metadata.title.trim(),
        description: metadata.description.trim(),
        category: metadata.category.trim(),
        tags,
      });
      await onUploadComplete();
      onClose();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return {
    selectedFile,
    setSelectedFile,
    metadata,
    uploading,
    uploadError,
    setUploadError,
    isDragging,
    setIsDragging,
    selectFile,
    updateMetadata,
    closeModal,
    handleUpload,
  };
}