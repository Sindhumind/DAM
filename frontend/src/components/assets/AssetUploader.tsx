import Modal from "../common/Modal";
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
    selectedFiles,
    removeFile,
    metadata,
    uploading,
    uploadError,
    isDragging,
    setIsDragging,
    selectFiles,
    updateMetadata,
    closeModal,
    handleUpload,
  } = useAssetUpload({ onUploadComplete, onClose });

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!uploading) closeModal();
      }}
      title="Upload assets"
      size="lg"
    >
      <p className="mb-4 text-sm text-slate-500">
        Select up to 10 files and add metadata before uploading.
      </p>

      <UploadDropzone
        uploading={uploading}
        isDragging={isDragging}
        onSelect={selectFiles}
        onDraggingChange={setIsDragging}
      />

      {selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedFiles.map((file, index) => (
            <SelectedUploadFile
              key={`${file.name}-${file.size}-${file.lastModified}`}
              file={file}
              uploading={uploading}
              onRemove={() => removeFile(index)}
            />
          ))}
        </div>
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
        hasFile={selectedFiles.length > 0}
        onCancel={closeModal}
        onUpload={() => void handleUpload()}
      />
    </Modal>
  );
}