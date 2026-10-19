import { X } from "lucide-react";
import UploadDropzone from "./UploadDropzone";
import UploadMetadataForm from "./UploadMetadataForm";
import SelectedUploadFile from "./SelectedUploadFile";
import UploadModalFooter from "./UploadModalFooter";
import useAssetUpload from "../../hooks/useAssetUpload";

interface AssetUploaderProps {
  onUploadComplete: () => void | Promise<void>;
  onClose: () => void;
}

export default function AssetUploader({
  onUploadComplete,
  onClose,
}: AssetUploaderProps) {
  const {
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
  } = useAssetUpload({ onUploadComplete, onClose });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !uploading) {
          closeModal();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="upload-modal-title" className="text-xl font-semibold text-slate-900">
              Upload asset
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a file and add metadata before uploading.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={uploading}
            aria-label="Close upload modal"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <UploadDropzone
          uploading={uploading}
          isDragging={isDragging}
          onSelect={selectFile}
          onDraggingChange={setIsDragging}
          onError={setUploadError}
        />

        {selectedFile && (
          <SelectedUploadFile
            file={selectedFile}
            uploading={uploading}
            onRemove={() => setSelectedFile(null)}
          />
        )}

        <UploadMetadataForm
          metadata={metadata}
          uploading={uploading}
          onChange={updateMetadata}
        />

        {uploadError && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {uploadError}
          </p>
        )}

        <UploadModalFooter
          uploading={uploading}
          hasFile={Boolean(selectedFile)}
          onCancel={closeModal}
          onUpload={() => void handleUpload()}
        />
      </div>
    </div>
  );
}