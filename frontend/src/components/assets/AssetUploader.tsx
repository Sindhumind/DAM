import { useEffect, useRef, useState } from "react";
import { CheckCircle, File as FileIcon, Trash2, Upload } from "lucide-react";

import Button from "../common/Button";
import {
  ACCEPTED_FILE_EXTENSIONS,
  validateFile,
} from "../../utils/fileValidation";
import formatFileSize from "../../utils/formatFileSize";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface AssetUploaderProps {
  onUploadComplete: () => void | Promise<void>;
}

function FilePreview({ file }: { file: File }) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = previewRef.current;

    if (!container) return;

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      const image = document.createElement("img");
      image.src = url;
      image.alt = file.name;
      image.className = "h-full w-full object-contain";
      container.replaceChildren(image);
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = url;
      video.preload = "metadata";
      video.className = "h-full w-full object-contain";
      container.replaceChildren(video);
    }

    return () => {
      URL.revokeObjectURL(url);
      container.replaceChildren();
    };
  }, [file]);

  return (
    <div
      ref={previewRef}
      className="flex h-full w-full items-center justify-center"
    >
      {!file.type.startsWith("image/") && !file.type.startsWith("video/") && (
        <FileIcon size={24} className="text-slate-400" />
      )}
    </div>
  );
}

export default function AssetUploader({
  onUploadComplete,
}: AssetUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const selectFile = (file?: File) => {
    setUploadMessage("");
    setUploadError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      setSelectedFile(null);
      setUploadError(validationError);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setUploadMessage("");
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("files", selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/assets/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Upload failed. Please try again.";

        if (response.status === 413) {
          message = "File is too large. Please choose a smaller file.";
        } else if (response.status >= 500) {
          message = "Server error. Please try again later.";
        } else {
          try {
            const contentType = response.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
              const result = await response.json();
              message = result.message || message;
            } else if (response.status === 400 || response.status === 415) {
              message =
                "Unsupported file type. Upload JPG, PNG, WEBP, MP4, MOV, or WEBM files.";
            }
          } catch {
            // Keep the friendly default error message.
          }
        }

        throw new Error(message);
      }

      setSelectedFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setUploadMessage("File uploaded successfully.");

      await onUploadComplete();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (uploading) return;

    const files = Array.from(event.dataTransfer.files);

    if (files.length > 1) {
      setUploadMessage("");
      setUploadError("Please select only one file at a time.");
      return;
    }

    selectFile(files[0]);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();

        if (!uploading) {
          setIsDragging(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
      className={`rounded-xl border-2 border-dashed p-4 transition-colors sm:p-5 ${
        isDragging
          ? "border-indigo-500 bg-indigo-50"
          : "border-slate-300 bg-white hover:border-indigo-300"
      }`}
    >
      <div className="flex flex-col items-center text-center">

        <h3 className="text-sm font-semibold text-slate-800">
          {isDragging ? "Drop your file here" : "Upload an image or video"}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Drag and drop a file, or browse your computer.
        </p>

        <p className="mt-1 text-xs text-slate-400">
          JPG, PNG, WEBP, MP4, MOV, WEBM · One file per upload · Max 500 MB
        </p>

        <input
          ref={inputRef}
          id="dam-file-input"
          type="file"
          accept={ACCEPTED_FILE_EXTENSIONS}
          disabled={uploading}
          onChange={(event) => selectFile(event.currentTarget.files?.[0])}
          className="hidden"
        />

        <Button
          type="button"
          variant="secondary"
          leftIcon={<Upload size={15} />}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mt-3"
        >
          Browse files
        </Button>
      </div>

      {selectedFile && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
            <FilePreview file={selectedFile} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">
              {selectedFile.name}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>

          <button
            type="button"
            title="Remove file"
            aria-label="Remove selected file"
            disabled={uploading}
            onClick={() => {
              setSelectedFile(null);
              setUploadMessage("");
              setUploadError("");

              if (inputRef.current) {
                inputRef.current.value = "";
              }
            }}
            className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {uploadError && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {uploadError}
        </p>
      )}

      {uploadMessage && (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 text-sm text-emerald-700"
        >
          <CheckCircle size={17} />
          {uploadMessage}
        </p>
      )}

      <div className="mt-4 flex flex-col items-center gap-2">
        <Button
          type="button"
          loading={uploading}
          disabled={!selectedFile || uploading}
          onClick={() => void handleUpload()}
          leftIcon={<Upload size={17} />}
        >
          {uploading ? "Uploading..." : "Upload file"}
        </Button>

        {uploading && (
          <p className="text-xs text-slate-500">
            Please wait while your file is uploaded.
          </p>
        )}
      </div>
    </div>
  );
}
