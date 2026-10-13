import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  Grid2X2,
  List,
  LoaderCircle,
  Play,
  RefreshCw,
  Search,
  Upload,
  Video,
  Image as ImageIcon,
  File as FileIcon,
  X,
  Trash2,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface Asset {
  id: number;
  original_filename: string;
  mime_type: string;
  file_size: number | string;
  storage_key: string;
  status: string;
  created_at: string;
  metadata?: {
    thumbnailKey?: string;
    width?: number;
    height?: number;
    duration?: number;
    [key: string]: unknown;
  } | null;
}

type ViewMode = "grid" | "list";
type AssetFilter = "all" | "image" | "video" | "other";

interface FilePreviewProps {
  file: File;
}


interface FilePreviewProps {
  file: File;
}

function FilePreview({ file }: FilePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (isImage) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = file.name;
      img.className = "h-full w-full object-contain";
      container.replaceChildren(img);
    } else if (isVideo) {
      const video = document.createElement("video");
      video.src = url;
      video.controls = true;
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
      className="flex h-full w-full items-center justify-center overflow-hidden"
    >
      {!file.type.startsWith("image/") && !file.type.startsWith("video/") && (
        <FileIcon size={32} className="text-slate-400" />
      )}
    </div>
  );
}


export default function AssetLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedVideo, setSelectedVideo] = useState<Asset | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/assets`);

      if (!response.ok) {
        throw new Error(`Failed to load assets (${response.status}).`);
      }

      const data = await response.json();

      const assetList: Asset[] = Array.isArray(data)
        ? data
        : Array.isArray(data.assets)
          ? data.assets
          : [];

      setAssets(assetList);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load assets.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load assets on mount and ignore results after unmount.
  useEffect(() => {
    let cancelled = false;

    const fetchAssets = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/assets`);

        if (!response.ok) {
          throw new Error(`Failed to load assets (${response.status}).`);
        }

        const data = await response.json();

        const assetList: Asset[] = Array.isArray(data)
          ? data
          : Array.isArray(data.assets)
            ? data.assets
            : [];

        if (!cancelled) {
          setAssets(assetList);
          setLoadError("");
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Unable to load assets.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatFileSize = (size: number | string) => {
    const bytes = Number(size) || 0;

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString();
  };

  const isVideo = (asset: Asset) =>
    asset.mime_type?.toLowerCase().startsWith("video/");

  const isImage = (asset: Asset) =>
    asset.mime_type?.toLowerCase().startsWith("image/");

  const getPreviewUrl = (asset: Asset) =>
    `${API_BASE_URL}/api/assets/${asset.id}/preview`;

  const getVideoUrl = (asset: Asset) =>
    `${API_BASE_URL}/api/assets/${asset.id}/video`;

  const handleFileSelection = (files: File[]) => {
    setUploadMessage("");
    setUploadError("");

    if (files.length > 10) {
      setSelectedFiles([]);
      setUploadError("You can upload a maximum of 10 files at once.");

      const input = document.getElementById(
        "asset-file-input",
      ) as HTMLInputElement | null;

      if (input) input.value = "";

      return;
    }

    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") || file.type.startsWith("video/"),
    );

    if (validFiles.length !== files.length) {
      setUploadError("Only image and video files are allowed.");
    }

    setSelectedFiles(validFiles);
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove),
    );

    setUploadMessage("");
    setUploadError("");

    if (selectedFiles.length <= 1) {
      const input = document.getElementById(
        "asset-file-input",
      ) as HTMLInputElement | null;

      if (input) input.value = "";
    }
  };

  const handleUpload = async () => {
    setUploadMessage("");
    setUploadError("");

    if (selectedFiles.length === 0) {
      setUploadError("Please select at least one file.");
      return;
    }

    if (selectedFiles.length > 10) {
      setUploadError("You can upload a maximum of 10 files at once.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`${API_BASE_URL}/api/assets/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || `Upload failed with status ${response.status}.`,
        );
      }

      const uploadedCount = selectedFiles.length;

      setSelectedFiles([]);
      setUploadMessage(`${uploadedCount} file(s) uploaded successfully.`);

      const input = document.getElementById(
        "asset-file-input",
      ) as HTMLInputElement | null;

      if (input) input.value = "";

      await loadAssets();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.original_filename
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const mimeType = asset.mime_type?.toLowerCase() || "";

    let matchesFilter = true;

    if (filter === "image") {
      matchesFilter = mimeType.startsWith("image/");
    } else if (filter === "video") {
      matchesFilter = mimeType.startsWith("video/");
    } else if (filter === "other") {
      matchesFilter =
        !mimeType.startsWith("image/") && !mimeType.startsWith("video/");
    }

    return matchesSearch && matchesFilter;
  });

  const renderPreview = (asset: Asset) => (
    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-100">
      {isImage(asset) ? (
        <img
          src={getPreviewUrl(asset)}
          alt={asset.original_filename}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : isVideo(asset) && asset.metadata?.thumbnailKey ? (
        <img
          src={getPreviewUrl(asset)}
          alt={asset.original_filename}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : isVideo(asset) ? (
        <Video size={30} className="text-indigo-500" />
      ) : (
        <FileIcon size={30} className="text-slate-400" />
      )}

      {isVideo(asset) && (
        <button
          type="button"
          aria-label={`Play ${asset.original_filename}`}
          onClick={() => setSelectedVideo(asset)}
          className="absolute inset-0 flex items-center justify-center bg-black/10 transition hover:bg-black/30"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-indigo-600 shadow-md">
            <Play size={23} fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Asset Library</h2>
          <p className="mt-1 text-sm text-slate-500">
            Browse, search, preview, and upload digital assets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAssets()}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Drag-and-drop upload area */}
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!uploading) setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          if (!uploading) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();

          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);

          if (uploading) return;

          handleFileSelection(Array.from(event.dataTransfer.files));
        }}
        className={`mt-6 rounded-xl border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? "border-indigo-600 bg-indigo-50"
            : "border-slate-300 bg-slate-50"
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full ${
              isDragging
                ? "bg-indigo-100 text-indigo-700"
                : "bg-white text-indigo-600"
            }`}
          >
            <Upload size={28} />
          </div>

          <h3 className="font-semibold text-slate-800">
            {isDragging ? "Drop your files here" : "Upload images and videos"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Drag and drop files here, or browse to select them.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Maximum 10 files per upload. Images and videos only.
          </p>

          <input
            id="asset-file-input"
            type="file"
            multiple
            accept="image/*,video/*"
            disabled={uploading}
            onChange={(event) => {
              handleFileSelection(Array.from(event.currentTarget.files ?? []));
            }}
            className="mt-4 block w-full max-w-sm text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          />

          {/* Pre-upload previews */}
          {selectedFiles.length > 0 && (
            <div className="mt-5 w-full rounded-xl border border-slate-200 bg-white p-4 text-left">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="font-semibold text-slate-800">
                  Preview selected files
                </h4>
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  {selectedFiles.length} selected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                  >
                    <div className="flex h-36 items-center justify-center overflow-hidden bg-slate-100">
                      <FilePreview file={file} />
                    </div>

                    <div className="p-2.5">
                      <p
                        title={file.name}
                        className="truncate text-xs font-medium text-slate-700"
                      >
                        {file.name}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500">
                          {formatFileSize(file.size)}
                        </span>

                        <button
                          type="button"
                          title="Remove file"
                          aria-label={`Remove ${file.name}`}
                          disabled={uploading}
                          onClick={() => removeSelectedFile(index)}
                          className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={uploading || selectedFiles.length === 0}
            className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Upload size={17} />
            )}
            {uploading ? "Uploading..." : "Upload files"}
          </button>

          {uploadMessage && (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle size={17} />
              {uploadMessage}
            </p>
          )}

          {uploadError && (
            <p
              role="alert"
              className="mt-3 whitespace-pre-wrap wrap-break-word text-sm text-red-600"
            >
              {uploadError}
            </p>
          )}
        </div>
      </div>

      {/* Search, filters, and view controls */}
      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search assets by filename..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as AssetFilter)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
        >
          <option value="all">All assets</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="other">Other files</option>
        </select>

        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            aria-label="Grid view"
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-2 ${
              viewMode === "grid"
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Grid2X2 size={18} />
          </button>

          <button
            type="button"
            aria-label="List view"
            onClick={() => setViewMode("list")}
            className={`rounded-md p-2 ${
              viewMode === "list"
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Loading and error states */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <LoaderCircle size={20} className="animate-spin" />
          Loading assets...
        </div>
      )}

      {!loading && loadError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => void loadAssets()}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Asset grid or list */}
      {!loading && !loadError && (
        <>
          <div className="mt-4">
            <p className="text-sm text-slate-500">
              Showing {filteredAssets.length} of {assets.length} assets
            </p>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-14 text-center">
              <ImageIcon size={38} className="mx-auto mb-3 text-slate-300" />
              <h3 className="font-semibold text-slate-800">No assets found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filter, or upload a file.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAssets.map((asset) => (
                <article
                  key={asset.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {renderPreview(asset)}

                  <div className="p-4">
                    <h3
                      title={asset.original_filename}
                      className="truncate font-semibold text-slate-800"
                    >
                      {asset.original_filename}
                    </h3>

                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="truncate">
                        {asset.mime_type || "Unknown type"}
                      </span>
                      <span className="shrink-0">
                        {formatFileSize(asset.file_size)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {asset.status || "Uploaded"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(asset.created_at)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-162.5 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Asset</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                            {renderPreview(asset)}
                          </div>
                          <span
                            title={asset.original_filename}
                            className="max-w-xs truncate font-medium text-slate-800"
                          >
                            {asset.original_filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {asset.mime_type}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatFileSize(asset.file_size)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {asset.status || "Uploaded"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(asset.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Video playback modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Video player: ${selectedVideo.original_filename}`}
            className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <h3 className="truncate font-semibold text-slate-800">
                {selectedVideo.original_filename}
              </h3>
              <button
                type="button"
                aria-label="Close video"
                onClick={() => setSelectedVideo(null)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-black">
              <video
                key={selectedVideo.id}
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="max-h-[75vh] w-full"
              >
                <source
                  src={getVideoUrl(selectedVideo)}
                  type={selectedVideo.mime_type}
                />
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
