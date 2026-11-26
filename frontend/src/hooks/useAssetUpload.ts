import { useState } from "react";
import { validateFile } from "../utils/fileValidation";
import { uploadAsset } from "../services/assetService";
import type { UploadMetadata } from "../components/assets/UploadMetadataForm";

const MAX_FILES_PER_BATCH = 10;

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<UploadMetadata>(emptyMetadata);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const selectFiles = (incoming: File[] | FileList | null | undefined) => {
    setUploadError("");

    if (!incoming || incoming.length === 0) return;

    const incomingArray = Array.from(incoming);
    const validFiles: File[] = [];

    for (const file of incomingArray) {
      const error = validateFile(file);
      if (error) {
        setUploadError(`${file.name}: ${error}`);
        return;
      }
      validFiles.push(file);
    }

    setSelectedFiles((previous) => {
      const existingKeys = new Set(
        previous.map((f) => `${f.name}-${f.size}-${f.lastModified}`),
      );
      const uniqueNew = validFiles.filter(
        (f) => !existingKeys.has(`${f.name}-${f.size}-${f.lastModified}`),
      );
      const combined = [...previous, ...uniqueNew];

      if (combined.length > MAX_FILES_PER_BATCH) {
        setUploadError(
          `You can upload up to ${MAX_FILES_PER_BATCH} files at once.`,
        );
        return combined.slice(0, MAX_FILES_PER_BATCH);
      }

      if (combined.length > 0) {
        setMetadata((prevMeta) => ({
          ...prevMeta,
          title: prevMeta.title || combined[0].name.replace(/\.[^/.]+$/, ""),
        }));
      }

      return combined;
    });
  };

  const removeFile = (index: number) => {
    setUploadError("");
    setSelectedFiles((previous) => previous.filter((_, idx) => idx !== index));
  };

  const updateMetadata = (field: keyof UploadMetadata, value: string) => {
    setMetadata((previous) => ({ ...previous, [field]: value }));
  };

  const closeModal = () => {
    if (!uploading) onClose();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || uploading) return;

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
      await uploadAsset(selectedFiles, {
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
    selectedFiles,
    removeFile,
    metadata,
    uploading,
    uploadError,
    setUploadError,
    isDragging,
    setIsDragging,
    selectFiles,
    updateMetadata,
    closeModal,
    handleUpload,
  };
}